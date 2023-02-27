/// Navigation bar

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import imgLogo from '../img/logo.png';
import '../css/Nav.less';

export const Nav: React.FC<{
    openConnectModal: () => void,
}> = ({openConnectModal}) =>
{
    const { currentAccount, disconnect } = useWalletKit();

    const [showMobileNav, setShowMobileNav] = useState(false);
    const toggleMobileNav = () => { setShowMobileNav(!showMobileNav) };
    const closeMobileNav  = () => { setShowMobileNav(false) };

    return <header id='nav'>
        <div id='mobile-menu-btn-wrap' onClick={toggleMobileNav}>
            <span id='mobile-menu-btn'>☰</span>
        </div>

        <div id='nav-logo' className='nav-section'>
            <Link to='/' id='nav-logo-link' onClick={closeMobileNav}>
                <img id='nav-logo-img' src={imgLogo} alt='Polymedia Profile' />
                <span id='nav-logo-txt'>
                    <span id='nav-title-polymedia'>POLYMEDIA</span>
                    <span id='nav-title-profile'>PROFILE</span>
                </span>
            </Link>
        </div>

        <div id='nav-sections-wrap' className={showMobileNav ? 'open' : ''}>
            <div id='nav-wallet' className='nav-section'>
            {
                !currentAccount
                ? <span id='nav-btn' className='connect' onClick={openConnectModal}>
                    LOG IN
                  </span>
                : <span id='nav-btn' className='disconnect' onClick={disconnect}>
                    {'@' + currentAccount.slice(2, 6)}
                  </span>
            }
            </div>

            <div id='nav-pages' className='nav-section'>
                <div className='nav-section-title'>
                    PAGES
                </div>
                <div className='nav-page-link'>
                    <Link to='/' onClick={closeMobileNav}>HOME</Link>
                </div>
                <div className='nav-page-link'>
                    <Link to='/manage' onClick={closeMobileNav}>PROFILE</Link>
                </div>
                {/*<div className='nav-page-link'>
                    <Link to='/profile/new' onClick={closeMobileNav}>New Profile</Link>
                </div>
                <div className='nav-page-link'>
                    <Link to='/registry/new' onClick={closeMobileNav}>New Registry</Link>
                </div>*/}
            </div>

            <div id='nav-socials' className='nav-section'>
                <div className='nav-section-title'>
                    LINKS
                </div>
                <div className='nav-social-link'>
                    <a href='https://polymedia.app' target='_blank'>Polymedia</a>
                </div>
                <div className='nav-social-link'>
                    <a href='https://twitter.com/polymedia_app' target='_blank'>Twitter</a>
                </div>
                <div className='nav-social-link'>
                    <a href='https://discord.gg/3ZaE69Eq78' target='_blank'>Discord</a>
                </div>
            </div>
        </div>

    </header>;
}
