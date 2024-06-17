/*
  ___  ___  _ __   ____  __ ___ ___ ___   _
 | _ \/ _ \| |\ \ / /  \/  | __|   \_ _| /_\
 |  _/ (_) | |_\ V /| |\/| | _|| |) | | / _ \
 |_|_ \___/|____|_| |_| _|_|___|___/___/_/ \_\
 | _ \ _ \/ _ \| __|_ _| |  | __|
 |  _/   / (_) | _| | || |__| _|
 |_| |_|_\\___/|_| |___|____|___| by @juzybits

*/

import { BCS, getSuiMoveConfig } from "@mysten/bcs";
import {
    DevInspectResults,
    OwnedObjectRef,
    SuiClient,
    SuiObjectResponse,
    SuiTransactionBlockResponse,
    TransactionEffects,
} from "@mysten/sui.js/client";
import {
    TransactionBlock,
} from "@mysten/sui.js/transactions";
import { WalletKitCore } from "@mysten/wallet-kit-core";

export const POLYMEDIA_PROFILE_PACKAGE_ID_LOCALNET = "0x6ced420f60b41fa73ccedde9057ac7d382506e007f9ddb59fcce9b314f35d696";
export const POLYMEDIA_PROFILE_REGISTRY_ID_LOCALNET = "0xe082e8fbcc466d25561f045c343f2eae0634ccca6bd9db8cd26e4dd84e4eaaad";

export const POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET = "0x1eb08098bfcfe2e659525d8036833143246f779c55c6b38eec80b0edcb1a3388";
export const POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET = "0x61bacafd53850607f09f4b4a040d8c16e83a45ed246aa96a2c977a1c6e15baa0";

export const POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET = "0xe6b9d38ab44c0055b6fda90183b73b7557900e3d7e2215130d152e7b5f5b6f65";
export const POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET = "0xe1db46532bcc8ad2314c672aa890d91075565b592be3e7b315f883ae3e827f9c";

export const POLYMEDIA_PROFILE_PACKAGE_ID_MAINNET = "0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead";
export const POLYMEDIA_PROFILE_REGISTRY_ID_MAINNET = "0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac";

/**
 * Represents a `polymedia_profile::profile::Profile` Sui object
 */
export type PolymediaProfile = {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    data: any;
    owner: string;
};

type NetworkName = "localnet" | "devnet" | "testnet" | "mainnet";

/**
 * Helps you interact with the `polymedia_profile` Sui package
 */
export class ProfileManager {
    private readonly cachedAddresses = new Map<string, PolymediaProfile|null>();
    private readonly cachedObjects = new Map<string, PolymediaProfile|null>();
    public readonly network: NetworkName;
    public readonly suiClient: SuiClient;
    public readonly packageId: string;
    public readonly registryId: string;

    constructor({ network, suiClient, packageId, registryId }: {
        network: NetworkName;
        suiClient: SuiClient;
        packageId?: string;
        registryId?: string;
    }) {
        this.network = network;
        this.suiClient = suiClient;
        if (network === "localnet") {
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_LOCALNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_LOCALNET;
        } else if (network === "devnet") {
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET;
        } else if (network === "testnet") {
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET;
        } else if (network === "mainnet") {
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_MAINNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_MAINNET;
        } else {
            throw new Error("Network not recognized: " + network);
        }
    }

