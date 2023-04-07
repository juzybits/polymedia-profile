import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Connection, JsonRpcProvider } from '@mysten/sui.js';
import { ConnectModal, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import { NetworkName, loadNetwork, loadRpcConfig } from '@polymedia/webutils';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import { notifyError } from './components/Notification';
import '../css/App.less';

export type AppContext = {
    network: NetworkName,
    profile: PolymediaProfile|null|undefined,
    profileManager: ProfileManager;
    openConnectModal: () => void;
    reloadProfile: () => Promise<PolymediaProfile|null|undefined>;
};

export const AppWrap: React.FC = () =>
    <WalletKitProvider><App /></WalletKitProvider>;

const App: React.FC = () =>
{
    const { currentAccount } = useWalletKit();
    const [profile, setProfile] = useState<PolymediaProfile|null|undefined>(undefined);
    const [showConnectModal, setShowConnectModal] = useState(false);
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
    }, [currentAccount, profileManager]);

    const reloadProfile = async (): Promise<PolymediaProfile|null|undefined> => {
        if (!currentAccount || !profileManager) {
            setProfile(undefined);
            return undefined;
        }
        return await profileManager.getProfile({
            lookupAddress: currentAccount.address,
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
        setShowConnectModal(true);
    };

    if (!network || !profileManager) {
        return <></>;
    }

    const appContext: AppContext = {
        network,
        profile,
        profileManager,
        reloadProfile,
        openConnectModal,
    };

    return <>
        <ConnectModal
            open={showConnectModal}
            onClose={() => setShowConnectModal(false)}
        />

        <div id='layout'>
             {/* #nav */}
            <Nav network={network} openConnectModal={openConnectModal} profile={profile} />
            {/* #page */}
            <Outlet context={appContext} />
            <div id='filler-section'></div>
        </div>
    </>;
}
