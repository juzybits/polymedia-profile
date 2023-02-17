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
export const POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET = '0x2beb7a236ae8b9257114a219d81e998c9b1c96b8';
export const POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET = '0x2ae98a431cfa04834bf864b37bdfe5f41a15e208';

const RPC_TESTNET = new JsonRpcProvider('https://fullnode.testnet.sui.io:443');
export const POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET = '0x123';
export const POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET = '0x123';

/**
 * Represents a `polymedia_profile::profile::Profile` Sui object
 */
export type PolymediaProfile = {
    id: SuiAddress,
    name: string,
    url: string, // image URL
    description: string,
    owner: SuiAddress,
    suiObject: SuiObject,
}

/**
 * Helps you interact with the `polymedia_profile` Sui package
 */
export class ProfileManager {
    #cache: Map<SuiAddress, PolymediaProfile|null> = new Map();
    #rpc: JsonRpcProvider;
    #packageId: SuiAddress;
    #registryId: SuiAddress;

    constructor(network: string, packageId?: SuiAddress, registryId?: SuiAddress) {
        if (network === 'devnet') {
            this.#rpc = RPC_DEVNET;
            this.#packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET;
            this.#registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET;
        } else if (network === 'testnet') {
            this.#rpc = RPC_TESTNET;
            this.#packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET;
            this.#registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET;
        } else {
            throw new Error('Network not recognized: ' + network);
        }
    }

    public getPackageId(): SuiAddress { return this.#packageId; }
    public getRegistryId(): SuiAddress { return this.#registryId; }

    public async getProfiles({ lookupAddresses, useCache=true }: {
        lookupAddresses: Iterable<SuiAddress>,
        useCache?: boolean,
    }): Promise<Map<SuiAddress, PolymediaProfile|null>>
    {
        const result = new Map<SuiAddress, PolymediaProfile|null>();
        const newLookupAddresses = new Set<SuiAddress>(); // unseen addresses (i.e. not cached)

        // Check if addresses are already in cache and add them to the returned map
        for (const addr of lookupAddresses) {
            if (useCache && this.#cache.has(addr)) {
                const cachedProfile = this.#cache.get(addr) || null;
                result.set(addr, cachedProfile);
            } else { // address not seen before so we need to look it up
                newLookupAddresses.add(addr);
            }
        }

        if (newLookupAddresses.size === 0) {
            return result;
        }

        // Find the remaining profile object IDs
        const newObjectIds = await this.#fetchProfileObjectIds({
            lookupAddresses: [...newLookupAddresses]
        });

        // Add missing addresses to the cache
        for (const addr of newLookupAddresses) {
            if (!newObjectIds.has(addr)) {
                result.set(addr, null);
                this.#cache.set(addr, null);
            }
        }

        if (newObjectIds.size === 0) return result;

        // Retrieve the remaining profile objects
        const profileObjects = await this.#fetchProfileObjects({
            objectIds: [...newObjectIds.values()]
        });

        // Add the remaining profile objects to the returned map and cache
        for (const profile of profileObjects) {
            result.set(profile.owner, profile);
            this.#cache.set(profile.owner, profile);
        }

        return result;
    }

    public async getProfile({ lookupAddress, useCache=true }: {
        lookupAddress: SuiAddress,
        useCache?: boolean,
    }): Promise<PolymediaProfile|null>
    {
        const lookupAddresses = [lookupAddress];
        const profiles = await this.getProfiles({lookupAddresses, useCache});
        return profiles.get(lookupAddress) || null;
    }

    public async hasProfile({ lookupAddress, useCache=true }: {
        lookupAddress: SuiAddress,
        useCache?: boolean,
    }): Promise<boolean>
    {
        const profile = await this.getProfile({lookupAddress, useCache});
        return profile !== null;
    }

    public createRegistry({ signAndExecuteTransaction, registryName }: {
        signAndExecuteTransaction: SignAndExecuteTransactionArg,
        registryName: string,
    }): Promise<OwnedObjectRef>
    {
        return sui_createRegistry({
            signAndExecuteTransaction,
            packageId: this.#packageId,
            registryName,
        });
    }

    public createProfile({ signAndExecuteTransaction, name, url='', description='' }: {
        signAndExecuteTransaction: SignAndExecuteTransactionArg,
        name: string,
        url?: string,
        description?: string,
    }): Promise<SuiAddress>
    {
        return sui_createProfile({
            signAndExecuteTransaction,
            packageId: this.#packageId,
            registryId: this.#registryId,
            name,
            url,
            description,
        });
    }

    async #fetchProfileObjectIds({ lookupAddresses }: {
        lookupAddresses: SuiAddress[]
    }): Promise<Map<SuiAddress,SuiAddress>>
    {
        const results = new Map<SuiAddress, SuiAddress>();
        const addressBatches = chunkArray(lookupAddresses, 50);
        console.debug(`[fetchProfileObjectIds] looking for ${lookupAddresses.length} addresses in ${addressBatches.length} batches`);
        const promises = addressBatches.map(async batch => {
            const lookupResults = await sui_fetchProfileObjectIds({
                rpc: this.#rpc,
                packageId: this.#packageId,
                registryId: this.#registryId,
                lookupAddresses: batch,
            });
            for (const result of lookupResults) {
                results.set('0x'+result.lookupAddr, '0x'+result.profileAddr);
            }
        });
        await Promise.all(promises);
        return results;
    }

    #fetchProfileObjects({ objectIds }: {
        objectIds: SuiAddress[]
    }): Promise<PolymediaProfile[]>
    {
        return sui_fetchProfileObjects({
            rpc: this.#rpc,
            objectIds,
        });
    }
}

