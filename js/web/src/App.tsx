import {
	ConnectModal,
	createNetworkConfig,
	SuiClientProvider,
	useCurrentAccount,
	useSuiClient,
	WalletProvider,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { getFullnodeUrl } from "@mysten/sui/client";
import { type PolymediaProfile, ProfileClient } from "@polymedia/profile-sdk";
import { loadNetwork, type Setter } from "@polymedia/suitcase-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { notifyError } from "./components/Notification";
import { Nav } from "./Nav";
import { PageDocs } from "./PageDocs";
import { PageHome } from "./PageHome";
import { PageNotFound } from "./PageNotFound";
import { PageProfileManage } from "./PageProfileManage";
import { PageProfileSearch } from "./PageProfileSearch";
import { PageProfileView } from "./PageProfileView";
import { PageRegistryNew } from "./PageRegistryNew";
import "./styles/App.less";

/* App router */

export const AppRouter: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<AppSuiProviders />}>
					<Route index element={<PageHome />} />
					<Route path="manage" element={<PageProfileManage />} />
					<Route path="docs" element={<PageDocs />} />
					<Route path="registry/new" element={<PageRegistryNew />} />
					<Route path="search" element={<PageProfileSearch />} />
					<Route path="view/:profileId" element={<PageProfileView />} />
					<Route path="*" element={<PageNotFound />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};

/* Sui providers + network config */

export const supportedNetworks = ["mainnet", "testnet", "devnet", "localnet"] as const;
export type NetworkName = (typeof supportedNetworks)[number];

const { networkConfig } = createNetworkConfig({
	mainnet: { url: getFullnodeUrl("mainnet") },
	testnet: { url: getFullnodeUrl("testnet") },
	devnet: { url: getFullnodeUrl("devnet") },
	localnet: { url: getFullnodeUrl("localnet") },
});

const queryClient = new QueryClient();
const AppSuiProviders: React.FC = () => {
	const [network, setNetwork] = useState(loadNetwork(supportedNetworks, "mainnet"));
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} network={network}>
				<WalletProvider autoConnect={true}>
					<App network={network} setNetwork={setNetwork} />
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
};

/* App */

export type AppContext = {
	network: NetworkName;
	profile: PolymediaProfile | null | undefined;
	profileClient: ProfileClient;
	reloadProfile: () => Promise<PolymediaProfile | null | undefined>;
	openConnectModal: () => void;
};

const App: React.FC<{
	network: NetworkName;
	setNetwork: Setter<NetworkName>;
}> = ({ network, setNetwork }) => {
	const suiClient = useSuiClient();
	const currentAccount = useCurrentAccount();

	const [profile, setProfile] = useState<PolymediaProfile | null | undefined>(undefined);
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [profileClient, setProfileManager] = useState<ProfileClient>(
		new ProfileClient(network, suiClient),
	);

	useEffect(() => {
		setProfileManager(new ProfileClient(network, suiClient));
	}, [network, suiClient]);

	const reloadProfile = async (): Promise<PolymediaProfile | null | undefined> => {
		if (!currentAccount) {
			setProfile(undefined);
			return undefined;
		}
		return await profileClient
			.getProfileByOwner(currentAccount.address, false)
			.then((result: PolymediaProfile | null) => {
				console.debug("[reloadProfile] Setting profile:", result);
				setProfile(result);
				return result;
			})
			.catch((err) => {
				console.warn("[reloadProfile]", err);
				notifyError(String(err));
				return undefined;
			});
	};

	useEffect(() => {
		reloadProfile();
	}, [reloadProfile]);

	const openConnectModal = (): void => {
		setShowConnectModal(true);
	};

	const appContext: AppContext = {
		network,
		profile,
		profileClient,
		reloadProfile,
		openConnectModal,
	};

	return (
		<>
			<ConnectModal
				trigger={<></>}
				open={showConnectModal}
				onOpenChange={(isOpen) => {
					setShowConnectModal(isOpen);
				}}
			/>

			<div id="layout">
				{/* #nav */}
				<Nav
					network={network}
					setNetwork={setNetwork}
					openConnectModal={openConnectModal}
					profile={profile}
				/>
				{/* #page */}
				<Outlet context={appContext} />
				<div id="filler-section"></div>
			</div>
		</>
	);
};
