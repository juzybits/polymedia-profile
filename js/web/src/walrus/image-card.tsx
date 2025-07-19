import { useState } from "react";

/** Props type for the ImageCard component */
export type ImageCardProps = {
	blobId: string;
	suiObjectId: string;
	suiEventId: string;
	endEpoch: number;
};

const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

export function PlaceholderCard() {
	return (
		<div className="w-[480px] h-full max-h-[158px] min-h-[158px] bg-[#0C0F1D] rounded-2xl border border-2 border-dashed border-[#97F0E533] flex flex-row items-center justify-center gap-4 opacity-60">
			<div className="w-[142px] h-[142px] relative rounded-lg overflow-hidden bg-[#97F0E514] flex items-center justify-center">
				[upload]
			</div>
			<div className="flex flex-col items-center justify-center gap-2">
				<h3 className="text-[#F7F7F7] text-lg font-medium">No uploads yet</h3>
				<p className="text-[#97F0E5] text-sm text-center max-w-[250px]">
					Upload your first file to see it displayed here
				</p>
			</div>
		</div>
	);
}

export default function ImageCard(props: ImageCardProps) {
	const IMAGE_URL = `${AGGREGATOR_URL}/v1/blobs/${props.blobId}`;

	const [hasError, setHasError] = useState(false);

	return (
		<div className="w-[480px] h-full max-h-[158px] min-h-[158px] bg-[#0C0F1D] rounded-2xl border border-2 border-[#97F0E533] flex flex-row items-center justify-center gap-2">
			<div className="w-[142px] h-[142px] relative rounded-lg overflow-hidden">
				{hasError ? (
					<div className="w-full h-full bg-[#97F0E514] rounded-lg flex items-center justify-center">
						[image]
					</div>
				) : (
					<img
						src={IMAGE_URL}
						alt={`uploaded image: ${props.blobId}`}
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
			<div className="h-[142px] flex flex-col items-center justify-between">
				<div className="w-[314px] h-[34px] bg-[#97F0E514] flex flex-row items-center justify-between rounded-b-md rounded-t-none px-2">
					<span className="text-[#F7F7F7] text-sm font-medium w-[157px] text-left">
						End Epoch
					</span>
					<span className="text-[#97F0E5] text-sm font-medium w-[157px] text-left flex items-center">
						{props.endEpoch}
					</span>
				</div>
				<div className="w-[314px] h-[34px] bg-[#97F0E514] flex flex-row items-center justify-between px-2">
					<span className="text-[#F7F7F7] text-sm font-medium w-[157px] text-left">
						URL
					</span>
					<div className="w-[157px] overflow-hidden flex items-center">
						<span className="text-[#97F0E5] text-sm font-medium block text-left text-ellipsis whitespace-nowrap overflow-hidden">
							{IMAGE_URL}
						</span>
					</div>
				</div>
				<div className="w-[314px] h-[34px] bg-[#97F0E514] flex flex-row items-center justify-between rounded-t-lg rounded-b-none px-2">
					<span className="text-[#F7F7F7] text-sm font-medium w-[157px] text-left">
						Walruscan
					</span>
					<div className="w-[157px] overflow-hidden flex items-center">
						<a
							href={`https://walruscan.com/testnet/blob/${props.blobId}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#C684F6] underline text-sm font-medium block text-left text-ellipsis whitespace-nowrap overflow-hidden"
						>
							{props.blobId}
						</a>
					</div>
				</div>
				<div className="w-[314px] h-[34px] bg-[#97F0E514] flex flex-row items-center justify-between px-2">
					<span className="text-[#F7F7F7] text-sm font-medium w-[157px] text-left">
						Associated Sui Object
					</span>
					<div className="w-[157px] overflow-hidden flex items-center">
						<a
							href={`https://testnet.suivision.xyz/object/${props.suiObjectId}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#C684F6] underline text-sm font-medium block text-left text-ellipsis whitespace-nowrap overflow-hidden"
						>
							{props.suiObjectId}
						</a>
					</div>
				</div>
				<div className="w-[314px] h-[34px] bg-[#97F0E514] flex flex-row items-center justify-between px-2">
					<span className="text-[#F7F7F7] text-sm font-medium w-[157px] text-left">
						Download Link
					</span>
					<div className="w-[157px] overflow-hidden flex items-center">
						<a
							href={IMAGE_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#C684F6] underline text-sm font-medium block text-left text-ellipsis whitespace-nowrap overflow-hidden"
						>
							{props.blobId}
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
