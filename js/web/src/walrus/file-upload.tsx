import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../app/context";
import { Spinner } from "../comp/spinner";
import { useStorageCost } from "./useStorageCost";
import { type UploadResult, useWalrusUpload } from "./useWalrusUpload";
import { formatEpochDuration, formatSmallNumber } from "./utils";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MiB in bytes
const DELETABLE = true; // always allow blobs to be deleted
const MAX_EPOCHS = 53;
const MAINNET_EPOCH_DAYS = 14;
const TESTNET_EPOCH_DAYS = 1;

interface FileUploadProps {
	onUploadComplete: (uploadedBlob: UploadResult) => void;
	onUploadProgressChange?: (hasProgress: boolean) => void;
}

// TODO: fixed height for "CHOOSE FILE" and "computing metadata"
// MAYBE: show USD cost estimate

export default function FileUpload({
	onUploadComplete,
	onUploadProgressChange,
}: FileUploadProps) {
	const currentAccount = useCurrentAccount();
	const { network } = useAppContext();

	// UI state
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [epochs, setEpochs] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const [tipAmountMist] = useState("105");

	// Use the new Walrus upload hook
	const {
		currentStep,
		registrationData,
		uploadRelayData,
		error: uploadError,
		metadata,
		isComputingMetadata,
		computeMetadata,
		registerBlob,
		writeToUploadRelay,
		certifyBlob,
		isRegistering,
		isWritingToUploadRelay,
		isCertifying,
		reset: resetUpload,
	} = useWalrusUpload();

	const { data: storageCost } = useStorageCost(file?.size || 0, epochs);

	// Check if there's upload progress that would be lost
	const hasUploadProgress = !!(
		file &&
		(metadata ||
			registrationData ||
			uploadRelayData ||
			isComputingMetadata ||
			isRegistering ||
			isWritingToUploadRelay ||
			isCertifying)
	);

	// Notify parent about progress changes
	useEffect(() => {
		onUploadProgressChange?.(hasUploadProgress);
	}, [hasUploadProgress, onUploadProgressChange]);

	const handleFileSelect = async (selectedFile: File) => {
		// Check file size against MAX_FILE_SIZE
		if (selectedFile.size > MAX_FILE_SIZE) {
			setError(
				`File size (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB) exceeds maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)} MiB)`,
			);
			setFile(null);
			return;
		}

		setError(null);
		setFile(selectedFile);

		await computeMetadata(selectedFile);
	};

	const handleRegisterBlob = async () => {
		await registerBlob({
			epochs,
			deletable: DELETABLE,
		});
	};

	const handleWriteToUploadRelay = async () => {
		await writeToUploadRelay();
	};

	const handleCertifyBlob = async () => {
		const result = await certifyBlob();

		onUploadComplete(result);
		resetUploadProcess();
	};

	const resetUploadProcess = () => {
		setFile(null);
		setError(null);
		resetUpload();
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Combine errors from UI and upload hook
	const displayError = error || uploadError;

	const disableFileAndDuration = currentStep !== "register" || isRegistering;

	return (
		<div className="walrus-form">
			<div className="form-field">
				<div className="walrus-file-upload-container">
					<input
						type="file"
						ref={fileInputRef}
						className="walrus-file-input"
						onChange={(e) => {
							const selectedFile = e.target.files?.[0];
							if (selectedFile) {
								handleFileSelect(selectedFile);
							}
						}}
						disabled={disableFileAndDuration}
					/>
					<div className="walrus-drop-zone">
						{file ? (
							<div>
								<p>
									<b>{file.name}</b>
								</p>
								<p>{(file.size / (1024 * 1024)).toFixed(2)} MiB</p>
								{isComputingMetadata ? (
									<p>Computing metadata...</p>
								) : (
									<button type="button" disabled={disableFileAndDuration}>CHOOSE FILE</button>
								)}
							</div>
						) : (
							<div>
								<p>Drag & drop a file</p>
								<p>Max {MAX_FILE_SIZE / (1024 * 1024)} MiB</p>
								<button type="button" disabled={disableFileAndDuration}>CHOOSE FILE</button>
							</div>
						)}
					</div>
				</div>
				{displayError && <div className="field-error">{displayError}</div>} {/* TODO: move elsewhere */}
			</div>

			<div className="form-field">
				<h3>Storage Duration</h3>
				<input
					type="range"
					value={epochs}
					onChange={(e) => setEpochs(Math.max(1, Math.floor(Number(e.target.value))))}
					min="1"
					max={MAX_EPOCHS}
					step="1"
					disabled={disableFileAndDuration}
				/>
				<div className="field-info">
					{formatEpochDuration(
						epochs,
						network === "mainnet" ? MAINNET_EPOCH_DAYS : TESTNET_EPOCH_DAYS,
					)}{" "}
					- Max{" "}
					{formatEpochDuration(
						MAX_EPOCHS,
						network === "mainnet" ? MAINNET_EPOCH_DAYS : TESTNET_EPOCH_DAYS,
					)}
				</div>
			</div>

			{/* Cost Information */}
			<div className="form-field">
				<h3>Cost Estimate</h3>
				<div>
					<p>
						<b>
							{storageCost
								? (() => {
										const totalCostMist = parseInt(tipAmountMist);
										const totalCostFrost = parseInt(storageCost.totalCost);
										const formattedMist = formatSmallNumber(totalCostMist / 10 ** 9);
										const formattedFrost = formatSmallNumber(totalCostFrost / 10 ** 9);
										return (
											<>
												{formattedMist.prefix}
												{formattedMist.subscript && <sub>{formattedMist.subscript}</sub>}
												{formattedMist.significantDigits}
												{" SUI"}
												{" + "}
												{formattedFrost.prefix}
												{formattedFrost.subscript && (
													<sub>{formattedFrost.subscript}</sub>
												)}
												{formattedFrost.significantDigits}
												{" WAL"}
											</>
										);
									})()
								: "---"}
						</b>
					</p>
				</div>
			</div>

			{/* Upload Buttons */}
			<div className="btn-group">
				<h3>Upload Steps</h3>
				{/* Step 1: Register Blob */}
				<button
					className={
						currentStep === "register" &&
						!isRegistering &&
						file &&
						currentAccount &&
						!isComputingMetadata &&
						metadata
							? ""
							: registrationData
								? "disabled"
								: "disabled"
					}
					onClick={() => {
						if (currentStep !== "register") return;
						if (!currentAccount) {
							setError("Please connect your wallet first");
							return;
						}
						if (!file) {
							setError("Please select a file first");
							return;
						}
						if (isComputingMetadata) {
							setError("Metadata is still being computed. Please wait.");
							return;
						}
						if (!metadata) {
							setError("Metadata computation failed. Please try again.");
							return;
						}
						handleRegisterBlob();
					}}
					disabled={
						currentStep !== "register" ||
						isRegistering ||
						!file ||
						!currentAccount ||
						isComputingMetadata ||
						!metadata
					}
				>
					{isRegistering ? (
						<div className="button-loading">
							<Spinner />
							<span>Registering...</span>
						</div>
					) : registrationData ? (
						<span>✓ 1. Register Blob</span>
					) : currentStep === "register" && !currentAccount ? (
						<span>1. Connect Wallet First</span>
					) : (
						<span>1. Register Blob</span>
					)}
				</button>

				{/* Step 2: Write to Upload Relay */}
				<button
					className={
						currentStep === "relay" && !isWritingToUploadRelay && registrationData
							? ""
							: uploadRelayData
								? "disabled"
								: "disabled"
					}
					onClick={() => {
						if (currentStep === "relay") {
							handleWriteToUploadRelay();
						}
					}}
					disabled={
						currentStep !== "relay" || isWritingToUploadRelay || !registrationData
					}
				>
					{isWritingToUploadRelay ? (
						<div className="button-loading">
							<Spinner />
							<span>Uploading to Network...</span>
						</div>
					) : uploadRelayData ? (
						<span>✓ 2. Uploaded to Network</span>
					) : (
						<span>2. Upload to Network</span>
					)}
				</button>

				{/* Step 3: Certify Blob */}
				<button
					className={
						currentStep === "certify" && !isCertifying && uploadRelayData
							? ""
							: "disabled"
					}
					onClick={() => {
						if (currentStep === "certify") {
							handleCertifyBlob();
						}
					}}
					disabled={currentStep !== "certify" || isCertifying || !uploadRelayData}
				>
					{isCertifying ? (
						<div className="button-loading">
							<Spinner />
							<span>Certifying...</span>
						</div>
					) : (
						<span>3. Certify Upload</span>
					)}
				</button>
			</div>
		</div>
	);
}
