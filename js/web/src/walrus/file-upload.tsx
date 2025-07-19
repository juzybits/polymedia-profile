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
		<div className="flex flex-col gap-4">
			<div>
				<label className="block text-sm font-medium mb-1">Blob to upload</label>
				<div className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md">
					<div className="relative">
						<input
							type="file"
							ref={fileInputRef}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-file-upload-button]:hidden [&::file-selector-button]:hidden focus:outline-none focus:ring-0"
							onChange={(e) => {
								const selectedFile = e.target.files?.[0];
								if (selectedFile) {
									handleFileSelect(selectedFile);
								}
							}}
						/>
						<div className="w-full p-2 border border-2 border-[#97F0E599] border-dashed rounded-md flex items-center justify-center min-h-[100px]">
							{file ? (
								<div className="flex flex-col items-center justify-center gap-2">
									[image]
									<p className="text-[#F7F7F7]">{file.name}</p>
									<p className="text-sm text-[#F7F7F7]">
										{(file.size / (1024 * 1024)).toFixed(2)} MiB
									</p>
									{isComputingMetadata ? (
										<div className="flex items-center gap-2 text-sm text-[#97F0E5]">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#97F0E5]"></div>
											<span>Computing metadata...</span>
										</div>
									) : (
										<button className="border border-[#C684F6] rounded-md px-2 py-1 text-sm text-[#C684F6]">
											CHOOSE FILE
										</button>
									)}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center gap-2">
									[image-up]
									<p className="text-[#FFFFFF]">Drag & drop a file</p>
									<p className="text-sm text-[#F7F7F7]">
										Max {MAX_FILE_SIZE / (1024 * 1024)} MiB.
									</p>
									<button className="border border-[#C684F6] rounded-md px-2 py-1 text-sm text-[#C684F6]">
										CHOOSE FILE
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
				{displayError && <p className="text-red-500 text-sm mt-1">{displayError}</p>}
			</div>

			<div className="w-full">
				<button
					onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
					className="flex items-center gap-2 text-sm text-[#F7F7F7] hover:text-[#97F0E5] transition-colors"
				>
					+Advanced Settings
				</button>
				{showAdvancedSettings && (
					<div className="mt-2 space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">Epochs</label>
							<input
								type="number"
								className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md focus:outline-none focus:ring-0 focus:border-[#97F0E5]"
								value={epochs}
								onChange={(e) =>
									setEpochs(Math.min(53, Math.max(1, Math.floor(Number(e.target.value)))))
								}
								min="1"
								max="53"
								step="1"
							/>
							<p className="text-sm opacity-50 text-[#F7F7F7] mt-1">
								The number of Walrus epochs for which to store the blob (max 53).
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Deletable</label>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={deletable}
									onChange={(e) => setDeletable(e.target.checked)}
									className="w-4 h-4 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded focus:outline-none focus:ring-0 focus:border-[#97F0E5] checked:bg-[#97F0E5] checked:border-[#97F0E5]"
								/>
								<span className="text-sm text-[#F7F7F7]">Allow blob to be deleted</span>
							</div>
							<p className="text-sm opacity-50 text-[#F7F7F7] mt-1">
								Whether the blob can be deleted before its storage period expires.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Cost Information */}
			<div className="w-full p-3 bg-[#0C0F1D] border border-[#97F0E599] rounded-md">
				<h3 className="text-sm font-medium text-[#F7F7F7] mb-2">Upload Cost Estimate</h3>
				<div className="space-y-2">
					<div className="flex justify-between items-center text-sm">
						<span className="text-[#F7F7F7] opacity-75">Storage Cost:</span>
						<span className="text-[#F7F7F7]">
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
					<div className="flex justify-between items-center text-sm">
						<span className="text-[#F7F7F7] opacity-75">Write Cost:</span>
						<span className="text-[#F7F7F7]">
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
					<div className="flex justify-between items-center text-sm">
						<span className="text-[#F7F7F7] opacity-75">Tip Amount:</span>
						<span className="text-[#F7F7F7]">
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
					<div className="border-t border-[#97F0E599] pt-2">
						<div className="flex justify-between items-center text-sm font-medium">
							<span className="text-[#F7F7F7]">Total Cost:</span>
							<span className="text-[#97F0E5]">
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
				<p className="text-xs text-[#F7F7F7] opacity-50 mt-2">
					Actual costs may vary based on current network conditions and file size.
				</p>
			</div>

			{/* Upload Buttons - All Steps Displayed */}
			<div className="space-y-4">
				<div className="flex flex-col items-center gap-0">
					{/* Step 1: Register Blob */}
					<button
						className={`text-[#0C0F1D] w-full py-2 px-4 rounded-md transition-colors duration-200 ${
							currentStep === "register" &&
							!isRegistering &&
							file &&
							currentAccount &&
							!isComputingMetadata &&
							metadata
								? "bg-[#97F0E5] hover:bg-[#97F0E5]/80 cursor-pointer"
								: currentStep === "register"
									? "bg-[#97F0E5]/50 cursor-not-allowed"
									: registrationData
										? "bg-[#07b09a] cursor-not-allowed"
										: "bg-gray-500/50 cursor-not-allowed"
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
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0C0F1D]"></div>
								<span>Registering...</span>
							</div>
						) : registrationData ? (
							<div className="flex items-center justify-center gap-2">
								<span>✓ 1. Register Blob</span>
							</div>
						) : currentStep === "register" && !currentAccount ? (
							<div className="flex items-center justify-center gap-2">
								<span>1. Connect Wallet First</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								<span>1. Register Blob</span>
							</div>
						)}
					</button>

					{/* Arrow Down */}
					<div className="flex items-center justify-center">⌄</div>

					{/* Step 2: Write to Upload Relay */}
					<button
						className={`text-[#0C0F1D] w-full py-2 px-4 rounded-md transition-colors duration-200 ${
							currentStep === "relay" && !isWritingToUploadRelay && registrationData
								? "bg-[#97F0E5] hover:bg-[#97F0E5]/80 cursor-pointer"
								: currentStep === "relay"
									? "bg-[#97F0E5]/50 cursor-not-allowed"
									: uploadRelayData
										? "bg-[#07b09a] cursor-not-allowed"
										: "bg-gray-500/50 cursor-not-allowed"
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
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0C0F1D]"></div>
								<span>Uploading to Network...</span>
							</div>
						) : uploadRelayData ? (
							<div className="flex items-center justify-center gap-2">
								<span>✓ 2. Uploaded to Network</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								<span>2. Upload to Network</span>
							</div>
						)}
					</button>

					{/* Arrow Down */}
					<div className="flex items-center justify-center">⌄</div>

					{/* Step 3: Certify Blob */}
					<button
						className={`text-[#0C0F1D] w-full py-2 px-4 rounded-md transition-colors duration-200 ${
							currentStep === "certify" && !isCertifying && uploadRelayData
								? "bg-[#97F0E5] hover:bg-[#97F0E5]/80 cursor-pointer"
								: currentStep === "certify"
									? "bg-[#97F0E5]/50 cursor-not-allowed"
									: "bg-gray-500/50 cursor-not-allowed"
						}`}
						onClick={() => {
							if (currentStep === "certify") {
								handleCertifyBlob();
							}
						}}
						disabled={currentStep !== "certify" || isCertifying || !uploadRelayData}
					>
						{currentStep === "certify" && isCertifying ? (
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0C0F1D]"></div>
								<span>Certifying...</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
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
