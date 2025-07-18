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
		packageId: "0xe6b9d38ab44c0055b6fda90183b73b7557900e3d7e2215130d152e7b5f5b6f65",
		registryId: "0xe1db46532bcc8ad2314c672aa890d91075565b592be3e7b315f883ae3e827f9c",
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
