/*
   _____   ____  _  __     ____  __ ______ _____ _____    __
  |  __ \ / __ \| | \ \   / /  \/  |  ____|  __ \_   _|  /  \
  | |__) | |  | | |  \ \_/ /| \  / | |__  | |  | || |   /    \
  |  ___/| |  | | |   \   / | |\/| |  __| | |  | || |  /  /\  \
  | |    | |__| | |____| |  | |  | | |____| |__| || |_/  ____  \
  |_|___  \____/|______|_|__|_|__|_|______|_____/_______/    \__\
  |  __ \|  __ \ / __ \|  ____|_   _| |    |  ____|
  | |__) | |__) | |  | | |__    | | | |    | |__
  |  ___/|  _  /| |  | |  __|   | | | |    |  __|
  | |    | | \ \| |__| | |     _| |_| |____| |____
  |_|    |_|  \_\\____/|_|    |_____|______|______|  by @juzybits

*/

import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import {
    Connection,
    DevInspectResults,
    JsonRpcProvider,
    ObjectOwner,
    OwnedObjectRef,
    SuiAddress,
    SuiMoveObject,
    SuiObjectResponse,
    SuiTransactionBlockResponse,
    TransactionBlock,
    TransactionEffects,
} from '@mysten/sui.js';

import { SuiSignAndExecuteTransactionBlockMethod } from '@mysten/wallet-standard';

export const POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET = '0x4f1adf75e641d6acf54af5493c13fdd1a4b84a65bd4e3676ab90c2b45470ce22';
export const POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET = '0x153e5042c6556c98dbc22d14375efbe5e937eb2a0618d513a0682a5f3f99d6e9';

export const POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET = '0x123'; // TODO
export const POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET = '0x123'; // TODO

const RPC_DEVNET = new JsonRpcProvider(new Connection({
    fullnode: 'https://node.shinami.com/api/v1/ad388d02ad86069fa8b32278b73709e9',
    // fullnode: 'https://fullnode.devnet.sui.io:443',
    faucet: 'https://faucet.devnet.sui.io/gas',
}));

const RPC_TESTNET = new JsonRpcProvider(new Connection({
    // fullnode: '...',
    fullnode: 'https://fullnode.testnet.sui.io:443/',
    faucet: 'https://faucet.testnet.sui.io/gas',
}));

/**
 * Represents a `polymedia_profile::profile::Profile` Sui object
 */
export type PolymediaProfile = {
    id: SuiAddress,
    name: string,
    url: string, // image URL
    description: string,
    owner: SuiAddress,
    previousTx: string,
    suiObject: SuiMoveObject,
}

/**
 * Helps you interact with the `polymedia_profile` Sui package
 */
export class ProfileManager {
    #cache: Map<SuiAddress, PolymediaProfile|null> = new Map();
    #rpc: JsonRpcProvider;
    #packageId: SuiAddress;
    #registryId: SuiAddress;

