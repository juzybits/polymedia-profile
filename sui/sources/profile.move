/*
  ___  ___  _ __   ____  __ ___ ___ ___   _
 | _ \/ _ \| |\ \ / /  \/  | __|   \_ _| /_\
 |  _/ (_) | |_\ V /| |\/| | _|| |) | | / _ \
 |_|_ \___/|____|_| |_| _|_|___|___/___/_/ \_\
 | _ \ _ \/ _ \| __|_ _| |  | __|
 |  _/   / (_) | _| | || |__| _|
 |_| |_|_\\___/|_| |___|____|___| by @juzybits

*/

module polymedia_profile::profile
{
    use std::string::{String, utf8};
    use std::vector;
    use sui::display::{Self};
    use sui::dynamic_field;
    use sui::dynamic_object_field;
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::package::{Self};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /* Structs */

    struct Registry has key {
        id: UID,
        name: String,
        profiles: Table<address, address>,
    }

    struct Profile has key {
        id: UID,
        name: String,
        image_url: String,
        description: String,
        data: String,
    }

    /* Events */

    struct EventCreateRegistry has copy, drop {
        registry_id: ID,
    }

    struct EventCreateProfile has copy, drop {
        profile_id: ID,
        registry_id: ID,
    }

    /* Functions */

    public entry fun create_registry(
        name: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let registry_uid = object::new(ctx);
        let registry_id = object::uid_to_inner(&registry_uid);

        let registry = Registry {
            id: registry_uid,
            name: utf8(name),
            profiles: table::new(ctx),
        };
        transfer::share_object(registry);

        event::emit(EventCreateRegistry { registry_id });
    }

    /// Create a new Profile for the sender, and add it to a Registry.
    /// Aborts if the sender already has a Profile inside the Registry,
    /// with `sui::dynamic_field::EFieldAlreadyExists`.
    public entry fun create_profile(
        registry: &mut Registry,
        name: vector<u8>,
        image_url: vector<u8>,
        description: vector<u8>,
        data: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let profile_uid = object::new(ctx);
        let profile_id = object::uid_to_inner(&profile_uid);
        let profile_addr = object::uid_to_address(&profile_uid);
        let sender_addr = tx_context::sender(ctx);

        let profile = Profile {
            id: profile_uid,
            name: utf8(name),
            image_url: utf8(image_url),
            description: utf8(description),
            data: utf8(data),
        };
        table::add(&mut registry.profiles, sender_addr, profile_addr);
        transfer::transfer(profile, sender_addr);

        event::emit(EventCreateProfile {
            profile_id,
            registry_id: object::id(registry),
        });
    }

    /// Add a Profile (and the sender) to a Registry.
    /// Aborts if the sender already has a Profile inside the Registry,
    /// with `sui::dynamic_field::EFieldAlreadyExists`.
    public entry fun add_to_registry(
        registry: &mut Registry,
        profile: &mut Profile,
        ctx: &mut TxContext,
    ) {
        let sender_addr = tx_context::sender(ctx);
        let profile_addr = object::id_address(profile);
        table::add(&mut registry.profiles, sender_addr, profile_addr);
    }

    public entry fun edit_profile(
        profile: &mut Profile,
        name: vector<u8>,
        image_url: vector<u8>,
        description: vector<u8>,
        data: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        profile.name = utf8(name);
        profile.image_url = utf8(image_url);
        profile.description = utf8(description);
        profile.data = utf8(data);
    }

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

    /// Aborts with `EFieldAlreadyExists` if the object already has that field with that name.
    public fun add_dynamic_field<Name: copy + drop + store, Value: store>(
        profile: &mut Profile,
        name: Name,
        value: Value,
    ) {
        dynamic_field::add(&mut profile.id, name, value);
    }

    /// Aborts with `EFieldDoesNotExist` if the object does not have a field with that name.
    /// Aborts with `EFieldTypeMismatch` if the field exists, but the value does not have
    /// the specified type.
    public fun remove_dynamic_field<Name: copy + drop + store, Value: store>(
        profile: &mut Profile,
        name: Name,
    ): Value {
        return dynamic_field::remove(&mut profile.id, name)
    }

    /// Aborts with `EFieldAlreadyExists` if the object already has that field with that name.
    public fun add_dynamic_object_field<Name: copy + drop + store, Value: key + store>(
        profile: &mut Profile,
        name: Name,
        value: Value,
    ) {
        dynamic_object_field::add(&mut profile.id, name, value);
    }

    /// Aborts with `EFieldDoesNotExist` if the object does not have a field with that name.
    /// Aborts with `EFieldTypeMismatch` if the field exists, but the value object does not have
    /// the specified type.
    public fun remove_dynamic_object_field<Name: copy + drop + store, Value: key + store>(
        profile: &mut Profile,
        name: Name,
    ): Value {
        return dynamic_object_field::remove(&mut profile.id, name)
    }

    // One-Time-Witness
    struct PROFILE has drop {}

    fun init(otw: PROFILE, ctx: &mut TxContext)
    {
        let publisher = package::claim(otw, ctx);

        let profile_display = display::new_with_fields<Profile>(
            &publisher,
            vector[
                utf8(b"name"),
                utf8(b"image_url"),
                utf8(b"description"),
                utf8(b"link"),
                utf8(b"creator"),
                utf8(b"project_name"),
                utf8(b"project_url"),
                utf8(b"project_image_url"),
            ], vector[
                utf8(b"{name}"), // name
                utf8(b"{image_url}"), // image_url
                utf8(b"{description}"), // description
                utf8(b"https://profile.polymedia.app/view/{id}"), // link
                utf8(b"https://polymedia.app"), // creator
                utf8(b"Polymedia Profile"), // project_name
                utf8(b"https://profile.polymedia.app"), // project_url
                utf8(b"https://profile.polymedia.app/img/project_image.png"), // project_image_url
            ], ctx
        );

        display::update_version(&mut profile_display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(profile_display, tx_context::sender(ctx));
    }
}

/*
    const E_CANT_REMOVE_LAST_REGISTRY: u64 = 100;

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
*/
