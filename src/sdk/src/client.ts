import { SuiClient, SuiExecutionResult, SuiObjectResponse, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PROFILE_IDS } from "./config.js";
import { chunkArray, devInspectAndGetResults } from "./functions.js";
import * as pkg from "./package.js";
import { BcsLookupResults, LookupResults, PolymediaProfile } from "./types.js";

type NetworkName = "localnet" | "devnet" | "testnet" | "mainnet";

/**
 * Helps you interact with the `polymedia_profile` Sui package
 */
export class ProfileClient
{
    protected readonly cachedAddresses = new Map<string, PolymediaProfile|null>();
    protected readonly cachedObjects = new Map<string, PolymediaProfile|null>();
    public readonly network: NetworkName;
    public readonly suiClient: SuiClient;
    public readonly packageId: string;
    public readonly registryId: string;

    constructor(
        network: NetworkName,
        suiClient: SuiClient,
        packageId?: string,
        registryId?: string,
    ) {
        this.network = network;
        this.suiClient = suiClient;
        this.packageId = packageId || PROFILE_IDS[network].packageId;
        this.registryId = registryId || PROFILE_IDS[network].registryId;
    }

    public async editProfile(
        signTransaction: any, // TODO
        profileId: string,
        name: string,
        imageUrl?: string,
        description?: string,
        data?: unknown,
    ): Promise<SuiTransactionBlockResponse>
    {
        const tx = new Transaction();
        pkg.edit_profile(
            tx,
            profileId,
            this.packageId,
            name,
            imageUrl,
            description,
            data,
        );

        const signedTx = await signTransaction({
            transactionBlock: tx,
            chain: `sui:${this.network}`,
        });
        const resp = await this.suiClient.executeTransactionBlock({
            transactionBlock: signedTx.transactionBlockBytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
            },
        });

        // Verify the transaction results
        const effects = resp.effects!;
        if (effects.status.status !== "success") {
            throw new Error(effects.status.error);
        }
        return resp;
    }

    public async getProfileByOwner(
        lookupAddress: string,
        useCache?: boolean,
    ): Promise<PolymediaProfile|null>
    {
        const lookupAddresses = [lookupAddress];
        const profiles = await this.getProfilesByOwner(lookupAddresses, useCache);
        return profiles.get(lookupAddress) || null;
    }

    public async getProfilesByOwner(
        lookupAddresses: Iterable<string>,
        useCache?: boolean,
    ): Promise<Map<string, PolymediaProfile|null>>
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
            const newObjectIds = await this.fetchProfileObjectIds([...newLookupAddresses]);

            // Add addresses without a profile to the cache with a `null` value
            for (const addr of newLookupAddresses) {
                if (!newObjectIds.has(addr)) {
                    result.set(addr, null);
                    this.cachedAddresses.set(addr, null);
                }
            }

            if (newObjectIds.size > 0) {
                // Retrieve the remaining profile objects
                const profileObjects = await this.getProfilesById([...newObjectIds.values()]);

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

    public async getProfileById(
        objectId: string,
    ): Promise<PolymediaProfile|null>
    {
        const profiles = await this.getProfilesById([ objectId ]);
        return profiles.get(objectId) || null;
    }

    public async getProfilesById(
        lookupObjectIds: string[],
        useCache?: boolean,
    ): Promise<Map<string, PolymediaProfile|null>>
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
            const newProfiles = await this.fetchProfileObjects( this.suiClient, lookupObjectIds );
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

    public async hasProfile(
        lookupAddress: string,
        useCache?: boolean,
    ): Promise<boolean>
    {
        const profile = await this.getProfileByOwner(lookupAddress, useCache);
        return profile !== null;
    }

    /**
     * Given one or more Sui addresses, find their associated profile object IDs.
     * Addresses that don't have a profile won't be included in the returned array.
     */
    protected async fetchProfileObjectIds(
        lookupAddresses: string[],
    ): Promise<Map<string, string>>
    {
        const deserializeResults = (
            blockResults: SuiExecutionResult[],
        ): LookupResults =>
        {
            const txResults = blockResults[0];
            const value = txResults.returnValues![0];
            const valueData = Uint8Array.from(value[0]);
            const valueDeserialized = BcsLookupResults.parse(valueData);
            return valueDeserialized;
        };

        const results = new Map<string, string>();
        const addressBatches = chunkArray(lookupAddresses, 30);
        const promises = addressBatches.map(async (batch) =>
        {
            const tx = new Transaction();
            pkg.get_profiles(tx, this.packageId, this.registryId, batch);
            const blockResults = await devInspectAndGetResults(this.suiClient, tx);

            const valueDeserialized = deserializeResults(blockResults);
            for (const result of valueDeserialized) {
                results.set("0x"+result.lookup_addr, "0x"+result.profile_addr);
            }
        });
        await Promise.all(promises);
        return results;
    }
    /**
     * Fetch one or more Sui objects and return them as PolymediaProfile instances
     * Object IDs that don't exist or are not a Profile won't be included in the returned array.
     */
    protected async fetchProfileObjects(
        suiClient: SuiClient,
        lookupObjectIds: string[],
    ): Promise<PolymediaProfile[]>
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
function suiObjectToProfile(
    resp: SuiObjectResponse,
): PolymediaProfile|null
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
