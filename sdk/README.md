# Polymedia Profile: TypeScript SDK

A library to interact with the _PolymediaProfile_ package on Sui.

For an overview of Polymedia Profile, see _[../README.md](../README.md)_.

For details about the Sui package, see _[../sui/README.md](../sui/README.md)_.

## Overview

This library exports only one type and one class:

- The `PolymediaProfile` type represents a `Profile` Sui object:
  ```
  export type PolymediaProfile = {
    id: SuiAddress;
    name: string;
    imageUrl: string;
    description: string;
    data: any;
    owner: SuiAddress;
    previousTx: string;
  }
  ```

- The `ProfileManager` class makes it easy to create and modify `Profile` and `Registry` Sui objects.

## How to use

### Instantiate `ProfileManager`
```
import { Connection, JsonRpcProvider } from '@mysten/sui.js';
import { PolymediaProfile, ProfileManager } from '@polymedia/profile-sdk';

const profileManager = new ProfileManager({
    network: 'testnet',
    rpcProvider: new JsonRpcProvider(new Connection({
        fullnode: 'https://fullnode.testnet.sui.io',
        faucet: 'https://faucet.testnet.sui.io/gas',
    })),
});
```
`ProfileManager` uses Polymedia's package and registry by default, but you can change that:
```
const profileManage = new ProfileManager({
    network: 'testnet',
    rpcProvider: new JsonRpcProvider(/*...*/)
    packageId: `0x_PACKAGE_ID`,
    registryId: `0x_REGISTRY_ID`,
});
```

### Find profiles

To search for `Profile` objects associated to Sui addreses, you can use the following methods.

- `ProfileManager.getProfile()` to get a single profile:
    ```
    profileManager.getProfile({
        lookupAddress: '0x_USER_ADDRESS',
    }).then((profile: PolymediaProfile|null) => {
        // A null result means lookupAddress does not have a Profile in this Registry
    }).catch(error => {
        // Handle RPC error
    });
  ```

- `ProfileManager.getProfiles()` to get multiple profiles:
    ```
    profileManager.getProfiles({
        lookupAddresses: ['0x_USER_ADDRESS_1', '0x_USER_ADDRESS_2'],
    }).then((profiles: Map<SuiAddress, PolymediaProfile|null>) => {
        // ...
    });
    ```

- `ProfileManager.hasProfile()` to check if an address has a profile associated to it:
    ```
    profileManager.hasProfile({
        lookupAddress: '0x_USER_ADDRESS',
    }).then((hasProfile: boolean) => {
        // ...
    });
    ```

`ProfileManager` keeps an internal cache to avoid wasteful RPC requests. You can skip the cache by passing the `useCache: false` argument to any of the three methods above.

### Create a profile

`ProfileManager.createProfile()` creates a new `Profile` (_owned_ Sui object), adds it to the `Registry` (_shared_ Sui object) that `ProfileManager` was instantiated with, and sends it to the address that signed the transaction.

##### Using `@mysten/wallet-kit`:

```
import { useWalletKit } from '@mysten/wallet-kit';
...
const { signAndExecuteTransactionBlock } = useWalletKit();
...
profileManager.createProfile({
    signAndExecuteTransactionBlock,
    name: 'John Doe',
    imageUrl: 'https://example.com/pfp.jpeg',
    description: 'Lorem ipsum',
    data: {'twitter': 'https://twitter.com/johndoe_1'},
}).then((profile: PolymediaProfile) => {
    // do something with the profile
}).catch(error => {
    // handle RPC error
});
```

##### Using `ethos-connect`:

```
import { ethos } from 'ethos-connect';
...
const { wallet } = ethos.useWallet();
...
profileManager.createProfile({
    signAndExecuteTransactionBlock: wallet.signAndExecuteTransactionBlock,
    ...
```

### Edit a profile
`ProfileManager.editProfile()` modifies an existing `Profile` object.

```
profileManager.editProfile({
    signAndExecuteTransactionBlock,
    profileId: '0x_PROFILE_ADDRESS',
    name: 'John Doe (updated)',
    imageUrl: 'https://example.com/pfp_updated.jpeg',
    description: 'Lorem ipsum (updated)',,
    data: {'twitter': 'https://twitter.com/johndoe_2'},
}).then(response => {
    // success
}).catch(error => {
    // handle RPC error
});
```

### Create a registry
`ProfileManager.createRegistry()` creates a new registry `Registry` (_shared_ Sui object) that you can use in your application instead of Polymedia's default registry.

```
profileManager.createRegistry({
    signAndExecuteTransactionBlock,
    registryName: 'The Registry Name',
}).then(objRef => {
    console.log('registry ID:', objRef.reference.objectId);
}).catch(error => {
    // handle RPC error
});
```

### Real-world examples

If this document is outdated, you can find up-to-date usage examples in the following Sui apps:

- Polymedia Profile - _[ManageProfile.tsx](https://github.com/juzybits/polymedia-profile/blob/main/web/src/js/ManageProfile.tsx)_ shows how to create and edit a profile.
- Got Beef? - _[View.tsx](https://github.com/juzybits/polymedia-gotbeef/blob/main/web/src/js/View.tsx)_ shows how to look up profiles associated to Sui addresses.
