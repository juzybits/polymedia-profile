import { useEffect } from 'react';

export const Docs: React.FC = () =>
{
    useEffect(() => {
        document.title = 'Polymedia Profile - Docs';
    }, []);

    return <div id='page' className='page-about'>
        <h1>
            Docs
        </h1>
        <p>
            Polymedia Profile (PP) is a fully on-chain profile system on the Sui Network.
            <br/><br/>
            Conceptually, Polymedia Profiles are more similar to Discord profiles than to DNS domains. If a Sui address is like a Discord ID (unique, random), then a PP is like a Discord profile.
            <br/><br/>
            Key facts about Polymedia Profile:
            <ol>

            <li>PPs are <b>free</b> to use and there is no cost associated with registering one (aside from gas).</li>

            <li>The fields in a PP are <b>not unique</b>. Want to use "John" as your name? No problem!</li>

            <li>PPs can be used <b>anywhere</b>, not just on Polymedia apps. We provide a TypeScript SDK to make it very easy for others to integrate Polymedia Profile into their projects.</li>

            <li>Unlike name services that map a "domain" to an address, PP is built for a web3 native experience: when you are onchain, addresses are always known - what you want to find in this case is the name associated to an address.</li>

            <li>PPs exist inside a <i>Registry</i>. The default registry (used by this and all Polymedia apps) is called <i>polymedia-main</i>, but anyone can create a new registry.</li>

            </ol>
        </p>

        <p>
            Polymedia Profile is fully open-source:
            <ul>

            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/sui' target='_blank'>Sui Move code</a></li>

            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/sdk' target='_blank'>TypeScript SDK</a></li>

            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/web' target='_blank'>Web interface</a></li>

            </ul>
        </p>

        <p>
            Polymedia Profile is under active development. We will be updating this page with more information. And we will add technical docs and code examples to the GitHub repository.
        </p>

    </div>;
}
