import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import type { ProtocolMessageCertificate } from "@mysten/walrus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAppContext } from "../app/context";
import { useCurrentEpoch } from "./useCurrentEpoch";

// Type definitions for clarity
interface BlobObject {
	objectId: string;
	type: string;
	objectType: string;
}

export interface BlobMetadata {
	blobId: string;
	blobDigest: () => Promise<Uint8Array<ArrayBufferLike>>;
	nonce: Uint8Array<ArrayBufferLike>;
	rootHash: Uint8Array<ArrayBufferLike>;
}

export interface RegistrationData {
	blobId: string;
	nonce: Uint8Array<ArrayBufferLike>;
	fileBytes: Uint8Array;
	blobObject: BlobObject;
	registerDigest: string;
	epochs: number;
	deletable: boolean;
}

export interface uploadRelayData {
	blobId: string;
	blobObject: BlobObject;
	certificate: ProtocolMessageCertificate;
	deletable: boolean;
}

export interface UploadResult {
	blobId: string;
	suiObjectId: string;
	suiEventId: string;
	endEpoch: number;
}

export type UploadStep = "register" | "relay" | "certify";

/**
 * Hook for managing the Walrus blob upload process
 *
 * This hook provides a clean interface for the three-step Walrus upload process:
 * 1. Register blob on-chain
 * 2. Write blob data to the upload relay (storage nodes)
 * 3. Certify the blob on-chain
 *
 * @returns Object containing upload state and step functions
 */
