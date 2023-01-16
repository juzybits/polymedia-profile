import { Outlet } from 'react-router-dom';
import { EthosConnectProvider } from 'ethos-connect';

import { Nav } from './Nav';
import imgLogo from '../img/logo.png';

export function App()
{
    return <EthosConnectProvider
        ethosConfiguration={{hideEmailSignIn: true}}
        dappName='Polymedia Profile'
        dappIcon={<img src={imgLogo} alt='Polymedia logo' />}
        connectMessage='Polymedia Profile'
        >
        <Nav />
        <Outlet context={[]} />
    </EthosConnectProvider>;
}
