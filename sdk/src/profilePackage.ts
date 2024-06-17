import {
    DevInspectResults,
    SuiClient,
    SuiObjectResponse,
    SuiTransactionBlockResponse,
    TransactionEffects,
} from "@mysten/sui/client";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { NetworkName, PolymediaProfile } from "./types";

/*
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
*/

/**
 * Given one or more Sui addresses, find their associated profile object IDs.
 * Addresses that don't have a profile won't be included in the returned array.
 */
export function sui_fetchProfileObjectIds({
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
    const tx = new Transaction();
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
export async function sui_fetchProfileObjects({ suiClient, lookupObjectIds }: {
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

export function create_registry(
    tx: Transaction,
    packageId: string,
    registryName: string,
): TransactionResult
{
    return tx.moveCall({
        target: `${packageId}::profile::create_registry`,
        typeArguments: [],
        arguments: [
            tx.pure.string(registryName),
        ],
    });
}

export function create_profile(
    tx: Transaction,
    packageId: string,
    registryId: string,
    name: string,
    imageUrl?: string,
    description?: string,
    data?: unknown,
): TransactionResult
{
    const dataJson = data ? JSON.stringify(data) : "";
    const moveArgs = [
        tx.object(registryId),
        tx.pure.string(name),
        tx.pure.string(imageUrl ?? ""),
        tx.pure.string(description ?? ""),
        tx.pure.string(dataJson),
    ];
    return tx.moveCall({
        target: `${packageId}::profile::create_profile`,
        typeArguments: [],
        arguments: moveArgs,
    });
}

export async function sui_editProfile({
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
    const tx = new Transaction();
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

/**
 * Convert a generic `SuiObjectResponse` into a `PolymediaProfile`.
 *
 * Note: when fetching `SuiObjectResponse`, call SuiClient.getObject/multiGetObjects with:
    options: {
        showContent: true,
        showOwner: true,
    },
*/
export function suiObjectToProfile(resp: SuiObjectResponse): PolymediaProfile|null
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
