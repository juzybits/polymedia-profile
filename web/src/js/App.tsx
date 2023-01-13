import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { EthosConnectProvider } from 'ethos-connect';
import imgLogo from '../img/logo.png';

export function App(props: any)
{
    // TODO: remove
    useEffect(() => {
        foo();
    }, []);

    return <EthosConnectProvider
        ethosConfiguration={{hideEmailSignIn: true}}
        dappName='Polymedia Accounts'
        dappIcon={<img src={imgLogo} alt='Polymedia logo' />}
        connectMessage='Polymedia Accounts'
        >
        <Outlet context={[]} />
    </EthosConnectProvider>;
}

// TODO: remove
import { getProfiles } from '@polymedia/tools';
async function foo() {
    const result = await getProfiles({
        packageId: '0xc7722a5f88c5cbf0f4005eed969e76bebeba2415',
        registryId: '0xd58562b32f7016c88dc351a92040cd5255ce8831',
        lookupAddresses: [
            '0xed132b8d256948e1f4ce5644564576c2dec666a2',
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222',
        ],
    });
    console.log(JSON.stringify(result));
    console.log(result);
}
