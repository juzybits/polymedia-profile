/// Navigation bar

import { ethos } from 'ethos-connect';
import '../css/Nav.less';

export function Nav() {
    const { status, wallet } = ethos.useWallet();

    return <header id='nav'>

        <div id='nav-btn-user' className='nav-btn'>
        {
            (wallet && wallet.address && status=='connected')
            ? <span id='nav-btn-disconnect' onClick={wallet.disconnect}>{'@' + wallet.address.slice(2, 6)}</span>
            : <span id='nav-btn-connect' onClick={ethos.showSignInModal}>LOG IN</span>
        }
        </div>

    </header>;
}
