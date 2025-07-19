import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRef, useState } from "react";
import type { ImageCardProps } from "./image-card";
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
		<div className="walrus-file-upload">
			<div>
				<label className="upload-label">Blob to upload</label>
				<div className="upload-container">
					<div className="upload-input-wrapper">
						<input
							type="file"
							ref={fileInputRef}
							className="upload-file-input"
							onChange={(e) => {
								const selectedFile = e.target.files?.[0];
								if (selectedFile) {
									handleFileSelect(selectedFile);
								}
							}}
						/>
						<div className="upload-drop-zone">
							{file ? (
								<div className="upload-content">
									<p className="file-name">{file.name}</p>
									<p className="file-size">
										{(file.size / (1024 * 1024)).toFixed(2)} MiB
									</p>
									{isComputingMetadata ? (
										<div className="computing-metadata">
											<div className="spinner"></div>
											<span>Computing metadata...</span>
										</div>
									) : (
										<button className="choose-file-btn">CHOOSE FILE</button>
									)}
								</div>
							) : (
								<div className="upload-content">
									<p className="drop-text">Drag & drop a file</p>
									<p className="max-size-text">
										Max {MAX_FILE_SIZE / (1024 * 1024)} MiB.
									</p>
									<button className="choose-file-btn">CHOOSE FILE</button>
								</div>
							)}
						</div>
					</div>
				</div>
				{displayError && <p className="upload-error">{displayError}</p>}
			</div>

			<div className="advanced-settings">
				<button
					onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
					className="advanced-toggle"
				>
					{showAdvancedSettings ? "− Advanced Settings" : "+ Advanced Settings"}
				</button>
				{showAdvancedSettings && (
					<div className="advanced-content">
						<div className="advanced-field">
							<label className="field-label">Epochs</label>
							<input
								type="number"
								className="field-input"
								value={epochs}
								onChange={(e) =>
									setEpochs(Math.min(53, Math.max(1, Math.floor(Number(e.target.value)))))
								}
								min="1"
								max="53"
								step="1"
							/>
							<p className="field-help">
								The number of Walrus epochs for which to store the blob (max 53).
							</p>
						</div>

						<div className="advanced-field">
							<label className="field-label">Deletable</label>
							<div className="checkbox-wrapper">
								<input
									type="checkbox"
									checked={deletable}
									onChange={(e) => setDeletable(e.target.checked)}
									className="field-checkbox"
								/>
								<span className="checkbox-label">Allow blob to be deleted</span>
							</div>
							<p className="field-help">
								Whether the blob can be deleted before its storage period expires.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Cost Information */}
			<div className="cost-display">
				<h3 className="cost-title">Upload Cost Estimate</h3>
				<div className="cost-rows">
					<div className="cost-row">
						<span className="cost-label">Storage Cost:</span>
						<span className="cost-value">
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
						</span>
					</div>
					<div className="cost-row">
						<span className="cost-label">Write Cost:</span>
						<span className="cost-value">
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
						</span>
					</div>
					<div className="cost-row">
						<span className="cost-label">Tip Amount:</span>
						<span className="cost-value">
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
						</span>
					</div>
					<div className="cost-total">
						<div className="cost-row">
							<span className="cost-label">Total Cost:</span>
							<span className="cost-value">
								{storageCost
									? (() => {
											const totalCostMist = parseInt(tipAmountMist);
											const totalCostFrost = parseInt(storageCost.totalCost);
											const formattedMist = formatSmallNumber(totalCostMist / 10 ** 9);
											const formattedFrost = formatSmallNumber(totalCostFrost / 10 ** 9);
											return (
												<>
													{formattedMist.prefix}
													{formattedMist.subscript && (
														<sub>{formattedMist.subscript}</sub>
													)}
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
							</span>
						</div>
					</div>
				</div>
				<p className="cost-disclaimer">
					Actual costs may vary based on current network conditions and file size.
				</p>
			</div>

			{/* Upload Buttons - All Steps Displayed */}
			<div className="upload-steps">
				<div className="steps-container">
					{/* Step 1: Register Blob */}
					<button
						className={`step-button ${
							currentStep === "register" &&
							!isRegistering &&
							file &&
							currentAccount &&
							!isComputingMetadata &&
							metadata
								? "step-active"
								: currentStep === "register"
									? "step-disabled"
									: registrationData
										? "step-completed"
										: "step-inactive"
						}`}
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
							<div className="step-content">
								<div className="step-spinner"></div>
								<span>Registering...</span>
							</div>
						) : registrationData ? (
							<div className="step-content">
								<span>✓ 1. Register Blob</span>
							</div>
						) : currentStep === "register" && !currentAccount ? (
							<div className="step-content">
								<span>1. Connect Wallet First</span>
							</div>
						) : (
							<div className="step-content">
								<span>1. Register Blob</span>
							</div>
						)}
					</button>

					{/* Arrow Down */}
					<div className="step-arrow">⌄</div>

					{/* Step 2: Write to Upload Relay */}
					<button
						className={`step-button ${
							currentStep === "relay" && !isWritingToUploadRelay && registrationData
								? "step-active"
								: currentStep === "relay"
									? "step-disabled"
									: uploadRelayData
										? "step-completed"
										: "step-inactive"
						}`}
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
							<div className="step-content">
								<div className="step-spinner"></div>
								<span>Uploading to Network...</span>
							</div>
						) : uploadRelayData ? (
							<div className="step-content">
								<span>✓ 2. Uploaded to Network</span>
							</div>
						) : (
							<div className="step-content">
								<span>2. Upload to Network</span>
							</div>
						)}
					</button>

					{/* Arrow Down */}
					<div className="step-arrow">⌄</div>

					{/* Step 3: Certify Blob */}
					<button
						className={`step-button ${
							currentStep === "certify" && !isCertifying && uploadRelayData
								? "step-active"
								: currentStep === "certify"
									? "step-disabled"
									: "step-inactive"
						}`}
						onClick={() => {
							if (currentStep === "certify") {
								handleCertifyBlob();
							}
						}}
						disabled={currentStep !== "certify" || isCertifying || !uploadRelayData}
					>
						{currentStep === "certify" && isCertifying ? (
							<div className="step-content">
								<div className="step-spinner"></div>
								<span>Certifying...</span>
							</div>
						) : (
							<div className="step-content">
								<span>3. Certify Upload</span>
							</div>
						)}
					</button>
				</div>
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
