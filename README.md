# Polymedia Profile

![Polymedia Profile](./web/src/img/open_graph.webp)

Polymedia Profile is a fully on-chain profile/identity system on the Sui Network.

- TypeScript SDK: [sdk/](sdk/)
- Sui Move code: [sui/](sui/)
- Web interface: [web/](web/)

Key facts about Polymedia Profile:
1. Profiles are free to use and there is no cost associated with registering one (aside from network fees).
2. A Profile object is permanently attached to the Sui address that created it. Profiles are not transferable.
3. Profile properties are not unique. Want to use "John" as your name? No problem!
4. Profiles are always included in at least one Registry object. A Sui address may own multiple profiles, but can only add one Profile to each Registry.
5. The default registry is called _polymedia-main_, and is used by all our apps. Anyone can create a new registry.
6. Profiles can be used anywhere on Sui. We provide a TypeScript SDK to facilitate 3rd party integrations.

Follow [@polymedia_app](https://twitter.com/intent/follow?screen_name=polymedia_app) on Twitter or join our [Discord](https://discord.gg/3ZaE69Eq78) to stay up to date.
