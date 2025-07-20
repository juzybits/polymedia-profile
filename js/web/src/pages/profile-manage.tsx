import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { create_profile, edit_profile } from "@polymedia/profile-sdk";
import { LinkToPolymedia } from "@polymedia/suitcase-react";
import { type SyntheticEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../app/context";
import "../styles/manage-profile.less";
import "../styles/walrus.less";
import FileUpload from "../walrus/file-upload";
import ImageCard, { type ImageCardProps, PlaceholderCard } from "../walrus/image-card";
import { loadUploadsFromStorage } from "../walrus/localStorage";

export const PageProfileManage: React.FC = () => {
	/* State */

	const currAcct = useCurrentAccount();

	const { network, profile, profileClient, reloadProfile, openConnectModal } =
		useAppContext();

	// Form inputs
	const [inputName, setInputName] = useState("");
	const [inputImage, setInputImage] = useState("");
	const [inputDescription, setInputDescription] = useState("");
	const [hasChanged, setHasChanged] = useState(false);
	// Form errors
	const [isErrorImage, setIsErrorImage] = useState(false);
	const [isErrorForm, setIsErrorForm] = useState(false);
	// Other state
	const [waiting, setWaiting] = useState(false);

	// Walrus
	const showWalrus = ["mainnet", "testnet"].includes(network);
	const [uploadedBlobs, setUploadedBlobs] = useState<ImageCardProps[]>([]);
	const onUploadComplete = (uploadedBlob: ImageCardProps) => {
		setUploadedBlobs((prev) => [uploadedBlob, ...prev]);
	};
	useEffect(() => {
		if (currAcct?.address) {
			const storedUploads = loadUploadsFromStorage(currAcct.address);
			setUploadedBlobs(storedUploads);
		} else {
			setUploadedBlobs([]);
		}
	}, [currAcct?.address]);

	/* Functions */

	useEffect(() => {
		setInputName(profile?.name || "");
		setInputImage(profile?.imageUrl || "");
		setInputDescription(profile?.description || "");
		setHasChanged(false);
	}, [profile]);

	const onInputImageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!e.target.value) {
			setIsErrorImage(false);
			setIsErrorForm(false);
		}
		setInputImage(e.target.value);
		setHasChanged(true);
	};
	const onImageLoad = () => {
		setIsErrorImage(false);
		setIsErrorForm(false);
	};

	const onImageError = () => {
		setIsErrorImage(true);
		setIsErrorForm(true);
	};

	const onSubmitCreateProfile = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!currAcct) {
			openConnectModal();
			return;
		}
		console.debug(`[onSubmitCreateProfile] Attempting to create profile: ${inputName}`);
		setWaiting(true);
		try {
			const tx = new Transaction();
			create_profile(
				tx,
				profileClient.profilePkgId,
				profileClient.registryId,
				inputName,
				inputImage,
				inputDescription,
				null,
			);

			const resp = await profileClient.signAndExecuteTx({ tx });
			console.debug("resp:", resp);

			if (resp.errors || resp.effects?.status.status !== "success") {
				toast.error(
					`Txn digest: ${resp.digest}\n` +
						`Txn status: ${resp.effects?.status.status}\n` +
						`Txn errors: ${JSON.stringify(resp.errors)}`,
				);
			} else {
				toast.success("Success");
				reloadProfile();
			}
		} catch (err) {
			console.warn("[onSubmitCreateProfile]", err);
			toast.error(String(err));
		} finally {
			setWaiting(false);
		}
	};

	const onSubmitEditProfile = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!currAcct) {
			openConnectModal();
			return;
		}
		if (!profile) {
			toast.error("[onSubmitEditProfile] Missing profile");
			return;
		}
		console.debug("[onSubmitEditProfile] Attempting to edit profile");
		setWaiting(true);
		try {
			const tx = new Transaction();
			edit_profile(
				tx,
				profile.id,
				profileClient.profilePkgId,
				inputName,
				inputImage,
				inputDescription,
				null,
			);

			const resp = await profileClient.signAndExecuteTx({ tx });
			console.debug("resp:", resp);

			if (resp.errors || resp.effects?.status.status !== "success") {
				toast.error(
					`Txn digest: ${resp.digest}\n` +
						`Txn status: ${resp.effects?.status.status}\n` +
						`Txn errors: ${JSON.stringify(resp.errors)}`,
				);
			} else {
				toast.success("Success");
				reloadProfile();
			}
		} catch (err) {
			console.warn("[onSubmitEditProfile]", err);
			toast.error(String(err));
		} finally {
			setWaiting(false);
		}
	};

	/* HTML */

	let view: React.ReactNode;
	if (!currAcct) {
		view = (
			<div>
				<p>
					Connect your Sui wallet to create your profile.
					<br />
					It's free and only takes a few seconds!
				</p>
				<button onClick={openConnectModal}>LOG IN</button>
			</div>
		);
	} else if (profile === undefined) {
		view = <div>Loading...</div>;
	} else {
		view = (
			<form
				className="form"
				onSubmit={profile === null ? onSubmitCreateProfile : onSubmitEditProfile}
			>
				<div className="form-field">
					<label>Name</label>
					<input
						value={inputName}
						type="text"
						required
						maxLength={60}
						className={waiting ? "waiting" : ""}
						disabled={waiting}
						spellCheck="false"
						autoCorrect="off"
						autoComplete="off"
						onChange={(e) => {
							setInputName(e.target.value);
							setHasChanged(true);
						}}
					/>
				</div>
				<div className="form-field">
					<label>
						Description<span className="field-optional">[optional]</span>
					</label>
					<textarea
						value={inputDescription}
						maxLength={10000}
						className={waiting ? "waiting" : ""}
						disabled={waiting}
						spellCheck="true"
						autoCorrect="off"
						autoComplete="off"
						onChange={(e) => {
							setInputDescription(e.target.value);
							setHasChanged(true);
						}}
					/>
				</div>
				<div className="form-field">
					<label>
						Image URL<span className="field-optional">[optional]</span>
					</label>
					<div className="image-input-container">
						<textarea
							value={inputImage}
							className={waiting ? "waiting" : ""}
							disabled={waiting}
							spellCheck="false"
							autoCorrect="off"
							autoComplete="off"
							onChange={onInputImageChange}
							rows={3}
						/>
						{inputImage && !isErrorImage && (
							<div className="image-preview">
								<img src={inputImage} onLoad={onImageLoad} onError={onImageError} />
							</div>
						)}
					</div>
					{isErrorImage && (
						<div className="field-error">That doesn't look like a valid image URL</div>
					)}
					<button className="walrus-upload-btn">
						<img src="/img/walrus-blue.svg" alt="Walrus" className="walrus-icon" />
						Upload to Walrus
					</button>
				</div>
				<button
					type="submit"
					disabled={waiting || isErrorForm || !inputName.trim() || !hasChanged}
					className={isErrorForm ? "disabled" : waiting ? "waiting" : ""}
				>
					{profile === null ? "CREATE PROFILE" : "EDIT PROFILE"}
				</button>
				{isErrorForm && <div className="field-error">Form has errors</div>}
			</form>
		);
	}

	const profileObjLabel = profile && (
		<span className="profile-id">
			<LinkToPolymedia network={network} kind="object" addr={profile.id} />
		</span>
	);

	const walrusSection = showWalrus && (
		<div>
			{/* Blob Upload Section */}
			<section>
				<FileUpload onUploadComplete={onUploadComplete} />
			</section>

			{/* Uploads Section */}
			<section>
				<h2>
					Uploads <span className="walrus-uploads-count">({uploadedBlobs.length})</span>
				</h2>
				<div className="walrus-uploads-list">
					{uploadedBlobs.length > 0 ? (
						uploadedBlobs.map((blobId) => {
							return (
								<ImageCard
									key={blobId.blobId}
									blobId={blobId.blobId}
									suiObjectId={blobId.suiObjectId}
									suiEventId={blobId.suiEventId}
									endEpoch={blobId.endEpoch}
								/>
							);
						})
					) : (
						<PlaceholderCard />
					)}
				</div>
			</section>
		</div>
	);

	return (
		<div id="page" className="page-manage-profile">
			<h1>PROFILE{profileObjLabel}</h1>
			{view}
			{walrusSection}
		</div>
	);
};
