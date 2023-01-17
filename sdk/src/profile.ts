import { JsonRpcProvider, Network, SignableTransaction, OwnedObjectRef, TransactionEffects } from '@mysten/sui.js';
import { BCS, getSuiMoveConfig } from '@mysten/bcs';

export const POLYMEDIA_PROFILE_PACKAGE_ID = '0xb836580486fd2b50405bd7f2fc0909c4da8edb8b';
export const POLYMEDIA_PROFILE_REGISTRY_ID = '0xebd78965372873f7423a2184bcc50966e8119afb';

// TODO: getProfiles() : Promise<Array<Profile>>
// TODO: ProfileCache to only fetch new addresses

const rpc = new JsonRpcProvider(Network.DEVNET);
const bcs = new BCS(getSuiMoveConfig());

export type GetProfilesArgs = {
    lookupAddresses: string[];
    packageId?: string;
    registryId?: string;
}
export async function getProfileObjectIds({
        lookupAddresses,
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
        registryId = POLYMEDIA_PROFILE_REGISTRY_ID
    }: GetProfilesArgs): Promise<Array<string>|string> {
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
            return profileAddreses; // TODO transform into Map<string, string>
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
    registryName: string;
    packageId?: string;
}
export async function createRegistry({
        wallet,
        registryName,
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
    } : CreateRegistryArgs): Promise<OwnedObjectRef|string> {
    return await wallet.signAndExecuteTransaction({
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
    }).then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            if (effects.created) {
                return effects.created[0] as OwnedObjectRef;
            } else {
                return "transaction was successful, but new object is missing."
            }
        } else {
            return effects.status.error;
        }
    })
    .catch((error: any) => {
        return error.message;
    });

}

export type CreateProfileArgs = {
    wallet: WalletArg,
    name: string,
    image?: string,
    description?: string,
    packageId?: string;
    registryId?: string,
}
export async function createProfile({
        wallet,
        name,
        image = '',
        description = '',
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
        registryId = POLYMEDIA_PROFILE_REGISTRY_ID
    } : CreateProfileArgs): Promise<any> {
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
