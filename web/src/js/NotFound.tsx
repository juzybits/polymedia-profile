import { useEffect } from 'react';

export function NotFound() {
    useEffect(() => {
        document.title = 'Polymedia Profile - Not found';
    }, []);

    return <div id='page' className='page-notfound'>
        <h1>404</h1>
        <div>
            Not found.
        </div>
    </div>;
}
