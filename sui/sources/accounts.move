module polymedia_accounts::accounts {

    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::object_table::{Self, ObjectTable};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Account has key, store {
        id: UID,
        name: String,
        image: String,
        description: String,
    }

    struct Namespace has key, store {
        id: UID,
        name: String,
        image: String,
        description: String,
        items: ObjectTable<address, Account>,
    }

    public entry fun create_account(
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        namespace: &mut Namespace,
        ctx: &mut TxContext
    ) {
        let account = Account {
            id: object::new(ctx),
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
        };
        let sender_addr = tx_context::sender(ctx);
        object_table::add(&mut namespace.items, sender_addr, account);
        // transfer::transfer(account, sender_addr);
    }

    public entry fun create_namespace(
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let namespace = Namespace {
            id: object::new(ctx),
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
            items: object_table::new(ctx),
        };
        transfer::share_object(namespace);
    }

}
