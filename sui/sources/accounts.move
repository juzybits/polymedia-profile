module polymedia_accounts::accounts {

    use std::string::{Self, String};
    use std::vector;
    use sui::object::{Self, UID};
    use sui::object_table::{Self, ObjectTable};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Namespace has key, store {
        id: UID,
        name: String,
        image: String,
        description: String,
        accounts: ObjectTable<address, Account>,
    }

    struct Account has key, store {
        id: UID,
        name: String,
        image: String,
        description: String,
    }

    public entry fun create_namespace(
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let namespace = Namespace {
            id: object::new(ctx),
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
            accounts: object_table::new(ctx),
        };
        transfer::share_object(namespace);
    }

    public entry fun create_account(
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        namespace: &mut Namespace,
        ctx: &mut TxContext,
    ) {
        let account = Account {
            id: object::new(ctx),
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
        };
        let sender_addr = tx_context::sender(ctx);
        object_table::add(&mut namespace.accounts, sender_addr, account);
        // transfer::transfer(account, sender_addr);
    }

    public fun get_accounts(
        namespace: &Namespace,
        addresses: vector<address>,
    ): vector<address> {
        let accounts = vector::empty<address>();
        while (!vector::is_empty(&addresses)) {
            let address = vector::pop_back(&mut addresses);
            if ( object_table::contains(&namespace.accounts, address) ) {
                let account = object_table::borrow(&namespace.accounts, address);
                let account_id = object::id(account);
                let account_address = object::id_to_address(&account_id);
                vector::push_back(&mut accounts, account_address);
            };
        };
        return accounts
    }

}
