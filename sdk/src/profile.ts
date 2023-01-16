import { JsonRpcProvider, Network, SignableTransaction } from '@mysten/sui.js';
import { BCS, getSuiMoveConfig } from '@mysten/bcs';

// TODO: getProfiles() : Promise<Array<Profile>>
// TODO: ProfileCache to only fetch new addresses

const rpc = new JsonRpcProvider(Network.DEVNET);
const bcs = new BCS(getSuiMoveConfig());

export type GetProfilesArgs = {
    packageId: string;
    registryId: string;
    lookupAddresses: string[];
}
export async function getProfileObjectIds({ packageId, registryId, lookupAddresses }
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

export type WalletArg = {
    signAndExecuteTransaction: (transaction: SignableTransaction) => Promise<any>,
}
export type CreateRegistryArgs = {
    wallet: WalletArg,
    packageId: string;
    registryName: string;
}
export async function createRegistry({ wallet, packageId, registryName }
        : CreateRegistryArgs): Promise<any> {
    return wallet.signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'create_registry',
            typeArguments: [],
            arguments: [
                registryName,
            ],
            gasBudget: 1000,
        }
    });

}

export type CreateProfileArgs = {
    wallet: WalletArg,
    packageId: string;
    registryId: string,
    name: string,
    image: string,
    description: string,
}
export async function createProfile({ wallet, packageId, registryId, name, image, description }
        : CreateProfileArgs): Promise<any> {
    return wallet.signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'create_profile',
            typeArguments: [],
            arguments: [
                registryId,
                name,
                image,
                description,
            ],
            gasBudget: 1000,
        }
    });

}
