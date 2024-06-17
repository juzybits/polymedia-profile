import { OwnedObjectRef, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PROFILE_IDS } from "./config";
import { chunkArray } from "./functions.js";
import * as pkg from "./profilePackage.js";
import { PolymediaProfile } from "./types.js";

type NetworkName = "localnet" | "devnet" | "testnet" | "mainnet";

/**
 * Helps you interact with the `polymedia_profile` Sui package
 */
export class ProfileClient {
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
        this.packageId = packageId || PROFILE_IDS[network].packageId;
        this.registryId = registryId || PROFILE_IDS[network].registryId;
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
            const newProfiles = await pkg.sui_fetchProfileObjects({
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
        const tx = new Transaction();
        pkg.create_registry(tx, this.packageId, registryName);

        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
            chain: `sui:${this.network}`,
        });

        return this.suiClient.executeTransactionBlock({
            transactionBlock: signedTx.transactionBlockBytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
            },
        })
        .then(resp => {
            const effects = resp.effects!;
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
        return await pkg.sui_createProfile({
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
        return await pkg.sui_editProfile({
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
            const lookupResults = await pkg.sui_fetchProfileObjectIds({
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
