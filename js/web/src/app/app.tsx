import {
	ConnectModal,
	createNetworkConfig,
	SuiClientProvider,
	useCurrentAccount,
	useSignTransaction,
	useSuiClient,
	WalletProvider,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { getFullnodeUrl } from "@mysten/sui/client";
import {
	NETWORK_IDS,
	type PolymediaProfile,
	ProfileClient,
} from "@polymedia/profile-sdk";
import { loadNetwork, type Setter } from "@polymedia/suitcase-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { notifyError } from "../components/notification";
import { Nav } from "./nav";
import { PageDocs } from "../pages/docs";
import { PageHome } from "../pages/home";
import { PageNotFound } from "../pages/not-found";
import { PageProfileManage } from "../pages/profile-manage";
import { PageProfileSearch } from "../pages/profile-search";
import { PageProfileView } from "../pages/profile-view";
import { PageRegistryNew } from "../pages/registry-new";
import "../styles/app.less";

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

export const supportedNetworks = ["localnet", "devnet", "testnet", "mainnet"] as const;
export type SupportedNetwork = (typeof supportedNetworks)[number];

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
	network: SupportedNetwork;
	profile: PolymediaProfile | null | undefined;
	profileClient: ProfileClient;
	reloadProfile: () => Promise<PolymediaProfile | null | undefined>;
	openConnectModal: () => void;
};

const App: React.FC<{
	network: SupportedNetwork;
	setNetwork: Setter<SupportedNetwork>;
}> = ({ network, setNetwork }) => {
	const [profile, setProfile] = useState<PolymediaProfile | null | undefined>(undefined);
	const [showConnectModal, setShowConnectModal] = useState(false);

	const suiClient = useSuiClient();
	const currAcct = useCurrentAccount();
	const { mutateAsync: walletSignTx } = useSignTransaction();

	const profileClient = useMemo(() => {
		return new ProfileClient({
			profilePkgId: NETWORK_IDS[network].packageId,
			registryId: NETWORK_IDS[network].registryId,
			suiClient,
			signTx: (tx) => walletSignTx({ transaction: tx }),
		});
	}, [suiClient, walletSignTx, network]);

	const reloadProfile = async (): Promise<PolymediaProfile | null | undefined> => {
		if (!currAcct) {
			setProfile(undefined);
			return undefined;
		}
		return await profileClient
			.getProfileByOwner(currAcct.address, false)
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
	}, [currAcct, profileClient]);

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
				trigger={<button style={{ display: "none" }} />}
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
