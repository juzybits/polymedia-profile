module polymedia_profile::profile
{
    use std::string::{Self, String};
    use std::vector;
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    struct Registry has key, store {
        id: UID,
        name: String,
        profiles: Table<address, address>,
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
            profiles: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun create_profile(
        registry: &mut Registry,
        name: vector<u8>,
        image: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let profile_uid = object::new(ctx);
        let profile_addr = object::uid_to_address(&profile_uid);
        let profile = Profile {
            id: profile_uid,
            name: string::utf8(name),
            image: string::utf8(image),
            description: string::utf8(description),
        };
        let sender_addr = tx_context::sender(ctx);
        table::add(&mut registry.profiles, sender_addr, profile_addr);
        transfer::transfer(profile, sender_addr);
    }

    public fun get_profiles(
        registry: &Registry,
        lookup_addresses: vector<address>,
    ): vector<address>
    {
        let not_found_addr = @0x0;
        let profile_addresses = vector::empty<address>();
        let length = vector::length(&lookup_addresses);
        let index = 0;
        while ( index < length ) {
            let lookup_addr = *vector::borrow(&lookup_addresses, index);
            if ( table::contains(&registry.profiles, lookup_addr) ) {
                let profile_addr = *table::borrow(&registry.profiles, lookup_addr);
                vector::push_back(&mut profile_addresses, profile_addr);
            } else {
                vector::push_back(&mut profile_addresses, not_found_addr);
            };
            index = index + 1
        };
        return profile_addresses
    }

}
