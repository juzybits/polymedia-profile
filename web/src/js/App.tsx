import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectModal, WalletKitProvider } from '@mysten/wallet-kit';
import { ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import '../css/App.less';

export type OutletContext = {
    profileManager: ProfileManager;
    openConnectModal: () => void;
};

export function App()
{
    const [profileManager] = useState( new ProfileManager({network: 'devnet'}) );
    const [showConnectModal, setShowConnectModal] = useState(false);

    const openConnectModal = (): void => {
        setShowConnectModal(true);
    }

    const outletContext: OutletContext = {
        profileManager,
        openConnectModal: () => setShowConnectModal(true)
    };

    return <WalletKitProvider>
    <ConnectModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
    />
    <div id='layout'>
        <Nav openConnectModal={openConnectModal} />
        <Outlet context={outletContext} />
    </div>
    </WalletKitProvider>;
}