    public async getProfilesByOwner({ lookupAddresses, useCache=true }: {
        lookupAddresses: Iterable<string>;
        useCache?: boolean;
    }): Promise<Map<string, PolymediaProfile|null>>
    {
        let result = new Map<string, PolymediaProfile|null>();
        const newLookupAddresses = new Set<string>(); // unseen addresses (i.e. not cached)

        // Check if addresses are already in cache and add them to the returned map
        for (const addr of lookupAddresses) {
            if (useCache && this.cachedAddresses.has(addr)) {
                const cachedProfile = this.cachedAddresses.get(addr) || null;
                result.set(addr, cachedProfile);
            } else { // address not seen before so we need to look it up
                newLookupAddresses.add(addr);
            }
        }

        if (newLookupAddresses.size > 0) {
            // Find the profile object IDs associated to `newLookupAddresses`.
            // Addresses that don't have a profile are not included in the returned array.
            const newObjectIds = await this.fetchProfileObjectIds({
                lookupAddresses: [...newLookupAddresses]
            });

            // Add addresses without a profile to the cache with a `null` value
            for (const addr of newLookupAddresses) {
                if (!newObjectIds.has(addr)) {
                    result.set(addr, null);
                    this.cachedAddresses.set(addr, null);
                }
            }

            if (newObjectIds.size > 0) {
                // Retrieve the remaining profile objects
                const profileObjects = await this.getProfilesById({
                    lookupObjectIds: [...newObjectIds.values()]
                });

                // Add the remaining profile objects to the returned map and cache
                for (const profile of profileObjects.values()) {
                    if (profile) { // nulls have already been added to the result and cache above
                        result.set(profile.owner, profile);
                        this.cachedAddresses.set(profile.owner, profile);
                    }
                }
            }

            // Sort the results in the same order as `lookupAddresses`
            const sortedResult = new Map<string, PolymediaProfile|null>();
            for (const addr of lookupAddresses) {
                sortedResult.set(addr, result.get(addr) || null);
            }
            result = sortedResult;
        }

        return result;
    }

    public async getProfileByOwner({ lookupAddress, useCache=true }: {
        lookupAddress: string;
        useCache?: boolean;
    }): Promise<PolymediaProfile|null>
    {
        const lookupAddresses = [lookupAddress];
        const profiles = await this.getProfilesByOwner({lookupAddresses, useCache});
        return profiles.get(lookupAddress) || null;
    }

    public async hasProfile({ lookupAddress, useCache=true }: {
        lookupAddress: string;
        useCache?: boolean;
    }): Promise<boolean>
    {
        const profile = await this.getProfileByOwner({lookupAddress, useCache});
        return profile !== null;
    }

    public async getProfilesById({ lookupObjectIds, useCache=true }: {
        lookupObjectIds: string[];
        useCache?: boolean;
    }): Promise<Map<string, PolymediaProfile|null>>
    {
        let result = new Map<string, PolymediaProfile|null>();
        const newLookupObjectIds = new Set<string>(); // unseen objects (i.e. not cached)

        // Check if objects are already in cache and add them to the returned map
        for (const objectId of lookupObjectIds) {
            if (useCache && this.cachedObjects.has(objectId)) {
                const cachedProfile = this.cachedObjects.get(objectId) || null;
                result.set(objectId, cachedProfile);
            } else { // object not seen before so we need to look it up
                newLookupObjectIds.add(objectId);
            }
        }

        if (newLookupObjectIds.size > 0) {
            // Add to the results the profile objects associated to `newLookupObjectIds`.
            // Profile objects that don't exist are not included in the returned array.
            const newProfiles = await sui_fetchProfileObjects({
                suiClient: this.suiClient,
                lookupObjectIds,
            });
            for (const profile of newProfiles) {
                result.set(profile.id, profile);
            }

            // Add to the results the object IDs without associated profile objects as `null`.
            for (const objectId of newLookupObjectIds) {
                if (!result.has(objectId)) {
                    result.set(objectId, null);
                }
            }

            // Sort results in the same order as `lookupObjectIds`.
            // Add results to cache (as `null` for object IDs without associated profile objects).
            const sortedResult = new Map<string, PolymediaProfile|null>();
            for (const objectId of lookupObjectIds) {
                const profile = result.get(objectId) || null;
                sortedResult.set(objectId, profile);
                this.cachedObjects.set(objectId, profile);
            }
            result = sortedResult;
        }

        return result;
    }

