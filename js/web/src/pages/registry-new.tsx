import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { create_registry } from "@polymedia/profile-sdk";
import { type SyntheticEvent, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../app/context";

export function PageRegistryNew() {
	const currAcct = useCurrentAccount();

	const { profileClient, openConnectModal } = useAppContext();

	const [inputName, setInputName] = useState("");
	const [waiting, setWaiting] = useState(false);

	const onSubmitCreateRegistry = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!currAcct) {
			openConnectModal();
			return;
		}
		console.debug(
			`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`,
		);
		setWaiting(true);
		try {
			const tx = new Transaction();
			create_registry(tx, profileClient.profilePkgId, inputName);

			const resp = await profileClient.signAndExecuteTx({ tx });
			console.debug("resp:", resp);

			if (resp.errors || resp.effects?.status.status !== "success") {
				toast.error(
					`Txn digest: ${resp.digest}\n` +
						`Txn status: ${resp.effects?.status.status}\n` +
						`Txn errors: ${JSON.stringify(resp.errors)}`,
				);
			}
		} catch (err) {
			console.warn("[onSubmitCreateRegistry]", err);
			toast.error(String(err));
		} finally {
			setWaiting(false);
		}
	};

	return (
		<div id="page" className="page-registry-new">
			<h1>NEW REGISTRY</h1>
			<form className="form" onSubmit={onSubmitCreateRegistry}>
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
				<button
					type="submit"
					className={waiting ? "primary waiting" : "primary"}
					disabled={waiting}
				>
					CREATE
				</button>
			</form>
		</div>
	);
}
