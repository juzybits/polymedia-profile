import { makePolymediaUrl } from "@polymedia/suitcase-core";
import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";

export const Docs: React.FC = () =>
{
    useEffect(() => {
        document.title = "Polymedia Profile - Docs";
    }, []);

    const { network, profileClient } = useOutletContext<AppContext>();

    return <div id="page" className="page-about">
        <h1>
            DOCS
        </h1>

        <p>
            The code and technical docs can be found on the <a href="https://github.com/juzybits/polymedia-profile/" target="_blank" rel="noopener noreferrer">GitHub repo</a>:
        </p>
        <ul>
            <li><a href="https://github.com/juzybits/polymedia-profile/tree/main/sui" target="_blank" rel="noopener noreferrer">Sui Move package</a>: the on-chain profile system.</li>

            <li><a href="https://github.com/juzybits/polymedia-profile/tree/main/sdk" target="_blank" rel="noopener noreferrer">TypeScript SDK</a>: a library that can be <a href="https://www.npmjs.com/package/@polymedia/profile-sdk" target="_blank" rel="noopener noreferrer">npm installed</a>.</li>

            <li><a href="https://github.com/juzybits/polymedia-profile/tree/main/web" target="_blank" rel="noopener noreferrer">Web interface</a>: the website you're on right now.</li>
        </ul>

        <p>
            Key facts about Polymedia Profile:
        </p>
        <ol>
            <li>Profile properties are <b>not unique</b>. Want to use "Alice" as your user name? No problem!</li>

            <li>A <i>Profile</i> object is permanently attached to the Sui address that created it. Profiles are <b>not transferable</b>.</li>

            <li>Profiles are always included in at least one <i>Registry</i> object. A Sui address may own multiple profiles, but can only add one <i>Profile</i> to each <i>Registry</i>.</li>

            <li>The default registry is called <i><a href={makePolymediaUrl(network, "object", profileClient.registryId)} target="_blank" rel="noopener noreferrer">polymedia-main</a></i>, and is used by all Polymedia apps. <b>Anyone</b> can create a new registry.</li>

            <li>Profiles can be used <b>anywhere</b> on Sui. There is a <a href="https://www.npmjs.com/package/@polymedia/profile-sdk" target="_blank" rel="noopener noreferrer">TypeScript SDK</a> to facilitate 3rd party integrations.</li>

            <li>Profiles are <b>free</b> to use and there is no cost associated with registering one (aside from network fees).</li>
        </ol>

    </div>;
};
