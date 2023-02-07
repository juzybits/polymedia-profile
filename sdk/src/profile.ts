// TODO: split large batches into 50 lookup addresses per request
// TODO: store in local storage for fast initial load, then replace with 1st request
// TODO: noCache option

import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import {
    GetObjectDataResponse,
    JsonRpcProvider,
    MoveCallTransaction,
    Network,
    OwnedObjectRef,
    SignableTransaction,
    SuiMoveObject,
    SuiAddress,
    SuiObject,
    TransactionEffects,
    UnserializedSignableTransaction,
} from '@mysten/sui.js';

const RPC_DEVNET = new JsonRpcProvider(Network.DEVNET);
export const POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET = '0xee46d8bbaa8c03e030888c4ca7ea551ce79d49b3';
export const POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET = '0x78095df93ed9fe821840ef96771ffec484ffca18';

const RPC_TESTNET = new JsonRpcProvider('https://fullnode.testnet.sui.io:443');
export const POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET = '0x123';
export const POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET = '0x123';

export type PolymediaProfile = {
    id: SuiAddress,
    name: string,
    image: string,
    description: string,
    owner: SuiAddress,
    suiObject: SuiObject,
}

type WalletArg = {
    signAndExecuteTransaction: (transaction: SignableTransaction) => Promise<any>,
}

export class ProfileManager {
    private cache: Map<SuiAddress, PolymediaProfile|null> = new Map();
    private rpc: JsonRpcProvider;
    private packageId: SuiAddress;
    private registryId: SuiAddress;

    constructor(network: string, packageId?: SuiAddress, registryId?: SuiAddress) {
        if (network === 'devnet') {
            this.rpc = RPC_DEVNET;
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET;
        } else if (network === 'testnet') {
            this.rpc = RPC_TESTNET;
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET;
        } else {
            throw new Error('Network not recognized: ' + network);
        }
    }

    public getPackageId(): SuiAddress { return this.packageId; }
    public getRegistryId(): SuiAddress { return this.registryId; }

    public async getProfiles(lookupAddresses: Iterable<SuiAddress>): Promise<Map<SuiAddress, PolymediaProfile>> {
        const result = new Map<SuiAddress, PolymediaProfile>();
        const newLookupAddresses = new Set<SuiAddress>(); // unseen addresses (i.e. not cached)

        // Check if addresses are already in cache and add them to the returned map
        for (const addr of lookupAddresses) {
            if (this.cache.has(addr)) {
                const cachedProfile = this.cache.get(addr);
                if (cachedProfile) {
                    result.set(addr, cachedProfile);
                }
            } else { // address not seen before so we need to look it up
                newLookupAddresses.add(addr);
            }
        }
        if (newLookupAddresses.size === 0) return result;

        // Find the remaining profile object IDs
        const newObjectIds = await this.findProfileObjectIds({
            lookupAddresses: [...newLookupAddresses]
        });

        // Add missing addresses to the cache
        for (const addr of newLookupAddresses) {
            if (!newObjectIds.has(addr)) {
                this.cache.set(addr, null);
            }
        }
        if (newObjectIds.size === 0) return result;

        // Retrieve the remaining profile objects
        const profileObjects = await this.getProfileObjects({
            objectIds: [...newObjectIds.values()]
        });

        // Add the remaining profile objects to the returned map and cache
        for (const profile of profileObjects) {
            result.set(profile.owner, profile);
            this.cache.set(profile.owner, profile);
        }

        return result;
    }

    public findProfileObjectIds({ lookupAddresses }: {
        lookupAddresses: SuiAddress[]
    }): Promise<Map<SuiAddress,SuiAddress>>
    {
        return findProfileObjectIds({
            rpc: this.rpc,
            packageId: this.packageId,
            registryId: this.registryId,
            lookupAddresses,
        });
    }

    public getProfileObjects({ objectIds }: {
        objectIds: SuiAddress[]
    }): Promise<PolymediaProfile[]>
    {
        return getProfileObjects({
            rpc: this.rpc,
            objectIds,
        });
    }

    public createRegistry({ wallet, registryName }: {
        wallet: WalletArg,
        registryName: string,
    }): Promise<OwnedObjectRef>
    {
        return createRegistry({
            wallet,
            packageId: this.packageId,
            registryName,
        });
    }

    public createProfile({ wallet, name, image='', description='' }: {
        wallet: WalletArg,
        name: string,
        image?: string,
        description?: string,
    }): Promise<SuiAddress>
    {
        return createProfile({
            wallet,
            packageId: this.packageId,
            registryId: this.registryId,
            name,
            image,
            description,
        });
    }
}

