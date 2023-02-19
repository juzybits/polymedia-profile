module polymedia_profile::profile
{
    use std::string::{Self, String};
    use std::vector;
    use sui::dynamic_field;
    use sui::dynamic_object_field;
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /* Errors */

    const E_CANT_REMOVE_LAST_REGISTRY: u64 = 100;

    /* Structs */

    struct Registry has key {
        id: UID,
        name: String,
        profiles: Table<address, address>,
    }

    struct Profile has key {
        id: UID,
        name: String,
        url: Url, // image URL
        description: String,
        registries: vector<address>,
    }

    /* Events */

    struct EventCreateRegistry has copy, drop {
        registry_id: ID,
    }

    struct EventCreateProfile has copy, drop {
        profile_id: ID,
        registry_id: ID,
    }

    /* Entry functions */

    public entry fun create_registry(
        name: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let registry_uid = object::new(ctx);
        let registry_id = object::uid_to_inner(&registry_uid);

        let registry = Registry {
            id: registry_uid,
            name: string::utf8(name),
            profiles: table::new(ctx),
        };
        transfer::share_object(registry);

        event::emit(EventCreateRegistry { registry_id });
    }

    public entry fun create_profile(
        registry: &mut Registry,
        name: vector<u8>,
        url: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let profile_uid = object::new(ctx);
        let profile_id = object::uid_to_inner(&profile_uid);
        let profile_addr = object::uid_to_address(&profile_uid);
        let registry_addr = object::id_address(registry);
        let sender_addr = tx_context::sender(ctx);

        let registries = vector::empty<address>();
        vector::push_back(&mut registries, registry_addr);
        let profile = Profile {
            id: profile_uid,
            name: string::utf8(name),
            url: url::new_unsafe_from_bytes(url),
            description: string::utf8(description),
            registries,
        };
        table::add(&mut registry.profiles, sender_addr, profile_addr);
        transfer::transfer(profile, sender_addr);

        event::emit(EventCreateProfile {
            profile_id,
            registry_id: object::id(registry),
        });
    }

    /// Aborts when the profile is already in the registry with `sui::dynamic_field::EFieldAlreadyExists`
    public entry fun add_to_registry(
        registry: &mut Registry,
        profile: &mut Profile,
        ctx: &mut TxContext,
    ) {
        let registry_addr = object::id_address(registry);
        let profile_addr = object::id_address(profile);
        let sender_addr = tx_context::sender(ctx);

        // Add the sender and their profile to the registry
        table::add(&mut registry.profiles, sender_addr, profile_addr);

        // Add the registry to the profile
        vector::push_back(&mut profile.registries, registry_addr);

    }

    /// Aborts when the profile is in only one registry.
    /// Aborts when the profile is not in the registry, with `sui::dynamic_field::EFieldDoesNotExist`.
    public entry fun remove_from_registry(
        registry: &mut Registry,
        profile: &mut Profile,
        ctx: &mut TxContext,
    ) {
        assert!( vector::length(&profile.registries) > 1 , E_CANT_REMOVE_LAST_REGISTRY );
        let registry_addr = object::id_address(registry);
        let sender_addr = tx_context::sender(ctx);

        // Remove the sender and their profile from the registry
        table::remove(&mut registry.profiles, sender_addr);

        // Remove the registry from the profile
        let (_found, index) = vector::index_of(&profile.registries, &registry_addr);
        vector::remove(&mut profile.registries, index);
    }

    public entry fun edit_profile(
        profile: &mut Profile,
        name: vector<u8>,
        url: vector<u8>,
        description: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        profile.name = string::utf8(name);
        profile.url = url::new_unsafe_from_bytes(url);
        profile.description = string::utf8(description);
    }

    /* Regular functions */

    struct LookupResult {
        lookup_addr: address,
        profile_addr: address,
    }

    /// Find profiles in a registry by the addresses of their owners.
    /// Addresses that don't have a profile in the registry don't get included in the results.
    /// Clients are expected to use the sui_devInspectTransaction RPC API.
    public fun get_profiles(
        registry: &Registry,
        lookup_addresses: vector<address>,
    ): vector<LookupResult>
    {
        let results = vector::empty<LookupResult>();
        let length = vector::length(&lookup_addresses);
        let index = 0;
        while ( index < length ) {
            let lookup_addr = *vector::borrow(&lookup_addresses, index);
            if ( table::contains(&registry.profiles, lookup_addr) ) {
                let profile_addr = *table::borrow(&registry.profiles, lookup_addr);
                let result = LookupResult { lookup_addr, profile_addr };
                vector::push_back(&mut results, result);
            };
            index = index + 1
        };
        return results
    }

    public fun set_dynamic_field<Name: copy + drop + store, Value: store>(
        profile: &mut Profile,
        name: Name,
        value: Value,
    ) {
        // TODO: replace existing
        dynamic_field::add(&mut profile.id, name, value);
    }

    public fun set_dynamic_object_field<Name: copy + drop + store, Value: key + store>(
        profile: &mut Profile,
        name: Name,
        value: Value,
    ) {
        // TODO: replace existing
        dynamic_object_field::add(&mut profile.id, name, value);
    }

    // TODO: delete_ fields
}
