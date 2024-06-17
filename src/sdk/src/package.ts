/// Functions that map 1:1 to the Sui package.
/// Can be used to build transactions.

import { bcs } from "@mysten/sui/bcs";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";

export function get_profiles(
    tx: Transaction,
    packageId: string,
    registryId: string,
    lookupAddresses: string[],
): TransactionResult
{
    return tx.moveCall({
        target: `${packageId}::profile::get_profiles`,
        typeArguments: [],
        arguments: [
            tx.object(registryId),
            tx.pure(bcs.vector(bcs.Address).serialize(lookupAddresses)),
        ],
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
