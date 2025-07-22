# Polymedia Profile: Sui Move

A simple and flexible profile system on Sui.

For an overview of Polymedia Profile, see _[../../README.md](../../README.md)_.

For details about the TypeScript SDK, see _[../../js/sdk/README.md](../../js/sdk/README.md)_.

## Mainnet IDs

Package: [0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead](https://explorer.polymedia.app/object/0x57138e18b82cc8ea6e92c3d5737d6078b1304b655f59cf5ae9668cc44aad4ead)

Registry: [0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac](https://explorer.polymedia.app/object/0xd6eb0ca817dfe0763af9303a6bea89b88a524844d78e657dc25ed8ba3877deac)

## Testnet IDs

Package: [0xb33f86890ab0a1b1c980593e66f6f33a9909c2453c04994ba825c703569bebb2](https://explorer.polymedia.app/object/0xb33f86890ab0a1b1c980593e66f6f33a9909c2453c04994ba825c703569bebb2?network=testnet)

Registry: [0x20fd7037a01bdd549091c0c4ccf426c21762c3dbe331c5b6001800a58640cc77](https://explorer.polymedia.app/object/0x20fd7037a01bdd549091c0c4ccf426c21762c3dbe331c5b6001800a58640cc77?network=testnet)


## Basics

The package defines two _structs_:

- `Registry` objects are shared:
  ```
  struct Registry has key {
    id: UID,
    name: String,
    profiles: Table<address, address>,
  }
  ```
- `Profile` objects are owned:
  ```
  struct Profile has key {
      id: UID,
      name: String,
      image_url: String,
      description: String,
      data: String,
  }
  ```

Call `create_registry` and `create_profile` respectively to create new objects.

Call `edit_profile` to modify a `Profile` object fields (`name`/`url`/`description`/`data`).

In addition to its regular fields, a `Profile` can have any number of dynamic (object) fields. These can be added/removed with: `add_dynamic_field`, `remove_dynamic_field`, `add_dynamic_object_field`, `remove_dynamic_object_field`.

## Mechanics

A `Registry` has a field, `profiles: Table<address, address>`, that maps profile owners (keys) to profile objects (values).

A `Profile` is guaranteed to be included in at least one `Registry`. A `Profile` can be added to a registry with `add_to_registry`.

A Sui address can own multiple `Profile` objects, but it can only register one `Profile` per `Registry`.

`get_profiles` is used to look up `Profile` objects in a `Registry` for a list of potential owner addresses. On the client side, `devInspectTransaction` can be used to query a `Registry` (see the SDK's [README.md](../sdk/README.md)).

## How to use from the command line

#### Create a registry
```
sui client call --package PACKAGE_ID --gas-budget 10000000 --module profile --function create_registry --args 'polymedia-main'
```

#### Create a profile
```
sui client call --package PACKAGE_ID --gas-budget 10000000 --module profile --function create_profile --args REGISTRY_ID 'Mr Guy' 'pfp.jpg' "Follow me on Myspace"
```