    /** @deprecated Use `getProfileObjectById` instead. */
    public async fetchProfileObject({ objectId }: {
        objectId: string;
    }): Promise<PolymediaProfile|null>
    {
        return this.getProfileObjectById({ objectId });
    }

    public async getProfileObjectById({ objectId }: {
        objectId: string;
    }): Promise<PolymediaProfile|null>
    {
        const profiles = await this.getProfilesById({
            lookupObjectIds: [ objectId ],
        });
        return profiles.get(objectId) || null;
    }

    public async createRegistry({
        signTransactionBlock,
        registryName
    }: {
        signTransactionBlock: WalletKitCore["signTransactionBlock"];
        registryName: string;
    }): Promise<OwnedObjectRef>
    {
        return await sui_createRegistry({
            network: this.network,
            suiClient: this.suiClient,
            signTransactionBlock,
            packageId: this.packageId,
            registryName,
        });
    }

    public async createProfile({
        signTransactionBlock,
        name,
        imageUrl="",
        description="",
        data=null,
    }: {
        signTransactionBlock: WalletKitCore["signTransactionBlock"];
        name: string;
        imageUrl?: string;
        description?: string;
        data?: any;
    }): Promise<PolymediaProfile>
    {
        return await sui_createProfile({
            network: this.network,
            suiClient: this.suiClient,
            signTransactionBlock,
            packageId: this.packageId,
            registryId: this.registryId,
            name,
            imageUrl,
            description,
            data,
        });
    }

    public async editProfile({
        signTransactionBlock,
        profileId,
        name,
        imageUrl="",
        description="",
        data=null,
    }: {
        signTransactionBlock: WalletKitCore["signTransactionBlock"];
        profileId: string;
        name: string;
        imageUrl?: string;
        description?: string;
        data?: any;
    }): Promise<SuiTransactionBlockResponse>
    {
        return await sui_editProfile({
            network: this.network,
            suiClient: this.suiClient,
            signTransactionBlock,
            profileId: profileId,
            packageId: this.packageId,
            name,
            imageUrl,
            description,
            data,
        });
    }

    /**
     * Given one or more Sui addresses, find their associated profile object IDs.
     * Addresses that don't have a profile won't be included in the returned array.
     */
    private async fetchProfileObjectIds({ lookupAddresses }: {
        lookupAddresses: string[];
    }): Promise<Map<string, string>>
    {
        const results = new Map<string, string>();
        const addressBatches = chunkArray(lookupAddresses, 30);
        const promises = addressBatches.map(async (batch) => {
            const lookupResults = await sui_fetchProfileObjectIds({
                suiClient: this.suiClient,
                packageId: this.packageId,
                registryId: this.registryId,
                lookupAddresses: batch,
            });
            for (const result of lookupResults) {
                results.set("0x"+result.lookupAddr, "0x"+result.profileAddr);
            }
        });
        await Promise.all(promises);
        return results;
    }
}

/* Sui RPC calls and signed transactions */

// Register a custom struct type for Sui 'Binary Canonical (de)Serialization'
const bcs = new BCS( getSuiMoveConfig() );
const LookupResult = {
    lookupAddr: BCS.ADDRESS,
    profileAddr: BCS.ADDRESS,
};
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_LOCALNET + "::profile::LookupResult", LookupResult);
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET + "::profile::LookupResult", LookupResult);
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET + "::profile::LookupResult", LookupResult);
bcs.registerStructType(POLYMEDIA_PROFILE_PACKAGE_ID_MAINNET + "::profile::LookupResult", LookupResult);
type TypeOfLookupResult = typeof LookupResult;

/**
 * Given one or more Sui addresses, find their associated profile object IDs.
 * Addresses that don't have a profile won't be included in the returned array.
 */
