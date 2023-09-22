# Polymedia Profile

![Polymedia Profile](./web/src/img/open-graph.webp)

Polymedia Profile is a fully on-chain profile system on Sui. It lets users attach a profile (name, picture, etc) to their Sui address. Over 137,000 profiles have been created to date.

- Sui Move package: [./sui/](https://github.com/juzybits/polymedia-profile/tree/main/sui)
- TypeScript SDK: [./sdk/](https://github.com/juzybits/polymedia-profile/tree/main/sdk)
- Web interface: [./web/](https://github.com/juzybits/polymedia-profile/tree/main/web)

Key facts about Polymedia Profile:
1. Profile properties are not unique. Want to use "Alice" as your user name? No problem!
2. A Profile object is permanently attached to the Sui address that created it. Profiles are not transferable.
3. Profiles are always included in at least one Registry object. A Sui address may own multiple profiles, but can only add one Profile to each Registry.
4. The default registry is called polymedia-main, and is used by all Polymedia apps. Anyone can create a new registry.
5. Profiles can be used anywhere on Sui. There is a TypeScript SDK to facilitate 3rd party integrations.
6. Profiles are free to use and there is no cost associated with registering one (aside from network fees).
