import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRef, useState } from "react";
import type { ImageCardProps } from "./image-card";
import { saveUploadToStorage } from "./localStorage";
import { useStorageCost } from "./useStorageCost";
import { useWalrusUpload } from "./useWalrusUpload";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MiB in bytes

interface FileUploadProps {
	onUploadComplete: (uploadedBlob: ImageCardProps) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
	const currentAccount = useCurrentAccount();

	// UI state
	const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [epochs, setEpochs] = useState(1);
	const [deletable, setDeletable] = useState(false);
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
			deletable,
		});
	};

	const handleWriteToUploadRelay = async () => {
		await writeToUploadRelay();
	};

	const handleCertifyBlob = async () => {
		const result = await certifyBlob();

		// Save to localStorage if user is connected
		if (currentAccount?.address) {
			saveUploadToStorage(currentAccount.address, result, file?.name, file?.size);
		}

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

	return (
		<div className="form">
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
									<button type="button">CHOOSE FILE</button>
								)}
							</div>
						) : (
							<div>
								<p>Drag & drop a file</p>
								<p>Max {MAX_FILE_SIZE / (1024 * 1024)} MiB</p>
								<button type="button">CHOOSE FILE</button>
							</div>
						)}
					</div>
				</div>
				{displayError && <div className="field-error">{displayError}</div>}
			</div>

			<div className="form-field">
				<h4
					onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
					className="walrus-advanced-toggle"
				>
					{showAdvancedSettings ? "- Hide Advanced Settings" : "+ Show Advanced Settings"}
				</h4>
				{showAdvancedSettings && (
					<div className="walrus-advanced-content">
						<div className="form-field">
							<label>Epochs</label>
							<input
								type="number"
								value={epochs}
								onChange={(e) =>
									setEpochs(Math.min(53, Math.max(1, Math.floor(Number(e.target.value)))))
								}
								min="1"
								max="53"
								step="1"
							/>
							<div className="field-info">
								The number of Walrus epochs for which to store the blob (max 53).
							</div>
						</div>

						<div className="form-field">
							<label>
								<input
									type="checkbox"
									checked={deletable}
									onChange={(e) => setDeletable(e.target.checked)}
									className="walrus-checkbox"
								/>
								Allow blob to be deleted
							</label>
							<div className="field-info">
								Whether the blob can be deleted before its storage period expires.
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Cost Information */}
			<div className="walrus-cost-display">
				<h2>Upload Cost Estimate</h2>
				<div>
					<p>
						Storage Cost:{" "}
						{storageCost
							? (() => {
									const storageValue = parseInt(storageCost.storageCost) / 10 ** 9;
									const formatted = formatSmallNumber(storageValue);
									return (
										<>
											{formatted.prefix}
											{formatted.subscript && <sub>{formatted.subscript}</sub>}
											{formatted.significantDigits}
											{" WAL"}
										</>
									);
								})()
							: "---"}
					</p>
					<p>
						Write Cost:{" "}
						{storageCost
							? (() => {
									const storageValue = parseInt(storageCost.writeCost) / 10 ** 9;
									const formatted = formatSmallNumber(storageValue);
									return (
										<>
											{formatted.prefix}
											{formatted.subscript && <sub>{formatted.subscript}</sub>}
											{formatted.significantDigits}
											{" WAL"}
										</>
									);
								})()
							: "---"}
					</p>
					<p>
						Tip Amount:{" "}
						{storageCost
							? (() => {
									const tipValue = parseInt(tipAmountMist) / 10 ** 9;
									const formatted = formatSmallNumber(tipValue);
									return (
										<>
											{formatted.prefix}
											{formatted.subscript && <sub>{formatted.subscript}</sub>}
											{formatted.significantDigits}
											{" SUI"}
										</>
									);
								})()
							: "---"}
					</p>
					<p>
						<b>
							Total Cost:{" "}
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
				<div className="field-info">
					Actual costs may vary based on current network conditions and file size.
				</div>
			</div>

			{/* Upload Buttons */}
			<div className="walrus-upload-steps">
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
					{currentStep === "register" && isRegistering ? (
						<span>Registering...</span>
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
					{currentStep === "relay" && isWritingToUploadRelay ? (
						<span>Uploading to Network...</span>
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
					{currentStep === "certify" && isCertifying ? (
						<span>Certifying...</span>
					) : (
						<span>3. Certify Upload</span>
					)}
				</button>
			</div>
		</div>
	);
}

// === helpers ===

const formatSmallNumber = (
	value: number,
): { prefix: string; significantDigits: string; subscript?: number } => {
	if (value === 0) return { prefix: "", significantDigits: "0" };

	const valueStr = value.toString();
	const scientificMatch = valueStr.match(/^(\d+(?:\.\d+)?)e-(\d+)$/);

	if (scientificMatch) {
		// Handle scientific notation
		const coefficient = parseFloat(scientificMatch[1]);
		const exponent = parseInt(scientificMatch[2]);

		if (exponent >= 4) {
			// Extract significant digits without decimal point
			const coefficientStr = coefficient.toString().replace(".", "");
			const paddedDigits = coefficientStr.padEnd(3, "0").substring(0, 3);
			return {
				prefix: "0.0",
				significantDigits: paddedDigits,
				subscript: exponent - 1,
			};
		}
	}

	// Check for leading zeros after decimal point
	const decimalMatch = valueStr.match(/^0\.0+(\d+)/);
	if (decimalMatch) {
		const leadingZerosMatch = valueStr.match(/^0\.0+/);
		if (leadingZerosMatch) {
			const leadingZeros = leadingZerosMatch[0].length - 2; // subtract "0."
			if (leadingZeros >= 4) {
				const significantDigits = decimalMatch[1];
				const formattedDigits = significantDigits.substring(0, 3);
				return {
					prefix: "0.0",
					significantDigits: formattedDigits,
					subscript: leadingZeros,
				};
			}
		}
	}

	// For regular numbers, use toPrecision
	return { prefix: "", significantDigits: value.toPrecision(3) };
};