function sui_fetchProfileObjectIds({
    suiClient,
    packageId,
    registryId,
    lookupAddresses,
}: {
    suiClient: SuiClient;
    packageId: string;
    registryId: string;
    lookupAddresses: string[];
}): Promise<TypeOfLookupResult[]>
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

    return suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x7777777777777777777777777777777777777777777777777777777777777777",
    })
    .then((resp: DevInspectResults) => {
        if (resp.effects.status.status == "success") {
            // Deserialize the returned value into an array of LookupResult objects
            // @ts-ignore
            const returnValue: any[] = resp.results[0].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const lookupResults: TypeOfLookupResult[] = bcs.de(valueType, valueData, "hex");
            return lookupResults;
        } else {
            throw new Error(resp.effects.status.error);
        }
    });
}

/**
 * Fetch one or more Sui objects and return them as PolymediaProfile instances
 * Object IDs that don't exist or are not a Profile won't be included in the returned array.
 */
async function sui_fetchProfileObjects({ suiClient, lookupObjectIds }: {
    suiClient: SuiClient;
    lookupObjectIds: string[];
}): Promise<PolymediaProfile[]>
{
    const allProfiles = new Array<PolymediaProfile>();
    const objectIdBatches = chunkArray(lookupObjectIds, 50);
    const promises = objectIdBatches.map(async lookupObjectIds =>
    {
        const resps: SuiObjectResponse[] = await suiClient.multiGetObjects({
            ids: lookupObjectIds,
            options: {
                showContent: true,
                showOwner: true,
            },
        });

        const profiles: PolymediaProfile[] = [];
        for (const resp of resps) {
            const profile = suiObjectToProfile(resp);
            if (profile) {
                profiles.push(profile);
            }
        }
        allProfiles.push(...profiles);
    });
    await Promise.all(promises);
    return allProfiles;
}

