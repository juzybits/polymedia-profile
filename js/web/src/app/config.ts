import type { NetworkName } from "@polymedia/suitcase-core";

export type NetworkConfig = {
	packageId: string;
	registryId: string;
};

export const networkIds: Record<NetworkName, NetworkConfig> = {
	mainnet: {
		packageId: "0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead",
		registryId: "0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac",
	},
	testnet: {
		packageId: "0xb33f86890ab0a1b1c980593e66f6f33a9909c2453c04994ba825c703569bebb2",
		registryId: "0x20fd7037a01bdd549091c0c4ccf426c21762c3dbe331c5b6001800a58640cc77",
	},
	devnet: {
		packageId: "0x0c4508d015ebdc6f87ab7a30fd43aa8f3fd9d7856ffff087e5660ce7fe9cb010",
		registryId: "0x30f80990376a949514df1925bbb3e8e403054a8592fd2be19c4576e631603c55",
	},
	localnet: {
		packageId: "",
		registryId: "",
	},
};