export function useWalrusUpload() {
	const { walrusClient } = useAppContext();
	const suiClient = useSuiClient();
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
	const queryClient = useQueryClient();
	const { data: currentEpoch } = useCurrentEpoch();

	// State management for the upload process
	const [currentStep, setCurrentStep] = useState<UploadStep>("register");
	const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
	const [uploadRelayData, setUploadRelayData] = useState<uploadRelayData | null>(null);
	const [error, setError] = useState<string | null>(null);

	// File and metadata state
	const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
	const [metadata, setMetadata] = useState<BlobMetadata | null>(null);
	const [isComputingMetadata, setIsComputingMetadata] = useState(false);

	// Compute metadata for a file
	const computeMetadata = async (file: File) => {
		setIsComputingMetadata(true);
		setError(null);

		try {
			// Convert file to bytes
			const fileBuffer = await file.arrayBuffer();
			const bytes = new Uint8Array(fileBuffer);

			// Compute metadata using Walrus client
			const computedMetadata = await walrusClient.computeBlobMetadata({
				bytes,
			});

			// Store both bytes and metadata
			setFileBytes(bytes);
			setMetadata(computedMetadata);

			return { bytes, metadata: computedMetadata };
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to compute metadata";
			setError(errorMessage);
			setFileBytes(null);
			setMetadata(null);
			throw error;
		} finally {
			setIsComputingMetadata(false);
		}
	};

	// Step 1: Register blob on-chain
	const registerBlobMutation = useMutation({
		mutationFn: async ({ epochs, deletable }: { epochs: number; deletable: boolean }) => {
			if (!currentAccount) {
				throw new Error("No account connected");
			}

			if (!fileBytes || !metadata) {
				throw new Error("No file or metadata available. Please compute metadata first.");
			}

			const blobDigest = await metadata.blobDigest();
			const transaction = new Transaction();

			// Add tip for upload relay nodes
			transaction.add(
				walrusClient.sendUploadRelayTip({
					size: fileBytes.length,
					blobDigest,
					nonce: metadata.nonce,
				}),
			);

			// Register blob on-chain
			const registerBlobTransaction = walrusClient.registerBlobTransaction({
				transaction,
				blobId: metadata.blobId,
				rootHash: metadata.rootHash,
				size: fileBytes.length,
				deletable: deletable,
				epochs: epochs,
				owner: currentAccount.address,
			});
			registerBlobTransaction.setSender(currentAccount.address);

			// Execute transaction
			const { digest: registerDigest } = await signAndExecuteTransaction({
				transaction: registerBlobTransaction,
			});

			// Wait for transaction confirmation
			const { objectChanges, effects } = await suiClient.waitForTransaction({
				digest: registerDigest,
				options: { showObjectChanges: true, showEffects: true },
			});

			if (effects?.status.status !== "success") {
				throw new Error("Failed to register blob");
			}

			// Find the created blob object
			const blobType = await walrusClient.getBlobType();
			const blobObject = objectChanges?.find(
				(change) => change.type === "created" && change.objectType === blobType,
			);

			if (!blobObject || blobObject.type !== "created") {
				throw new Error("Blob object not found");
			}

			// Return data needed for next steps
			return {
				blobId: metadata.blobId,
				nonce: metadata.nonce,
				fileBytes,
				blobObject,
				registerDigest,
				epochs,
				deletable,
			};
		},
		onSuccess: (data) => {
			setRegistrationData(data);
			setCurrentStep("relay");
			setError(null);
			// Invalidate balance queries after successful registration
			if (currentAccount?.address) {
				queryClient.invalidateQueries({
					queryKey: ["suiBalance", currentAccount.address],
				});
				queryClient.invalidateQueries({
					queryKey: ["walBalance", currentAccount.address],
				});
			}
		},
		onError: (error: Error) => {
			setError(error.message);
		},
	});

	// Step 2: Write blob to upload relay (storage nodes)
	const writeToUploadRelayMutation = useMutation({
		mutationFn: async () => {
			if (!registrationData) {
				throw new Error("No registration data available");
			}

			// Write blob data to storage nodes via upload relay
			const result = await walrusClient.writeBlobToUploadRelay({
				blobId: registrationData.blobId,
				blob: registrationData.fileBytes,
				nonce: registrationData.nonce,
				txDigest: registrationData.registerDigest,
				deletable: registrationData.deletable,
				blobObjectId: registrationData.blobObject.objectId,
			});

			return {
				blobId: registrationData.blobId,
				blobObject: registrationData.blobObject,
				certificate: result.certificate,
				deletable: registrationData.deletable,
			};
		},
		onSuccess: (data) => {
			setUploadRelayData(data);
			setCurrentStep("certify");
			setError(null);
		},
		onError: (error: Error) => {
			setError(error.message);
		},
	});

	// Step 3: Certify blob on-chain
	const certifyBlobMutation = useMutation({
		mutationFn: async () => {
			if (!currentEpoch) {
				throw new Error("Current epoch not available");
			}

			if (!currentAccount) {
				throw new Error("No account connected");
			}

			if (!uploadRelayData || !registrationData) {
				throw new Error("Missing required data for certification");
			}

			// Certify blob on-chain with the certificate from storage nodes
			const certifyBlobTransaction = walrusClient.certifyBlobTransaction({
				blobId: uploadRelayData.blobId,
				blobObjectId: uploadRelayData.blobObject.objectId,
				certificate: uploadRelayData.certificate,
				deletable: uploadRelayData.deletable,
			});

			const { digest: certifyDigest } = await signAndExecuteTransaction({
				transaction: certifyBlobTransaction,
			});

			// Wait for transaction confirmation
			const { effects: certifyEffects } = await suiClient.waitForTransaction({
				digest: certifyDigest,
				options: { showEffects: true },
			});

			if (certifyEffects?.status.status !== "success") {
				throw new Error("Failed to certify blob");
			}

			// Return final upload result
			return {
				blobId: uploadRelayData.blobId,
				suiObjectId: uploadRelayData.blobObject.objectId,
				suiEventId: certifyDigest,
				endEpoch: currentEpoch + registrationData.epochs,
			};
		},
		onSuccess: () => {
			// Invalidate balance queries after successful certification
			if (currentAccount?.address) {
				queryClient.invalidateQueries({
					queryKey: ["suiBalance", currentAccount.address],
				});
				queryClient.invalidateQueries({
					queryKey: ["walBalance", currentAccount.address],
				});
			}
		},
		onError: (error: Error) => {
			setError(error.message);
		},
	});

	// Reset function to clear all state
	const reset = () => {
		setCurrentStep("register");
		setRegistrationData(null);
		setUploadRelayData(null);
		setError(null);
		setFileBytes(null);
		setMetadata(null);
		setIsComputingMetadata(false);
	};

	return {
		// Current state
		currentStep,
		registrationData,
		uploadRelayData,
		error,

		// File and metadata state
		fileBytes,
		metadata,
		isComputingMetadata,

		// Functions
		computeMetadata,
		registerBlob: registerBlobMutation.mutateAsync,
		writeToUploadRelay: writeToUploadRelayMutation.mutateAsync,
		certifyBlob: certifyBlobMutation.mutateAsync,

		// Mutation states for UI feedback
		isRegistering: registerBlobMutation.isPending,
		isWritingToUploadRelay: writeToUploadRelayMutation.isPending,
		isCertifying: certifyBlobMutation.isPending,

		// Utility functions
		reset,
	};
}
