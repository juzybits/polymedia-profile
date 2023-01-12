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
import { JsonRpcProvider, SuiTransactionResponse, GetObjectDataResponse, Network } from '@mysten/sui.js';
import { Base64DataBuffer } from '@mysten/sui.js';

export const POLYMEDIA_CHAT_PACKAGE = '0x000ea07a8f60fd22be460f40bc57ad606e418eb7';
export const rpc = new JsonRpcProvider(Network.DEVNET);

async function foo() {
    const address = '0x0123012301230123012301230123012301230123';
    const moveCall = {
        packageObjectId: '0xc7722a5f88c5cbf0f4005eed969e76bebeba2415',
        module: 'profile',
        function: 'get_profiles',
        typeArguments: [],
        arguments: [
            '0xd58562b32f7016c88dc351a92040cd5255ce8831',
            [
                '0xed132b8d256948e1f4ce5644564576c2dec666a2',
                '0x1111111111111111111111111111111111111111',
                '0x2222222222222222222222222222222222222222',
            ],
        ],
    };
    const result = await rpc.devInspectMoveCall(address, moveCall);
    console.log(JSON.stringify(result));
    console.log(result);
}
