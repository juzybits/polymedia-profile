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



import { JsonRpcProvider, Network } from '@mysten/sui.js';
import { BCS, getSuiMoveConfig } from '@mysten/bcs';

const rpc = new JsonRpcProvider(Network.DEVNET);
const bcs = new BCS(getSuiMoveConfig());

export type GetProfilesArgs = {
    packageId: string;
    registryId: string;
    lookupAddresses: string[];
}
export async function getProfiles({ packageId, registryId, lookupAddresses }
        : GetProfilesArgs): Promise<Array<string>|string> {
    const moveCall = {
        packageObjectId: packageId,
        module: 'profile',
        function: 'get_profiles',
        typeArguments: [],
        arguments: [
            registryId,
            lookupAddresses,
        ],
    };
    const callerAddress = '0x7777777777777777777777777777777777777777';
    return await rpc.devInspectMoveCall(callerAddress, moveCall)
    .then((resp: any) => {
        const effects = resp.effects || resp.EffectsCert?.effects?.effects; // Sui/Ethos || Suiet
        if (effects.status.status == 'success') {
            const returnValue: Array<any> = resp.results.Ok[0][1].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const profileAddreses: Array<string> = bcs.de(valueType, valueData, 'hex');
            return profileAddreses;
        } else {
            return effects.status.error;
        }
    })
    .catch((error: any) => {
        return error.message;
    });
}


// TODO: remove
// import { getProfiles } from '@polymedia/tools';
async function foo() {
    const result = await getProfiles({
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