function getObjects({ rpc, objectIds }: {
    rpc: JsonRpcProvider,
    objectIds: SuiAddress[],
}): Promise<SuiObject[]>
{
    return rpc.getObjectBatch(
        objectIds
    ).then((objDataResps: GetObjectDataResponse[]) => {
        const suiObjects: SuiObject[] = [];
        for (const obj of objDataResps)
            if (obj.status == 'Exists')
                suiObjects.push(obj.details as SuiObject);
        return suiObjects;
    });
}

// Register a custom struct type for Sui 'Binary Canonical (de)Serialization'
const bcs = new BCS( getSuiMoveConfig() );
const LookupResult = {
    lookupAddr: BCS.ADDRESS,
    profileAddr: BCS.ADDRESS,
};
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET + '::profile::LookupResult', LookupResult);
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET + '::profile::LookupResult', LookupResult);
function findProfileObjectIds({
    rpc,
    packageId,
    registryId,
    lookupAddresses,
}: {
    rpc: JsonRpcProvider,
    packageId: SuiAddress,
    registryId: SuiAddress,
    lookupAddresses: SuiAddress[],
}): Promise<Map<SuiAddress,SuiAddress>>
{
    lookupAddresses = [...new Set(lookupAddresses)]; // deduplicate
    const callerAddress = '0x7777777777777777777777777777777777777777';

    const signableTxn = {
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'get_profiles',
            typeArguments: [],
            arguments: [
                registryId,
                lookupAddresses,
            ],
        } as MoveCallTransaction,
    } as UnserializedSignableTransaction;

    return rpc.devInspectTransaction(callerAddress, signableTxn)
    .then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            // Deserialize the returned value into an array of LookupResult objects
            const returnValue: any[] = resp.results.Ok[0][1].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const lookupResults: Array<typeof LookupResult> = bcs.de(valueType, valueData, 'hex');
            // Pack the results into a Map
            const results = new Map<SuiAddress, SuiAddress>();
            for (const result of lookupResults) {
                results.set('0x'+result.lookupAddr, '0x'+result.profileAddr);
            }
            return results;
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

function getProfileObjects({ rpc, objectIds }: {
    rpc: JsonRpcProvider,
    objectIds: SuiAddress[],
}): Promise<PolymediaProfile[]>
{
    return getObjects({
        rpc, objectIds
    })
    .then((objects: SuiObject[]) => {
        const profiles: PolymediaProfile[] = [];
        for (const obj of objects) {
            const objData = obj.data as SuiMoveObject;
            const objOwner = obj.owner as { AddressOwner: SuiAddress };
            profiles.push({
                id: objData.fields.id.id,
                name: objData.fields.name,
                image: objData.fields.image,
                description: objData.fields.description,
                owner: objOwner.AddressOwner,
                suiObject: obj,
            });
        }
        return profiles;
    })
    .catch((error: any) => {
        throw error;
    });
}

function createRegistry({
    wallet,
    packageId,
    registryName,
} : {
    wallet: WalletArg,
    packageId: SuiAddress,
    registryName: string,
}): Promise<OwnedObjectRef>
{
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
    })
    .then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status === 'success') {
            if (effects.created?.length === 1) {
                return effects.created[0] as OwnedObjectRef;
            } else { // Should never happen
                throw new Error('New registry object missing from response: ' + JSON.stringify(resp));
            }
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

async function createProfile({
    wallet,
    packageId,
    registryId,
    name,
    image = '',
    description = '',
} : {
    wallet: WalletArg,
    packageId: SuiAddress,
    registryId: SuiAddress,
    name: string,
    image?: string,
    description?: string,
}): Promise<SuiAddress>
{
    // Creates 2 objects: the profile (owned by the caller) and a dynamic field (inside the registry's table)
    const resp = await wallet.signAndExecuteTransaction({
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

    // Verify the transaction results
    //                  Sui/Ethos || Suiet
    const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
    if (effects.status.status !== 'success') {
        throw new Error(effects.status.error);
    }
    // Extract the new profile object ID from the 'EventCreateProfile' event
    for (const event of effects.events||[]) {
        if ('moveEvent' in event) {
            return event.moveEvent.fields.profile_id;
        }
    }
    // Should never happen:
    throw new Error("Transaction was successful, but can't find the new profile object ID in the response: " + JSON.stringify(resp));
}
