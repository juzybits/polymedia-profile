import type { ImageCardProps } from "./image-card";

const WALRUS_UPLOADS_KEY = "walrus-uploads";

export interface StoredUpload extends ImageCardProps {
	timestamp: number;
	fileName?: string;
	fileSize?: number;
}

/**
 * Load uploads from localStorage for the current user and network
 */
export function loadUploadsFromStorage(userAddress?: string, network?: string): StoredUpload[] {
	if (!userAddress || !network) return [];

	try {
		const key = `${WALRUS_UPLOADS_KEY}-${userAddress}-${network}`;
		const stored = localStorage.getItem(key);
		if (!stored) return [];

		const uploads: StoredUpload[] = JSON.parse(stored);

		// Filter out expired uploads (past endEpoch)
		// Note: This is a simplified check - in production you'd want to compare against current epoch
		const now = Date.now();
		const validUploads = uploads.filter((upload) => {
			// Keep uploads that are less than 1 year old as a simple filter
			const age = now - upload.timestamp;
			const oneYear = 365 * 24 * 60 * 60 * 1000;
			return age < oneYear;
		});

		// Sort by timestamp (newest first)
		return validUploads.sort((a, b) => b.timestamp - a.timestamp);
	} catch (error) {
		console.error("Error loading uploads from localStorage:", error);
		return [];
	}
}

/**
 * Save an upload to localStorage for the current user and network
 */
export function saveUploadToStorage(
	userAddress: string,
	network: string,
	upload: ImageCardProps,
	fileName?: string,
	fileSize?: number,
): void {
	try {
		const key = `${WALRUS_UPLOADS_KEY}-${userAddress}-${network}`;
		const existingUploads = loadUploadsFromStorage(userAddress, network);

		// Check if this upload already exists (prevent duplicates)
		const exists = existingUploads.some((existing) => existing.blobId === upload.blobId);
		if (exists) {
			console.log("Upload already exists in storage, skipping save");
			return;
		}

		const storedUpload: StoredUpload = {
			...upload,
			timestamp: Date.now(),
			fileName,
			fileSize,
		};

		const updatedUploads = [storedUpload, ...existingUploads];

		// Keep only the last 100 uploads to prevent localStorage from growing too large
		const trimmedUploads = updatedUploads.slice(0, 100);

		localStorage.setItem(key, JSON.stringify(trimmedUploads));
	} catch (error) {
		console.error("Error saving upload to localStorage:", error);
	}
}

/**
 * Remove a specific upload from localStorage
 */
export function removeUploadFromStorage(userAddress: string, network: string, blobId: string): void {
	try {
		const key = `${WALRUS_UPLOADS_KEY}-${userAddress}-${network}`;
		const existingUploads = loadUploadsFromStorage(userAddress, network);
		const filteredUploads = existingUploads.filter((upload) => upload.blobId !== blobId);

		localStorage.setItem(key, JSON.stringify(filteredUploads));
	} catch (error) {
		console.error("Error removing upload from localStorage:", error);
	}
}

/**
 * Clear all uploads for the current user and network
 */
export function clearUploadsFromStorage(userAddress: string, network: string): void {
	try {
		const key = `${WALRUS_UPLOADS_KEY}-${userAddress}-${network}`;
		localStorage.removeItem(key);
	} catch (error) {
		console.error("Error clearing uploads from localStorage:", error);
	}
}
