import { useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { SyntheticEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { notifyError } from "./components/Notification";

export function RegistryNew()
{
    useEffect(() => {
        document.title = "Polymedia Profile - New Registry";
    }, []);

    const currentAccount = useCurrentAccount();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const { profileClient, openConnectModal } = useOutletContext<AppContext>();

    const [inputName, setInputName] = useState("");
    const [waiting, setWaiting] = useState(false);

    const onSubmitCreateRegistry = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`);
        setWaiting(true);
        try {
            const registryObject = await profileClient.createRegistry(
                signTransaction,
                inputName
            );
            console.debug("[onSubmitCreateRegistry] New registry:", registryObject);
        } catch(error: any) {
            notifyError(error.message);
        }
        setWaiting(false);
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
