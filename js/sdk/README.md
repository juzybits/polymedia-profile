# Polymedia Profile: TypeScript SDK

A library to interact with the _PolymediaProfile_ package on Sui.

For an overview of Polymedia Profile, see [../../README.md](../../README.md).

For details about the Sui package, see [../../move/profile/README.md](../../move/profile/README.md).

## Installation
```bash
pnpm i @polymedia/profile-sdk
```

## Overview

The `ProfileClient` class can be used to fetch profile data from the network.

The [./src/package.ts](./src/package.ts) functions can be used to build transactions.

The `PolymediaProfile` type represents a Profile Sui object:
```ts
export type PolymediaProfile = {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    data: unknown;
    owner: string;
};
```

## Instantiate `ProfileClient`

```ts
import { ProfileClient } from "@polymedia/profile-sdk";
import { useSignTransaction, useSuiClient } from "@mysten/dapp-kit";

const suiClient = useSuiClient();
const { mutateAsync: walletSignTx } = useSignTransaction();

const profileClient = new ProfileClient({
    profilePkgId: "0x...",
    registryId: "0x...",
    suiClient,
    signTx: (tx) => walletSignTx({ transaction: tx }),
    // waitForTxOptions: ... optional ...
    // txRespOptions: ... optional ...
});
```

## Find profiles

`ProfileClient` keeps an internal cache to avoid wasteful RPC requests. You can skip the cache by passing the `useCache: false` argument to any of the methods below.

Use `ProfileClient.getProfileByOwner()` to find the profile associated to a single address:
```ts
profileClient.getProfileByOwner(
    '0x_USER_ADDRESS'
).then((profile: PolymediaProfile|null) => {
    // A null result means lookupAddress does not have a Profile in this Registry
}).catch(error => {
    // Handle RPC error
});
```

Use `ProfileClient.getProfilesByOwner()` to find the profiles associated to multiple addresses:
```ts
profileClient.getProfilesByOwner(
    ['0x_USER_ADDRESS_1', '0x_USER_ADDRESS_2'],
).then((profiles: Map<string, PolymediaProfile|null>) => {
    // ...
});
```

Use `ProfileClient.getProfileById()` to get a single profile by its object ID:
```ts
profileClient.getProfileById(
    '0x_PROFILE_ID',
)
.then((profile: PolymediaProfile|null) => {
    // A null result means the object does not exist
})
.catch((error: any) => {
    // Handle RPC error
});
```

use `ProfileClient.getProfilesById()` to get multiple profiles by their object IDs:
```ts
profileClient.getProfilesById(
    ['0x_PROFILE_ID_1', '0x_PROFILE_ID_2'],
)
.then((profiles: Map<string, PolymediaProfile|null>) => {
    // ...
});
```

Use `ProfileClient.hasProfile()` to check if an address has a profile associated to it:
```ts
profileClient.hasProfile(
    '0x_USER_ADDRESS'
).then((hasProfile: boolean) => {
    // ...
});
```
