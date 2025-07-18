import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import type { PolymediaProfile } from "@polymedia/profile-sdk";
import { type NetworkName, shortenAddress } from "@polymedia/suitcase-core";
import {
	isLocalhost,
	NetworkRadioSelector,
	type Setter,
} from "@polymedia/suitcase-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supportedNetworks } from "./app";
import "./styles/nav.less";

export const Nav: React.FC<{
	network: NetworkName;
	setNetwork: Setter<NetworkName>;
	openConnectModal: () => void;
	profile: PolymediaProfile | null | undefined;
}> = ({ network, setNetwork, openConnectModal, profile }) => {
	const currentAccount = useCurrentAccount();

	const [showMobileNav, setShowMobileNav] = useState(false);
	const toggleMobileNav = () => {
		setShowMobileNav(!showMobileNav);
	};
	const closeMobileNav = () => {
		setShowMobileNav(false);
	};
	const showNetworkSelector = isLocalhost();

	return (
		<header id="nav">
			<div id="mobile-menu-btn-wrap" onClick={toggleMobileNav}>
				<span id="mobile-menu-btn">☰</span>
			</div>

			<div id="nav-logo" className="nav-section">
				<Link to="/" id="nav-logo-link" onClick={closeMobileNav}>
					<img
						id="nav-logo-img"
						src="https://assets.polymedia.app/img/all/logo-nomargin-transparent-512x512.webp"
						alt="Polymedia logo"
					/>
					<span id="nav-logo-txt">
						<span id="nav-title-polymedia">POLYMEDIA</span>
						<span id="nav-title-profile">PROFILE</span>
					</span>
				</Link>
			</div>

			<div id="nav-sections-wrap" className={showMobileNav ? "open" : ""}>
				<div id="nav-user" className="nav-section">
					{!currentAccount ? (
						<span id="nav-btn-connect" onClick={openConnectModal}>
							LOG IN
						</span>
					) : (
						<NavProfile profile={profile} />
					)}
					{showNetworkSelector && (
						<NetworkRadioSelector
							selectedNetwork={network}
							supportedNetworks={supportedNetworks}
							onSwitch={setNetwork}
						/>
					)}
				</div>

				<div id="nav-pages" className="nav-section">
					<div className="nav-page-link">
						<Link to="/" onClick={closeMobileNav}>
							HOME
						</Link>
					</div>
					<div className="nav-page-link">
						<Link to="/manage" onClick={closeMobileNav}>
							PROFILE
						</Link>
					</div>
					<div className="nav-page-link">
						<Link to="/search" onClick={closeMobileNav}>
							SEARCH
						</Link>
					</div>
					<div className="nav-page-link">
						<Link to="/docs" onClick={closeMobileNav}>
							DOCS
						</Link>
					</div>
					{/*<div className='nav-page-link'>
                    <Link to='/profile/new' onClick={closeMobileNav}>New Profile</Link>
                </div>
                <div className='nav-page-link'>
                    <Link to='/registry/new' onClick={closeMobileNav}>New Registry</Link>
                </div>*/}
				</div>

				<div id="nav-socials" className="nav-section">
					<div className="nav-social-link">
						<a
							href="https://github.com/juzybits/polymedia-profile"
							target="_blank"
							rel="noopener noreferrer"
						>
							Github
						</a>
					</div>
					<div className="nav-social-link">
						<a
							href="https://twitter.com/polymedia_app"
							target="_blank"
							rel="noopener noreferrer"
						>
							Twitter
						</a>
					</div>
					<div className="nav-social-link">
						<a
							href="https://discord.gg/3ZaE69Eq78"
							target="_blank"
							rel="noopener noreferrer"
						>
							Discord
						</a>
					</div>
				</div>

				<div id="nav-watermark" className="nav-section">
					<div className="nav-social-link">
						<a href="https://polymedia.app" target="_blank" rel="noopener noreferrer">
							Polymedia {new Date().getFullYear()}
						</a>
					</div>
				</div>
			</div>
		</header>
	);
};

const NavProfile: React.FC<{
	profile: PolymediaProfile | null | undefined;
}> = ({ profile }) => {
	const currentAccount = useCurrentAccount();
	const { mutate: disconnect } = useDisconnectWallet();

	if (!currentAccount) {
		return <></>;
	}

	if (profile === undefined) {
		return "Loading...";
	}

	return (
		<div
			id="nav-profile"
			onClick={() => {
				disconnect();
			}}
		>
			<div id="nav-profile-image-wrap">
				<img src={profile?.imageUrl || "/img/anon.webp"} />
			</div>
			<div id="nav-profile-name-wrap">
				<div id="nav-profile-name">{profile ? profile.name : "Anon"}</div>
				<div id="nav-profile-address">{shortenAddress(currentAccount.address)}</div>
			</div>
		</div>
	);
};
