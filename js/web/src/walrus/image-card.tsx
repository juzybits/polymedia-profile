import { useState } from "react";

/** Props type for the ImageCard component */
export type ImageCardProps = {
	blobId: string;
	suiObjectId: string;
	suiEventId: string;
	endEpoch: number;
	// Optional fields from localStorage
	fileName?: string;
	fileSize?: number;
	timestamp?: number;
};

const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

export function PlaceholderCard() {
	return (
		<div className="placeholder-card">
			<div className="placeholder-image">[image]</div>
			<div className="placeholder-content">
				<h3 className="placeholder-title">No uploads yet</h3>
				<p className="placeholder-description">
					Upload your first file to see it displayed here
				</p>
			</div>
		</div>
	);
}

export default function ImageCard(props: ImageCardProps) {
	const IMAGE_URL = `${AGGREGATOR_URL}/v1/blobs/${props.blobId}`;

	const [hasError, setHasError] = useState(false);

	// Format file size for display
	const formatFileSize = (bytes?: number) => {
		if (!bytes) return null;
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	// Format timestamp for display
	const formatTimestamp = (timestamp?: number) => {
		if (!timestamp) return null;
		return new Date(timestamp).toLocaleDateString();
	};

	return (
		<div className="image-card">
			<div className="image-preview">
				{hasError ? (
					<div className="image-placeholder"></div>
				) : (
					<img
						src={IMAGE_URL}
						alt={`uploaded image: ${props.fileName || props.blobId}`}
						width={142}
						height={142}
						onLoad={() => {
							console.log(`[ImageCard ${props.blobId}] Image loaded successfully`);
						}}
						onError={(e) => {
							console.error(`[ImageCard ${props.blobId}] Image failed to load:`, e);
							setHasError(true);
						}}
					/>
				)}
			</div>
			<div className="image-details">
				{props.fileName && (
					<div className="detail-row detail-row-top">
						<span className="detail-label">File Name</span>
						<div className="detail-value">
							<span>{props.fileName}</span>
						</div>
					</div>
				)}
				{props.fileSize && (
					<div className="detail-row">
						<span className="detail-label">File Size</span>
						<div className="detail-value">
							<span>{formatFileSize(props.fileSize)}</span>
						</div>
					</div>
				)}
				{props.timestamp && (
					<div className="detail-row">
						<span className="detail-label">Uploaded</span>
						<div className="detail-value">
							<span>{formatTimestamp(props.timestamp)}</span>
						</div>
					</div>
				)}
				<div className="detail-row detail-row-top">
					<span className="detail-label">End Epoch</span>
					<div className="detail-value">
						<span>{props.endEpoch}</span>
					</div>
				</div>
				<div className="detail-row">
					<span className="detail-label">URL</span>
					<div className="detail-value">
						<span>{IMAGE_URL}</span>
					</div>
				</div>
				<div className="detail-row detail-row-bottom">
					<span className="detail-label">Walruscan</span>
					<div className="detail-value">
						<a
							href={`https://walruscan.com/testnet/blob/${props.blobId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{props.blobId}
						</a>
					</div>
				</div>
				<div className="detail-row">
					<span className="detail-label">Associated Sui Object</span>
					<div className="detail-value">
						<a
							href={`https://testnet.suivision.xyz/object/${props.suiObjectId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{props.suiObjectId}
						</a>
					</div>
				</div>
				<div className="detail-row">
					<span className="detail-label">Download Link</span>
					<div className="detail-value">
						<a href={IMAGE_URL} target="_blank" rel="noopener noreferrer">
							{props.blobId}
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
