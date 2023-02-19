import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectModal, WalletKitProvider } from '@mysten/wallet-kit';
import { ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';

export function App()
{
    const [profileManager] = useState( new ProfileManager('devnet') );
    const [showConnectModal, setShowConnectModal] = useState(false);

    const openConnectModal = (): void => {
        setShowConnectModal(true);
    }

    return <WalletKitProvider>
        <ConnectModal
            open={showConnectModal}
            onClose={() => setShowConnectModal(false)}
        />
        <Nav openConnectModal={openConnectModal} />
        <Outlet context={[profileManager, openConnectModal]} />
    </WalletKitProvider>;
}
