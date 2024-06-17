import { bcs, fromHEX, toHEX } from "@mysten/bcs";

export type NetworkName =  "mainnet" | "testnet" | "devnet" | "localnet";

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

const BcsAddressType = bcs.bytes(32).transform({
	input: (val: string) => fromHEX(val),
	output: (val) => toHEX(val),
});

export type LookupResults = typeof BcsLookupResults.$inferType;

export const BcsLookupResults = bcs.vector(
    bcs.struct("LookupResult", {
        lookup_addr: BcsAddressType,
        profile_addr: BcsAddressType,
    })
);
