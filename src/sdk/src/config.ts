import { NetworkName } from "./types";

export type NetworkConfig = {
    packageId: string;
    registryId: string;
};

export const PROFILE_IDS: Record<NetworkName, NetworkConfig> = {
    mainnet: {
        packageId: "0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead",
        registryId: "0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac",
    },
    testnet: {
        packageId: "0xe6b9d38ab44c0055b6fda90183b73b7557900e3d7e2215130d152e7b5f5b6f65",
        registryId: "0xe1db46532bcc8ad2314c672aa890d91075565b592be3e7b315f883ae3e827f9c",
    },
    devnet: {
        packageId: "0x1eb08098bfcfe2e659525d8036833143246f779c55c6b38eec80b0edcb1a3388",
        registryId: "0x61bacafd53850607f09f4b4a040d8c16e83a45ed246aa96a2c977a1c6e15baa0",
    },
    localnet: {
        packageId: "0x6ced420f60b41fa73ccedde9057ac7d382506e007f9ddb59fcce9b314f35d696",
        registryId: "0xe082e8fbcc466d25561f045c343f2eae0634ccca6bd9db8cd26e4dd84e4eaaad",
    },
};
