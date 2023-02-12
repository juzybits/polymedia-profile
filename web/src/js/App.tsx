import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { EthosConnectProvider } from 'ethos-connect';
import { ProfileManager } from '@polymedia/profile-sdk';

import { Nav } from './Nav';
import imgLogo from '../img/logo.png';

export function App()
{
    const [profileManager] = useState( new ProfileManager('devnet') );

    return <EthosConnectProvider
        ethosConfiguration={{hideEmailSignIn: true}}
        dappName='Polymedia Profile'
        dappIcon={<img src={imgLogo} alt='Polymedia logo' />}
        connectMessage='Polymedia Profile'
        >
        <Nav />
        <Outlet context={[profileManager]} />
    </EthosConnectProvider>;
}