    constructor({ network, packageId, registryId }: {
        network: string,
        packageId?: SuiAddress,
        registryId?: SuiAddress
    }) {
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

    public createRegistry({ signAndExecuteTransactionBlock, registryName }: {
        signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
        registryName: string,
    }): Promise<OwnedObjectRef>
    {
        return sui_createRegistry({
            signAndExecuteTransactionBlock,
            packageId: this.#packageId,
            registryName,
        });
    }

    public createProfile({ signAndExecuteTransactionBlock, name, url='', description='' }: {
        signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
        name: string,
        url?: string,
        description?: string,
    }): Promise<SuiAddress>
    {
        return sui_createProfile({
            signAndExecuteTransactionBlock,
            packageId: this.#packageId,
            registryId: this.#registryId,
            name,
            url,
            description,
        });
    }

    public editProfile({ signAndExecuteTransactionBlock, profile, name, url='', description='' }: {
        signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
        profile: PolymediaProfile,
        name: string,
        url?: string,
        description?: string,
    }): Promise<SuiTransactionBlockResponse>
    {
        return sui_editProfile({
            signAndExecuteTransactionBlock,
            profileId: profile.id,
            packageId: this.#packageId,
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

/* Sui RPC calls and signed transactions */

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
    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${packageId}::profile::get_profiles`,
        typeArguments: [],
        arguments: [
            tx.object(registryId),
            tx.pure(lookupAddresses),
        ],
    });

    return rpc.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x7777777777777777777777777777777777777777777777777777777777777777',
    })
    .then((resp: DevInspectResults) => {
        if (resp.effects.status.status == 'success') {
            // Deserialize the returned value into an array of LookupResult objects
            // @ts-ignore
            const returnValue: any[] = resp.results[0].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const lookupResults: Array<TypeOfLookupResult> = bcs.de(valueType, valueData, 'hex');
            return lookupResults;
        } else {
            throw new Error(resp.effects.status.error);
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
    return rpc.multiGetObjects({
        ids: objectIds,
        options: {
            showContent: true,
            showOwner: true,
            showPreviousTransaction: true,
        },
    })
    .then((resps: SuiObjectResponse[]) => {
        const profiles: PolymediaProfile[] = [];
        for (const resp of resps) {
            if (resp.error || !resp.data)
                continue;
            const objData = resp.data.content as SuiMoveObject;
            const objOwner = resp.data.owner as ObjectOwner;
            profiles.push({
                id: objData.fields.id.id,
                name: objData.fields.name,
                url: objData.fields.url,
                description: objData.fields.description,
                // @ts-ignore
                owner: objOwner.AddressOwner,
                previousTx: resp.data.previousTransaction||'',
                suiObject: objData,
            });
        }
        return profiles;
    })
    .catch((error: any) => {
        throw error;
    });
}

function sui_createRegistry({
    signAndExecuteTransactionBlock,
    packageId,
    registryName,
} : {
    signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
    packageId: SuiAddress,
    registryName: string,
}): Promise<OwnedObjectRef>
{
    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${packageId}::profile::create_registry`,
        typeArguments: [],
        arguments: [
            tx.pure(Array.from( (new TextEncoder()).encode(registryName) )),
        ],
    });

    // @ts-ignore
    return signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
            showEffects: true,
        },
    })
    .then(resp => {
        // @ts-ignore
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status === 'success') {
            if (effects.created?.length === 1) { // TODO: test
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
    signAndExecuteTransactionBlock,
    packageId,
    registryId,
    name,
    url = '',
    description = '',
} : {
    signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
    packageId: SuiAddress,
    registryId: SuiAddress,
    name: string,
    url?: string,
    description?: string,
}): Promise<SuiAddress>
{
    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${packageId}::profile::create_profile`,
        typeArguments: [],
        arguments: [
            tx.object(registryId),
            tx.pure(Array.from( (new TextEncoder()).encode(name) )),
            tx.pure(Array.from( (new TextEncoder()).encode(url) )),
            tx.pure(Array.from( (new TextEncoder()).encode(description) )),
        ],
    });

    // @ts-ignore
    // Creates 2 objects: the profile (owned by the caller) and a dynamic field (inside the registry's table)
    const resp = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });

    // @ts-ignore
    // Verify the transaction results
    //                  Sui/Ethos || Suiet
    const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
    if (effects.status.status !== 'success') {
        throw new Error(effects.status.error);
    }
    // Extract the new profile object ID from the 'EventCreateProfile' event
    if (resp.events)
        for (const event of resp.events) {
            if (event.type.endsWith('::profile::EventCreateProfile'))
                return event.parsedJson?.profile_id;
    }
    // Should never happen:
    throw new Error("Transaction was successful, but can't find the new profile object ID in the response: " + JSON.stringify(resp));
}

async function sui_editProfile({
    signAndExecuteTransactionBlock,
    profileId,
    packageId,
    name,
    url = '',
    description = '',
} : {
    signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod,
    profileId: SuiAddress,
    packageId: SuiAddress,
    name: string,
    url?: string,
    description?: string,
}): Promise<SuiTransactionBlockResponse>
{
    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${packageId}::profile::edit_profile`,
        typeArguments: [],
        arguments: [
            tx.object(profileId),
            tx.pure(Array.from( (new TextEncoder()).encode(name) )),
            tx.pure(Array.from( (new TextEncoder()).encode(url) )),
            tx.pure(Array.from( (new TextEncoder()).encode(description) )),
        ],
    });

    // @ts-ignore
    const resp = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
            showEffects: true,
        },
    });

    // @ts-ignore
    // Verify the transaction results
    //                  Sui/Ethos || Suiet
    const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
    if (effects.status.status !== 'success') {
        throw new Error(effects.status.error);
    }
    return resp;
}

/* Convenience functions */

function chunkArray<T>(elements: T[], chunkSize: number): T[][] {
    const result = [];
    for (let i = 0; i < elements.length; i += chunkSize) {
        result.push(elements.slice(i, i + chunkSize));
    }
    return result;
}
