# Polymedia Profile

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
sui client publish --gas-budget 30000
```

## How to use from the command line
#### Create a registry
```
sui client call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_registry --args 'polymedia-main'
```
#### Create a profile
```
sui client call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_profile --args REGISTRY_ID 'Mr Guy' 'pfp.jpg' "Follow me on Myspace"
```