type SignAndExecuteTransactionArg = (transaction: SignableTransaction) => Promise<any>;

/* Sui RPC calls and signed transactions */

/**
 * Generic function to fetch Sui objects
 */
function fetchObjects({ rpc, objectIds }: {
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
type TypeOfLookupResult = typeof LookupResult;

/**
 * Given one or more Sui addresses, find their associated profile object IDs.
 * Addresses that don't have a profile won't be included in the returned Map.
 */
function sui_fetchProfileObjectIds({
    rpc,
    packageId,
    registryId,
    lookupAddresses,
}: {
    rpc: JsonRpcProvider,
    packageId: SuiAddress,
    registryId: SuiAddress,
    lookupAddresses: SuiAddress[],
}): Promise<Array<TypeOfLookupResult>>
{
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
            const lookupResults: Array<TypeOfLookupResult> = bcs.de(valueType, valueData, 'hex');
            return lookupResults;
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

/**
 * Fetch one or more Sui objects and return them as PolymediaProfile instances
 */
function sui_fetchProfileObjects({ rpc, objectIds }: {
    rpc: JsonRpcProvider,
    objectIds: SuiAddress[],
}): Promise<PolymediaProfile[]>
{
    return fetchObjects({
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
                url: objData.fields.url,
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

function sui_createRegistry({
    signAndExecuteTransaction,
    packageId,
    registryName,
} : {
    signAndExecuteTransaction: SignAndExecuteTransactionArg,
    packageId: SuiAddress,
    registryName: string,
}): Promise<OwnedObjectRef>
{
    return signAndExecuteTransaction({
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

async function sui_createProfile({
    signAndExecuteTransaction,
    packageId,
    registryId,
    name,
    url = '',
    description = '',
} : {
    signAndExecuteTransaction: SignAndExecuteTransactionArg,
    packageId: SuiAddress,
    registryId: SuiAddress,
    name: string,
    url?: string,
    description?: string,
}): Promise<SuiAddress>
{
    // Creates 2 objects: the profile (owned by the caller) and a dynamic field (inside the registry's table)
    const resp = await signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'create_profile',
            typeArguments: [],
            arguments: [
                registryId,
                name,
                url,
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

/* Convenience functions */

function chunkArray<T>(elements: T[], chunkSize: number): T[][] {
    const result = [];
    for (let i = 0; i < elements.length; i += chunkSize) {
        result.push(elements.slice(i, i + chunkSize));
    }
    return result;
}
