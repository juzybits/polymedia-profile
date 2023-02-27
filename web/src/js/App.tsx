import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectModal, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import '../css/App.less';

export type AppContext = {
    network: string,
    profile: PolymediaProfile|null|undefined,
    profileManager: ProfileManager;
    openConnectModal: () => void;
    reloadProfile: () => void;
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
    const [suiError, setSuiError] = useState('');

    useEffect(() => {
        reloadProfile();
    }, [currentAccount]);

    const reloadProfile = (): void => {
        if (!currentAccount) {
            setProfile(undefined);
            return;
        }
        profileManager.getProfile({
            lookupAddress: currentAccount,
            useCache: false,
        })
        .then((result: PolymediaProfile|null) => {
            setProfile(result);
            console.debug('[reloadProfile] Setting profile:', result);
        })
        .catch((error: any) => {
            const errorString = String(error.stack || error.message || error);
            setSuiError(errorString);
            console.warn('[reloadProfile] Error:', errorString);
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
            <Nav openConnectModal={openConnectModal} /> {/* #nav */}
            <Outlet context={appContext} /> {/* #page */}
        </div>

        { suiError && <div className='sui-error'>⚠️ SUI ERROR:<br/>{suiError}</div> }
    </>;
}
