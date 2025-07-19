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
		<div className="walrus-placeholder-card">
			<div className="walrus-placeholder-image">[image]</div>
			<div className="walrus-placeholder-content">
				<h2>No uploads yet</h2>
				<p>Upload your first file to see it displayed here</p>
			</div>
		</div>
	);
}

export default function ImageCard(props: ImageCardProps) {
	const IMAGE_URL = `${AGGREGATOR_URL}/v1/blobs/${props.blobId}`;

	const [hasError, setHasError] = useState(false);

	return (
		<div className="walrus-image-card">
			<div className="walrus-image-preview">
				{hasError ? (
					<div className="walrus-image-placeholder">[image]</div>
				) : (
					<img
						src={IMAGE_URL}
						alt={`uploaded image: ${props.fileName || props.blobId}`}
						width={120}
						height={120}
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
			<div className="walrus-image-details">
				<div>End Epoch: {props.endEpoch}</div>
				<div>
					<a href={IMAGE_URL} target="_blank" rel="noopener noreferrer">
						Image URL
					</a>
				</div>
				<div>
					<a
						href={`https://walruscan.com/testnet/blob/${props.blobId}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Walruscan
					</a>
				</div>
				<div>
					<a
						href={`https://testnet.suivision.xyz/object/${props.suiObjectId}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Sui Object
					</a>
				</div>
			</div>
		</div>
	);
}
