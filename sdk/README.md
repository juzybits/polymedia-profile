# Polymedia Profile: TypeScript SDK

A library to interact with the _PolymediaProfile_ package on Sui.

For an overview of Polymedia Profile, see _[../README.md](../README.md)_.

For details about the Sui package, see _[../sui/README.md](../sui/README.md)_.

## Overview

This library exports one type and one class:

- The `PolymediaProfile` type represents a `Profile` Sui object:
  ```
  export type PolymediaProfile = {
    id: SuiAddress,
    name: string,
    imageUrl: string,
    description: string,
    owner: SuiAddress,
    previousTx: string,
    suiObject: SuiMoveObject,
  }
  ```

- The `ProfileManager` class makes it easy to create and modify `Profile` and `Registry` Sui objects.

## Using `ProfileManager`

### Instantiate
```
const profileManage = new ProfileManager({network: 'devnet'});
```
The previous example uses Polymedia's default package and registry, but you can override that:
```
const profileManage = new ProfileManager({
  network: 'devnet',
  packageId: `0x YOUR PACKAGE`,
  registryId: `0x YOUR REGISTRY`,
});
```

### Find profiles

To search for `Profile` objects associated to Sui addreses, you can call `getProfiles`, `getProfile`, or `hasProfile`. For example:
```
const result = await profileManager.getProfile({
  lookupAddress: '0x SOME ADDRESS',
  useCache: false, // `true` by default
})
.then((result: PolymediaProfile|null) => {
  // A null result means lookupAddress does not have a Profile in this Registry
})
.catch((error: any) => {
  // Handle Sui error
});
```

`ProfileManager` keeps an internal cache to avoid wasteful RPC requests. You can bypass the cache with the `useCache: false` argument.

### Create a profile

Call `createProfile` to make a new `Profile` object, add it in the `Registry` that `ProfileManager` was instantiated with, and send it to the address that signed the transaction.

```
import { useWalletKit } from '@mysten/wallet-kit';
...
const { signAndExecuteTransaction } = useWalletKit();
...
const profileObjectId = await profileManager.createProfile({
  signAndExecuteTransaction,
  name: 'John Doe',
  imageUrl: 'https://example.com/profile.png',
  description: 'My name is John and I love Sui',
});
```

### Edit a profile
Similarly, you can call `editProfile` to modify an existing `Profile` object.
```
const profileObjectId = await profileManager.editProfile({
  signAndExecuteTransaction,
  profile: profile, // the PolymediaProfile to be changed
  name: 'New username',
  imageUrl: 'https://example.com/new_profile.png',
  description: 'New description',
});
```

### Create a registry
If you want to use your own registry  instead of Polymedia's, call `createRegistry` to make a new `Registry` object.
```
const registryObjectRef = await profileManager.createRegistry({
  signAndExecuteTransaction,
  registryName: 'My personal registry',
});
```

### Full example

See the code for the Polymedia Profile webapp: _[ManageProfile.tsx](../web/src/js/ManageProfile.tsx)_.
