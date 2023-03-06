import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { AppContext } from './App';

export const Home: React.FC = () =>
{
    useEffect(() => {
        document.title = 'Polymedia Profile - Home';
    }, []);

    const { network, profileManager } = useOutletContext<AppContext>();


    return <div id='page' className='page-about'>
        <h1>
            HOME
        </h1>
        <p>
            Polymedia Profile is a fully on-chain profile/identity system on the <a href='https://sui.io' target='_blank'>Sui Network</a>. It is used in all our apps, like <a href='https://chat.polymedia.app/@sui-fans' target='_blank'>Polymedia Chat</a>.
            <br/>
            <br/>

            This web app is for users to manage their profiles on the default registry (called <i><a target="_blank" href={`https://explorer.sui.io/object/${profileManager.getRegistryId()}?network=${network}`}>polymedia-main</a></i>).
            <br/>
            <br/>
            The code for this project is fully <a href='https://github.com/juzybits/polymedia-profile' target='_blank'>open-source</a>, and we provide a <a href='https://www.npmjs.com/package/@polymedia/profile-sdk' target='_blank'>TypeScript SDK</a> to facilitate 3rd party integrations.
        </p>
        <Link to='/manage' className='btn' style={{marginRight: '0.5em'}}>MANAGE PROFILE</Link>
        <Link to='/docs' className='btn'>READ DOCS</Link>
    </div>;
}
