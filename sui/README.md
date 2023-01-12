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
