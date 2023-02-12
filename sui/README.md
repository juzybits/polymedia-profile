# Polymedia Accounts

## Development setup
1. [Install Sui](https://docs.sui.io/build/install#install-sui-binaries)
```
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```
2. Connect to devnet:
```
sui client switch --env devnet
```

## Publish the package
```
sui client publish --verify-dependencies --gas-budget 30000
```

## How to use from `sui console`
#### Create a registry
```
call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_registry --args 'polymedia-main'
```
#### Create a profile
```
call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_profile --args REGISTRY_ID 'Mr Guy' 'pfp.jpg' "Follow me on Myspace"
```
