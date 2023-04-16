import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Connection, JsonRpcProvider } from '@mysten/sui.js';
import { EthosConnectProvider, SignInButton, ethos } from 'ethos-connect';
import { NetworkName, loadNetwork, loadRpcConfig } from '@polymedia/webutils';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

import { notifyError } from './components/Notification';
import '../css/App.less';

export type AppContext = {
    network: NetworkName,
    profile: PolymediaProfile|null|undefined,
    setProfile: React.Dispatch<React.SetStateAction<PolymediaProfile|null|undefined>>;
    profileManager: ProfileManager;
    openConnectModal: () => void;
};

export const AppEthos: React.FC = () =>
    <EthosConnectProvider
      ethosConfiguration={{
        network: 'https://rpc-testnet.suiscan.xyz',
        hideEmailSignIn: true,
      }}>
        <App />
    </EthosConnectProvider>;

const App: React.FC = () =>
{
    const { wallet } = ethos.useWallet()
    const [profile, setProfile] = useState<PolymediaProfile|null|undefined>(undefined);
    const [network, setNetwork] = useState<NetworkName|null>(null);
    const [profileManager, setProfileManager] = useState<ProfileManager|null>(null);

    useEffect(() => {
        async function initialize() {
            const network = loadNetwork();
            const rpcConfig = await loadRpcConfig({network});
            const rpcProvider = new JsonRpcProvider(new Connection(rpcConfig));
            setNetwork(network);
            setProfileManager( new ProfileManager({network, rpcProvider}) );
        };
        initialize();
    }, []);

    useEffect(() => {
        profileManager && reloadProfile();
    }, [wallet, profileManager]);

    const reloadProfile = async (): Promise<PolymediaProfile|null|undefined> => {
        if (!wallet || !wallet.currentAccount || !profileManager) {
            setProfile(undefined);
            return undefined;
        }
        return await profileManager.getProfile({
            lookupAddress: wallet.currentAccount.address,
            useCache: false,
        })
        .then((result: PolymediaProfile|null) => {
            console.debug('[reloadProfile] Setting profile:', result);
            setProfile(result);
            return result;
        })
        .catch((error: any) => {
            const errorString = String(error.stack || error.message || error);
            console.warn('[reloadProfile] Error:', errorString);
            notifyError(errorString);
            return undefined;
        })
    };

    const openConnectModal = (): void => {
        ethos.showSignInModal();
    };

    if (!network || !profileManager) {
        return <></>;
    }

    const appContext: AppContext = {
        network,
        profile,
        setProfile,
        profileManager,
        openConnectModal,
    };

    return <>
        <div id='layout'>
            <div id='nav'>
                <SignInButton />
            </div>
            <Outlet context={appContext} />
            <div id='filler-section'></div>
        </div>
    </>;
}
