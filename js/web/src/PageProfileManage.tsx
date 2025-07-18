import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { create_profile, edit_profile } from "@polymedia/profile-sdk";
import { LinkToPolymedia } from "@polymedia/suitcase-react";
import { type SyntheticEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppContext } from "./App";
import { notifyError, notifyOkay } from "./components/Notification";
import "./styles/ManageProfile.less";

export const PageProfileManage: React.FC = () => {
	/* State */

	const suiClient = useSuiClient();
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signTransaction } = useSignTransaction();

	const { network, profile, profileClient, reloadProfile, openConnectModal } =
		useOutletContext<AppContext>();

	// Form inputs
	const [inputName, setInputName] = useState("");
	const [inputImage, setInputImage] = useState("");
	const [inputDescription, setInputDescription] = useState("");
	// Form errors
	const [isErrorImage, setIsErrorImage] = useState(false);
	const [isErrorForm, setIsErrorForm] = useState(false);
	const [isErrorImgur, setIsErrorImgur] = useState(false);
	// Other state
	const [waiting, setWaiting] = useState(false);

	/* Functions */

	useEffect(() => {
		document.title = "Polymedia Profile - Manage";
	}, []);

	useEffect(() => {
		setInputName(profile?.name || "");
		setInputImage(profile?.imageUrl || "");
		setInputDescription(profile?.description || "");
	}, [profile]);

	const onInputImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.value) {
			setIsErrorImage(false);
			setIsErrorForm(false);
			setIsErrorImgur(false);
		}
		setInputImage(e.target.value);
	};
	const onImageLoad = () => {
		setIsErrorImage(false);
		setIsErrorForm(false);
		setIsErrorImgur(false);
	};

	const onImageError = () => {
		setIsErrorImage(true);
		setIsErrorForm(true);
		setIsErrorImgur(inputImage.startsWith("https://imgur.com/"));
	};

	const onSubmitCreateProfile = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!currentAccount) {
			openConnectModal();
			return;
		}
		console.debug(`[onSubmitCreateProfile] Attempting to create profile: ${inputName}`);
		setWaiting(true);
		try {
			const tx = new Transaction();
			create_profile(
				tx,
				profileClient.packageId,
				profileClient.registryId,
				inputName,
				inputImage,
				inputDescription,
				null,
			);

			const signedTx = await signTransaction({
				transaction: tx,
			});

			const resp = await suiClient.executeTransactionBlock({
				transactionBlock: signedTx.bytes,
				signature: signedTx.signature,
				options: { showEffects: true },
			});
			console.debug("resp:", resp);

			if (resp.errors || resp.effects?.status.status !== "success") {
				notifyError(
					`Txn digest: ${resp.digest}\n` +
						`Txn status: ${resp.effects?.status.status}\n` +
						`Txn errors: ${JSON.stringify(resp.errors)}`,
				);
			} else {
				notifyOkay("SUCCESS");
				reloadProfile();
			}
		} catch (err) {
			console.warn("[onSubmitCreateProfile]", err);
			notifyError(String(err));
		} finally {
			setWaiting(false);
		}
	};

	const onSubmitEditProfile = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!currentAccount) {
			openConnectModal();
			return;
		}
		if (!profile) {
			notifyError("[onSubmitEditProfile] Missing profile");
			return;
		}
		console.debug("[onSubmitEditProfile] Attempting to edit profile");
		setWaiting(true);
		try {
			const tx = new Transaction();
			edit_profile(
				tx,
				profile.id,
				profileClient.packageId,
				inputName,
				inputImage,
				inputDescription,
				null,
			);

			const signedTx = await signTransaction({
				transaction: tx,
			});

			const resp = await suiClient.executeTransactionBlock({
				transactionBlock: signedTx.bytes,
				signature: signedTx.signature,
				options: { showEffects: true },
			});
			console.debug("resp:", resp);

			if (resp.errors || resp.effects?.status.status !== "success") {
				notifyError(
					`Txn digest: ${resp.digest}\n` +
						`Txn status: ${resp.effects?.status.status}\n` +
						`Txn errors: ${JSON.stringify(resp.errors)}`,
				);
			} else {
				notifyOkay("SUCCESS");
				reloadProfile();
			}
		} catch (err) {
			console.warn("[onSubmitEditProfile]", err);
			notifyError(String(err));
		} finally {
			setWaiting(false);
		}
	};

	/* HTML */

	let view: React.ReactNode;
	if (!currentAccount) {
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
						onChange={(e) => setInputName(e.target.value)}
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
						onChange={(e) => setInputDescription(e.target.value)}
					/>
				</div>
				<div className="form-field">
					<label>
						Image URL<span className="field-optional">[optional]</span>
					</label>
					<input
						value={inputImage}
						type="text"
						className={waiting ? "waiting" : ""}
						disabled={waiting}
						spellCheck="false"
						autoCorrect="off"
						autoComplete="off"
						onChange={onInputImageChange}
					/>
					{isErrorImage && (
						<div className="field-error">That doesn't look like a valid image URL</div>
					)}
					<div className="field-info">
						Right click the image, then click 'Copy Image Address'. To use a picture from
						your device, upload it to a service like{" "}
						<a
							href="https://imgur.com/upload"
							target="_blank"
							rel="noopener nofollow noreferrer"
						>
							imgur.com
						</a>
						, then copy the image address.
					</div>
					{isErrorImgur && (
						<div className="field-error-imgur">
							<img src="/img/drake.webp" />
						</div>
					)}
				</div>
				<button
					type="submit"
					disabled={waiting || isErrorForm}
					className={isErrorForm ? "disabled" : waiting ? "waiting" : ""}
				>
					{profile === null ? "CREATE PROFILE" : "EDIT PROFILE"}
				</button>
				{isErrorForm && <div className="field-error">Form has errors</div>}
			</form>
		);
	}

	const imageSection = !inputImage ? (
		<></>
	) : (
		<div className={`section section-image ${isErrorImage ? "hidden" : ""}`}>
			<h2>Image preview</h2>
			<img src={inputImage} onLoad={onImageLoad} onError={onImageError} />
		</div>
	);

	const infoSection = !profile ? (
		<></>
	) : (
		<div className="section section-info">
			<h2>Details</h2>
			<p>
				Profile: <LinkToPolymedia network={network} kind="object" addr={profile.id} />
			</p>
			<p>
				Registry:{" "}
				<LinkToPolymedia
					network={network}
					kind="object"
					addr={profileClient.registryId}
				/>
			</p>
		</div>
	);

	return (
		<div id="page" className="page-manage-profile">
			<h1>{profile ? "EDIT" : profile === null ? "CREATE" : "MANAGE"} PROFILE</h1>
			{view}
			{imageSection}
			{infoSection}
		</div>
	);
};
