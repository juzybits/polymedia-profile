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


import { getProfileObjectIds } from './lib/profile';

// TODO: remove
async function foo() {
    const result = await getProfileObjectIds({
        packageId: '0xc7722a5f88c5cbf0f4005eed969e76bebeba2415',
        registryId: '0xd58562b32f7016c88dc351a92040cd5255ce8831',
        lookupAddresses: [
            '0x1111111111111111111111111111111111111111',
            '0xe6717d39d166d9fa852c52e9ec0f76cb750457b7',
            '0x2222222222222222222222222222222222222222',
        ],
    });
    console.log(JSON.stringify(result));
    console.log(result);
}
