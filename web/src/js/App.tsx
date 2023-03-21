import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectModal, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import { notifyError } from './components/Notification';
import '../css/App.less';

export type AppContext = {
    network: string,
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

    const network = 'devnet'; // TODO: add toggle
    const [profileManager] = useState( new ProfileManager({network}));
    const [profile, setProfile] = useState<PolymediaProfile|null|undefined>(undefined);

    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        reloadProfile();
    }, [currentAccount]);

    const reloadProfile = async (): Promise<PolymediaProfile|null|undefined> => {
        if (!currentAccount) {
            setProfile(undefined);
            return undefined;
        }
        return await profileManager.getProfile({
            lookupAddress: currentAccount,
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
            <Nav openConnectModal={openConnectModal} profile={profile} />
            {/* #page */}
            <Outlet context={appContext} />
            <div id='filler-section'></div>
        </div>
    </>;
}
