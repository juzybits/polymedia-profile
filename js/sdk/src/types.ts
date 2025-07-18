import { bcs, fromHex, toHex } from "@mysten/bcs";

/**
 * Represents a `polymedia_profile::profile::Profile` Sui object
 */
export type PolymediaProfile = {
	id: string;
	name: string;
	imageUrl: string;
	description: string;
	data: unknown;
	owner: string;
};

const BcsAddressType = bcs.bytes(32).transform({
	input: (val: string) => fromHex(val),
	output: (val) => toHex(val),
});

export type LookupResults = typeof BcsLookupResults.$inferType;

export const BcsLookupResults = bcs.vector(
	bcs.struct("LookupResult", {
		lookup_addr: BcsAddressType,
		profile_addr: BcsAddressType,
	}),
);
