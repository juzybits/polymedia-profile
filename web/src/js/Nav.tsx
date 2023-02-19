/// Navigation bar

import { useWalletKit } from '@mysten/wallet-kit';
import '../css/Nav.less';

export function Nav({openConnectModal}: {
    openConnectModal: () => void,
}) {
    const { currentAccount, disconnect } = useWalletKit();

    return <header id='nav'>
        <div id='nav-btn-user' className='nav-btn'>
        {
            (currentAccount)
            ? <span id='nav-btn-disconnect' onClick={disconnect}>{'@' + currentAccount.slice(2, 6)}</span>
            : <span id='nav-btn-connect' onClick={openConnectModal}>LOG IN</span>
        }
        </div>

    </header>;
}
