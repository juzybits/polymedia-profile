import type { NetworkName } from "@polymedia/suitcase-core";

export type NetworkConfig = {
	packageId: string;
	registryId: string;
};

export const NETWORK_IDS: Record<NetworkName, NetworkConfig> = {
	mainnet: {
		packageId: "0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead",
		registryId: "0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac",
	},
	testnet: {
		packageId: "0xe6b9d38ab44c0055b6fda90183b73b7557900e3d7e2215130d152e7b5f5b6f65",
		registryId: "0xe1db46532bcc8ad2314c672aa890d91075565b592be3e7b315f883ae3e827f9c",
	},
	devnet: {
		packageId: "0x4dd1b38df8d928ffe981e071688297d9501c182e5ac5195042d2547eaa09a0dd",
		registryId: "0xb0220f5db4d58f0b66546fc6c3a9c2e8b832f7b28b3fe1513f287f8979833a6a",
	},
	localnet: {
		packageId: "0xeab0ae42feff4b74d6aa6d254fedc7dc205a1d2d7e08d1587ff15784bde41cbf",
		registryId: "0x1d073c01f21ecb392e20729f6627ada65acc61e1e1063db509217881686fab34",
	},
};
