import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { WalrusFile, type WriteFilesFlow } from "@mysten/walrus";
import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReducer } from "react";
import { useAppContext } from "../app/context";

/**
 * Helper function to invalidate balance queries after transactions
 */
const invalidateBalanceQueries = (queryClient: QueryClient, address: string) => {
	queryClient.invalidateQueries({
		queryKey: ["suiBalance", address],
	});
	queryClient.invalidateQueries({
		queryKey: ["walBalance", address],
	});
};

export type UploadStates =
	| { status: "idle" }
	| { status: "encoding"; writeFileFlow: WriteFilesFlow }
	| { status: "can-register"; writeFileFlow: WriteFilesFlow }
	| { status: "registering"; writeFileFlow: WriteFilesFlow }
	| { status: "can-relay"; writeFileFlow: WriteFilesFlow; digest: string }
	| { status: "relaying"; writeFileFlow: WriteFilesFlow }
	| { status: "can-certify"; writeFileFlow: WriteFilesFlow }
	| { status: "certifying"; writeFileFlow: WriteFilesFlow }
	| { status: "error"; message: string };

export type UploadActions =
	| { type: "encode"; writeFileFlow: WriteFilesFlow }
	| { type: "encoded" }
	| { type: "register"; epochs: number; deletable: boolean }
	| { type: "registered"; digest: string }
	| { type: "relay" }
	| { type: "relayed" }
	| { type: "certify" }
	| { type: "certified" }
	| { type: "error"; message: string }
	| { type: "reset" };

export const uploadReducer = (
	state: UploadStates,
	action: UploadActions,
): UploadStates => {
	switch (action.type) {
		case "encode":
			if (state.status !== "idle") {
				throw new Error("Invalid state: not in idle state");
			}
			return { status: "encoding", writeFileFlow: action.writeFileFlow };
		case "encoded":
			if (state.status !== "encoding") {
				throw new Error("Invalid state: not in encoding state");
			}
			return { status: "can-register", writeFileFlow: state.writeFileFlow };
		case "register":
			if (state.status !== "can-register") {
				throw new Error("Invalid state: not in can-register state");
			}
			return { status: "registering", writeFileFlow: state.writeFileFlow };
		case "registered":
			if (state.status !== "registering") {
				throw new Error("Invalid state: not in registering state");
			}
			return {
				status: "can-relay",
				writeFileFlow: state.writeFileFlow,
				digest: action.digest,
			};
		case "relay":
			if (state.status !== "can-relay") {
				throw new Error("Invalid state: not in can-relay state");
			}
			return { status: "relaying", writeFileFlow: state.writeFileFlow };
		case "relayed":
			if (state.status !== "relaying") {
				throw new Error("Invalid state: not in relaying state");
			}
			return { status: "can-certify", writeFileFlow: state.writeFileFlow };
		case "certify":
			if (state.status !== "can-certify") {
				throw new Error("Invalid state: not in can-certify state");
			}
			return { status: "certifying", writeFileFlow: state.writeFileFlow };
		case "certified":
			if (state.status !== "certifying") {
				throw new Error("Invalid state: not in certifying state");
			}
			return { status: "idle" };
		case "error":
			return { status: "error", message: action.message };
		case "reset":
			return { status: "idle" };
	}
};

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
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
	const queryClient = useQueryClient();

	// State management for the upload process
	const [state, dispatch] = useReducer(uploadReducer, { status: "idle" });

	// Encoding a file
	const encodeFile = async (file: File) => {
		try {
			// Convert file to WalrusFile format
			const files = [
				WalrusFile.from({
					contents: new Uint8Array(await file.arrayBuffer()),
					identifier: file.name,
					tags: {
						contentType: file.type,
					},
				}),
			];

			// Create a new WriteFilesFlow instance
			const flow = walrusClient.writeFilesFlow({
				files,
			});
			dispatch({ type: "encode", writeFileFlow: flow });

			// Encoding the file
			await flow.encode();

			dispatch({ type: "encoded" });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to encode file";
			dispatch({ type: "error", message: errorMessage });
			throw error;
		}
	};

	// Step 1: Register blob on-chain
	const registerBlobMutation = useMutation({
		mutationFn: async ({ epochs, deletable }: { epochs: number; deletable: boolean }) => {
			if (!currentAccount) {
				throw new Error("No account connected");
			}

			if (state.status !== "can-register") {
				throw new Error("Not in can-register state");
			}

			dispatch({ type: "register", epochs, deletable });

			// Execute transaction
			const { digest: registerDigest } = await signAndExecuteTransaction({
				transaction: state.writeFileFlow.register({
					epochs,
					deletable,
					owner: currentAccount.address,
				}),
			});

			// Return data needed for next steps
			return {
				registerDigest,
			};
		},
		onSuccess: (data) => {
			const { registerDigest } = data;
			dispatch({ type: "registered", digest: registerDigest });

			// Invalidate balance queries after successful registration
			if (currentAccount?.address) {
				invalidateBalanceQueries(queryClient, currentAccount.address);
			}
		},
		onError: (error: Error) => {
			dispatch({ type: "error", message: error.message });
		},
	});

	// Step 2: Write blob to upload relay (storage nodes)
	const writeToUploadRelayMutation = useMutation({
		mutationFn: async () => {
			if (state.status !== "can-relay") {
				throw new Error("Not in can-relay state");
			}

			dispatch({ type: "relay" });

			// Write blob data to storage nodes via upload relay
			await state.writeFileFlow.upload({
				digest: state.digest,
			});
		},
		onSuccess: () => {
			dispatch({ type: "relayed" });
		},
		onError: (error: Error) => {
			dispatch({ type: "error", message: error.message });
		},
	});

	// Step 3: Certify blob on-chain
	const certifyBlobMutation = useMutation({
		mutationFn: async () => {
			if (!currentAccount) {
				throw new Error("No account connected");
			}

			if (state.status !== "can-certify") {
				throw new Error("Not in can-certify state");
			}

			dispatch({ type: "certify" });

			await signAndExecuteTransaction({
				transaction: state.writeFileFlow.certify(),
			});

			return await state.writeFileFlow.listFiles();
		},
		onSuccess: () => {
			dispatch({ type: "certified" });
			// Invalidate balance queries after successful certification
			if (currentAccount?.address) {
				invalidateBalanceQueries(queryClient, currentAccount.address);
			}
		},
		onError: (error: Error) => {
			dispatch({ type: "error", message: error.message });
		},
	});

	// Reset function to clear all state
	const reset = () => {
		dispatch({ type: "reset" });
	};

	return {
		state,
		encodeFile,
		registerBlob: registerBlobMutation.mutateAsync,
		writeToUploadRelay: writeToUploadRelayMutation.mutateAsync,
		certifyBlob: certifyBlobMutation.mutateAsync,
		reset,
	};
}
