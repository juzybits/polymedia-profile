import { Link } from 'react-router-dom';
import '../css/Home.less';

export function Home() {
    return <div id='page' className='page-home'>
        <h1>
            HOME
        </h1>
        <ul className='tmp-list'>
            <li><Link to='/registry/new'>/registry/new</Link></li>
        </ul>
    </div>;
}
