import { useEffect } from 'react';

export const Home: React.FC = () =>
{
    useEffect(() => {
        document.title = 'Polymedia Profile - Home';
    }, []);

    return <div id='page' className='page-about'>
        <h1>
            HOME
        </h1>
        <p>
            Polymedia Profile is the on-chain profile/identity system that is used in all our projects, such as <a href='https://chat.polymedia.app/@sui-fans' target='_blank'>Polymedia Chat</a>.
            <br/>
            <br/>
            We will release a JavaScript SDK to make it really easy for others to integrate Polymedia Profile into their own projects.
        </p>
    </div>;
}
