/// Navigation bar

import { useState } from 'react';

import { Link } from 'react-router-dom';

import { useWalletKit } from '@mysten/wallet-kit';

import imgLogo from '../img/logo.png';
import '../css/Nav.less';

export function Nav({openConnectModal}: {
    openConnectModal: () => void,
}) {
    const { currentAccount, disconnect } = useWalletKit();

    const [showMobileNav, setShowMobileNav] = useState(false);
    const toggleMobileNav = () => { setShowMobileNav(!showMobileNav) };
    const closeMobileNav  = () => { setShowMobileNav(false) };

    return <header id='nav'>
        <div id='mobile-menu-btn-wrap' onClick={toggleMobileNav}>
            <span id='mobile-menu-btn'>☰</span>
        </div>

        <div id='nav-logo' className='nav-section'>
            <Link to='/'>
                <img id='nav-logo-img' src={imgLogo} alt='Polymedia Profile' />
                <span id='nav-logo-txt'>POLYMEDIA<br/>PROFILE</span>
            </Link>
        </div>

        <div id='nav-sections-wrap' className={showMobileNav ? 'open' : ''}>
            <div id='nav-wallet' className='nav-section'>
            {
                (currentAccount)
                ? <span id='nav-btn' className='disconnect' onClick={disconnect}>{'@' + currentAccount.slice(2, 6)}</span>
                : <span id='nav-btn' className='connect' onClick={openConnectModal}>LOG IN</span>
            }
            </div>

            <div id='nav-pages' className='nav-section'>
                <div className='nav-section-title'>
                    PAGES
                </div>
                <div className='nav-page-link'>
                    <Link to='/registry/new' onClick={closeMobileNav}>/registry/new</Link>
                </div>
                <div className='nav-page-link'>
                    <Link to='/profile/new' onClick={closeMobileNav}>/profile/new</Link>
                </div>
            </div>

            <div id='nav-socials' className='nav-section'>
                <div className='nav-section-title'>
                    SOCIALS
                </div>
                <div className='nav-social-link'>
                    <a href='https://polymedia.app/' target='_blank'>About</a>
                </div>
                <div className='nav-social-link'>
                    <a href='https://discord.gg/3ZaE69Eq78' target='_blank'>Discord</a>
                </div>
                <div className='nav-social-link'>
                    <a href='https://twitter.com/polymedia_app' target='_blank'>Twitter</a>
                </div>
            </div>
        </div>

    </header>;
}
