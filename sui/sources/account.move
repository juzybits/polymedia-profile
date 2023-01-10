module polymedia_accounts::account {

    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Account has key, store {
        id: UID,
        name: String,
        profile_image: String,
        description: String,
    }

    public entry fun create(
        name: vector<u8>,
        profile_image: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let account = Account {
            id: object::new(ctx),
            name: string::utf8(name),
            profile_image: string::utf8(profile_image),
            description: string::utf8(description),
        };
        transfer::transfer(account, tx_context::sender(ctx));
    }

}
