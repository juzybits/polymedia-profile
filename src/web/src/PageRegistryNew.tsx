import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { create_registry } from "@polymedia/profile-sdk";
import { SyntheticEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { notifyError } from "./components/Notification";

export function PageRegistryNew()
{
    useEffect(() => {
        document.title = "Polymedia Profile - New Registry";
    }, []);

    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const { profileClient, openConnectModal } = useOutletContext<AppContext>();

    const [inputName, setInputName] = useState("");
    const [waiting, setWaiting] = useState(false);

    const onSubmitCreateRegistry = async (e: SyntheticEvent) =>
    {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`);
        setWaiting(true);
        try {
            const tx = new Transaction();
            create_registry(tx, profileClient.packageId, inputName);

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
                notifyError(`Txn digest: ${resp.digest}\n`
                    + `Txn status: ${resp.effects?.status.status}\n`
                    + `Txn errors: ${JSON.stringify(resp.errors)}`);
            }
        } catch (err) {
            console.warn("[onSubmitCreateRegistry]", err);
            notifyError(String(err));
        } finally {
            setWaiting(false);
        }
    };

    return <div id="page" className="page-registry-new">
        <h1>NEW REGISTRY</h1>
        <form className="form" onSubmit={onSubmitCreateRegistry}>
            <div className="form-field">
                <label>Name</label>
                <input value={inputName} type="text" required maxLength={60}
                    className={waiting ? "waiting" : ""} disabled={waiting}
                    spellCheck="false" autoCorrect="off" autoComplete="off"
                    onChange={e => setInputName(e.target.value)}
                />
            </div>
            <button type="submit" className={waiting ? "primary waiting" : "primary"} disabled={waiting}
                >CREATE</button>
        </form>
    </div>;
}
