import { DevInspectResults, SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";

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

export function edit_profile(
    tx: Transaction,
    profileId: string,
    packageId: string,
    name: string,
    imageUrl?: string,
    description?: string,
    data?: unknown,
): TransactionResult
{
    const dataJson = data ? JSON.stringify(data) : "";
    const moveArgs = [
        tx.object(profileId),
        tx.pure.string(name),
        tx.pure.string(imageUrl ?? ""),
        tx.pure.string(description ?? ""),
        tx.pure.string(dataJson),
    ];
    return tx.moveCall({
        target: `${packageId}::profile::edit_profile`,
        typeArguments: [],
        arguments: moveArgs,
    });
}
