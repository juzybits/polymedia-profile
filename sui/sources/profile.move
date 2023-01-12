module polymedia_profile::profile {

    use std::string::{Self, String};
    use std::vector;
    use sui::object::{Self, UID};
    use sui::object_table::{Self, ObjectTable};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Registry has key, store {
        id: UID,
        name: String,
        profiles: ObjectTable<address, Profile>,
    }

    struct Profile has key, store {
        id: UID,
        name: String,
        image: String,
        description: String,
    }

    public entry fun create_registry(
        name: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let registry = Registry {
            id: object::new(ctx),
            name: string::utf8(name),
            profiles: object_table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun create_profile(
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        registry: &mut Registry,
        ctx: &mut TxContext,
    ) {
        let profile = Profile {
            id: object::new(ctx),
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
        };
        let sender_addr = tx_context::sender(ctx);
        object_table::add(&mut registry.profiles, sender_addr, profile);
        // transfer::transfer(profile, sender_addr);
    }

    public fun get_profiles(
        registry: &Registry,
        addresses: vector<address>,
    ): vector<address> {
        let profiles = vector::empty<address>();
        while (!vector::is_empty(&addresses)) {
            let address = vector::pop_back(&mut addresses);
            if ( object_table::contains(&registry.profiles, address) ) {
                let profile = object_table::borrow(&registry.profiles, address);
                let profile_id = object::id(profile);
                let profile_address = object::id_to_address(&profile_id);
                vector::push_back(&mut profiles, profile_address);
            };
        };
        return profiles
    }

}