async function sui_createRegistry({
    network,
    suiClient,
    signTransactionBlock,
    packageId,
    registryName,
} : {
    network: NetworkName;
    suiClient: SuiClient;
    signTransactionBlock: WalletKitCore["signTransactionBlock"];
    packageId: string;
    registryName: string;
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

    const signedTx = await signTransactionBlock({
        transactionBlock: tx,
        chain: `sui:${network}`,
    });
    return suiClient.executeTransactionBlock({
        transactionBlock: signedTx.transactionBlockBytes,
        signature: signedTx.signature,
        options: {
            showEffects: true,
        },
    })
    .then(resp => {
        const effects = resp.effects as TransactionEffects;
        if (effects.status.status === "success") {
            if (effects.created?.length === 1) {
                return effects.created[0] as OwnedObjectRef;
            } else { // Should never happen
                throw new Error("New registry object missing from response: " + JSON.stringify(resp));
            }
        } else {
            throw new Error(effects.status.error);
        }
    });
}

async function sui_createProfile({
    network,
    suiClient,
    signTransactionBlock,
    packageId,
    registryId,
    name,
    imageUrl = "",
    description = "",
    data = null,
} : {
    network: NetworkName;
    suiClient: SuiClient;
    signTransactionBlock: WalletKitCore["signTransactionBlock"];
    packageId: string;
    registryId: string;
    name: string;
    imageUrl?: string;
    description?: string;
    data?: any;
}): Promise<PolymediaProfile>
{
    const dataJson = data ? JSON.stringify(data) : "";
    const tx = new TransactionBlock();
    const moveArgs = [
        tx.object(registryId),
        tx.pure(Array.from( (new TextEncoder()).encode(name) )),
        tx.pure(Array.from( (new TextEncoder()).encode(imageUrl) )),
        tx.pure(Array.from( (new TextEncoder()).encode(description) )),
        tx.pure(Array.from( (new TextEncoder()).encode(dataJson) )),
    ];
    tx.moveCall({
        target: `${packageId}::profile::create_profile`,
        typeArguments: [],
        arguments: moveArgs,
    });

    // Creates 2 objects: the profile (owned by the caller) and a dynamic field (inside the registry's table)
    const signedTx = await signTransactionBlock({
        transactionBlock: tx,
        chain: `sui:${network}`,
    });
    const resp = await suiClient.executeTransactionBlock({
        transactionBlock: signedTx.transactionBlockBytes,
        signature: signedTx.signature,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });

    // Verify the transaction results
    const effects = resp.effects as TransactionEffects;
    if (effects.status.status !== "success") {
        throw new Error(effects.status.error);
    }
    // Build and return PolymediaProfile object from the 'EventCreateProfile' event
    if (resp.events)
        for (const event of resp.events) {
            if (event.type.endsWith("::profile::EventCreateProfile")) {
                const newProfile: PolymediaProfile = {
                    id: (event.parsedJson as any).profile_id,
                    name: name,
                    imageUrl: imageUrl,
                    description: description,
                    data: data,
                    owner: event.sender,
                };
                return newProfile;
            }
    }
    // Should never happen:
    throw new Error("Transaction was successful, but can't find the new profile object ID in the response: " + JSON.stringify(resp));
}

async function sui_editProfile({
    network,
    suiClient,
    signTransactionBlock,
    profileId,
    packageId,
    name,
    imageUrl = "",
    description = "",
    data = null,
} : {
    network: NetworkName;
    suiClient: SuiClient;
    signTransactionBlock: WalletKitCore["signTransactionBlock"];
    profileId: string;
    packageId: string;
    name: string;
    imageUrl?: string;
    description?: string;
    data?: any;
}): Promise<SuiTransactionBlockResponse>
{
    const dataJson = data ? JSON.stringify(data) : "";
    const tx = new TransactionBlock();
    const moveArgs = [
        tx.object(profileId),
        tx.pure(Array.from( (new TextEncoder()).encode(name) )),
        tx.pure(Array.from( (new TextEncoder()).encode(imageUrl) )),
        tx.pure(Array.from( (new TextEncoder()).encode(description) )),
        tx.pure(Array.from( (new TextEncoder()).encode(dataJson) )),
    ];
    tx.moveCall({
        target: `${packageId}::profile::edit_profile`,
        typeArguments: [],
        arguments: moveArgs,
    });

    const signedTx = await signTransactionBlock({
        transactionBlock: tx,
        chain: `sui:${network}`,
    });
    const resp = await suiClient.executeTransactionBlock({
        transactionBlock: signedTx.transactionBlockBytes,
        signature: signedTx.signature,
        options: {
            showEffects: true,
        },
    });

    // Verify the transaction results
    const effects = resp.effects as TransactionEffects;
    if (effects.status.status !== "success") {
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

/**
 * Convert a generic `SuiObjectResponse` into a `PolymediaProfile`.
 *
 * Note: when fetching `SuiObjectResponse`, call SuiClient.getObject/multiGetObjects with:
    options: {
        showContent: true,
        showOwner: true,
    },
*/
function suiObjectToProfile(resp: SuiObjectResponse): PolymediaProfile|null
{
    if (resp.error || !resp.data) {
        return null;
    }

    const content = resp.data.content;
    if (!content) {
        throw new Error("Missing object content. Make sure to fetch the object with `showContent: true`");
    }
    if (content.dataType !== "moveObject") {
        throw new Error(`Wrong object dataType. Expected 'moveObject' but got: '${content.dataType}'`);
    }
    if (!content.type.endsWith("::profile::Profile")) {
        throw new Error("Wrong object type. Expected a Profile but got: " + content.type);
    }

    const owner = resp.data.owner;
    if (!owner) {
        throw new Error("Missing object owner. Make sure to fetch the object with `showOwner: true`");
    }
    const isOwnedObject = typeof owner === "object" && (("AddressOwner" in owner) || ("ObjectOwner" in owner));
    if (!isOwnedObject) {
        throw new Error("Expected an owned object");
    }

    const fields = content.fields as Record<string, any>;
    return {
        id: fields.id.id,
        name: fields.name,
        imageUrl: fields.image_url,
        description: fields.description,
        data: fields.data ? JSON.parse(fields.data) : null,
        owner: ("AddressOwner" in owner) ? owner.AddressOwner : owner.ObjectOwner,
    };
}
