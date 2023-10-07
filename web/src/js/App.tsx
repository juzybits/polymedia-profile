import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuiClient } from '@mysten/sui.js/client';
import { ConnectModal, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import { NetworkName, isLocalhost, loadNetwork, getRpcConfig } from '@polymedia/webutils';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import { notifyError } from './components/Notification';
import '../css/App.less';

import { registerSuiSnapWallet } from "@kunalabs-io/sui-snap-wallet";
registerSuiSnapWallet();

export type AppContext = {
    network: NetworkName;
    profile: PolymediaProfile|null|undefined;
    profileManager: ProfileManager;
    reloadProfile: () => Promise<PolymediaProfile|null|undefined>;
    openConnectModal: () => void;
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
            const network = isLocalhost() ? loadNetwork() : 'mainnet';
            const rpcConfig = await getRpcConfig({network, fetch: false});
            const suiClient = new SuiClient({url: rpcConfig.fullnode});
            setNetwork(network);
            setProfileManager( new ProfileManager({network, suiClient}) );
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
        return await profileManager.getProfileByOwner({
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
