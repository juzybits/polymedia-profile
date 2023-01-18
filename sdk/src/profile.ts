import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import {
    GetObjectDataResponse,
    JsonRpcProvider,
    Network,
    OwnedObjectRef,
    SignableTransaction,
    SuiObjectRef,
    TransactionEffects,
} from '@mysten/sui.js';

export const POLYMEDIA_PROFILE_PACKAGE_ID = '0xb836580486fd2b50405bd7f2fc0909c4da8edb8b';
export const POLYMEDIA_PROFILE_REGISTRY_ID = '0x566b219a1e913f952dc1390417c5958b1935b92b';

// TODO: getProfiles() : Promise<Profile[]>>
// TODO: ProfileCache to only fetch new addresses

const rpc = new JsonRpcProvider(Network.DEVNET);
const bcs = new BCS(getSuiMoveConfig());

export type FindProfileObjectIdsArgs = {
    lookupAddresses: string[];
    packageId?: string;
    registryId?: string;
}
export function findProfileObjectIds({
        lookupAddresses,
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
        registryId = POLYMEDIA_PROFILE_REGISTRY_ID
    }: FindProfileObjectIdsArgs): Promise<string[]> {
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
    return rpc.devInspectMoveCall(callerAddress, moveCall)
    .then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            const returnValue: any[] = resp.results.Ok[0][1].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const profileAddreses: string[] = bcs.de(valueType, valueData, 'hex');
            return profileAddreses; // TODO transform into Map<string, string>
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

// export type PolymediaProfile = {
//     id: string,
//     name: string,
//     image: string,
//     description: string,
// };
export type GetProfileObjectsArgs = {
    profileObjectIds: string[];
}
export function getProfileObjects({
        profileObjectIds,
    }: GetProfileObjectsArgs): Promise<SuiObjectRef[]> {
    return rpc.getObjectBatch(profileObjectIds)
    .then((objects: GetObjectDataResponse[]) => {
        const profiles: SuiObjectRef[] = [];
        for (const obj of objects)
            if (obj.status == 'Exists')
                profiles.push(obj.details as SuiObjectRef);
        return profiles;
    })
    .catch((error: any) => {
        throw error;
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
export function createRegistry({
        wallet,
        registryName,
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
    } : CreateRegistryArgs): Promise<OwnedObjectRef> {
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
    }).then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            if (effects.created) {
                return effects.created[0] as OwnedObjectRef;
            } else {
                throw new Error("transaction was successful, but new object is missing.");
            }
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
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
export function createProfile({
        wallet,
        name,
        image = '',
        description = '',
        packageId = POLYMEDIA_PROFILE_PACKAGE_ID,
        registryId = POLYMEDIA_PROFILE_REGISTRY_ID
    } : CreateProfileArgs): Promise<OwnedObjectRef[]> {
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
    })
    .then((resp: any) => {
        const effects = resp.effects || resp.EffectsCert?.effects?.effects; // Sui/Ethos || Suiet
        if (effects.status.status == 'success') {
            console.debug('[onSubmitCreateProfile] Success:', resp);
            return [ // `sui::dynamic_field::Field` and `polymedia_profile::profile::Profile`
                effects.created[0] as OwnedObjectRef,
                effects.created[1] as OwnedObjectRef,
            ];
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}
