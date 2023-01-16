import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { EthosConnectProvider } from 'ethos-connect';

import { Nav } from './Nav';
import imgLogo from '../img/logo.png';

export function App()
{
    // TODO: remove
    useEffect(() => {
        foo();
    }, []);

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


import { getProfileObjectIds } from '@polymedia/profile-sdk';

// TODO: remove
async function foo() {
    const result = await getProfileObjectIds({
        packageId: '0x029a669d58113d3153811722f684dc3b7785543d',
        registryId: '0x0faaf2d1fcb02a6a3a1372d8b149929051f7a84a',
        lookupAddresses: [
            '0x1111111111111111111111111111111111111111',
            '0xe6717d39d166d9fa852c52e9ec0f76cb750457b7',
            '0x2222222222222222222222222222222222222222',
        ],
    });
    console.log(JSON.stringify(result));
    console.log(result);
}
