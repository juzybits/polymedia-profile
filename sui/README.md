# Polymedia Profile: Sui code

## How to use from the command line
#### Create a registry
```
sui client call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_registry --args 'polymedia-main'
```
#### Create a profile
```
sui client call --package PACKAGE_ID --gas-budget 1000 --module profile --function create_profile --args REGISTRY_ID 'Mr Guy' 'pfp.jpg' "Follow me on Myspace"
```
