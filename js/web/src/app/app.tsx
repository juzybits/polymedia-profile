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
import { type PolymediaProfile, ProfileClient } from "@polymedia/profile-sdk";
import { loadNetwork, type Setter } from "@polymedia/suitcase-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { PageDocs } from "../pages/docs";
import { PageHome } from "../pages/home";
import { PageNotFound } from "../pages/not-found";
import { PageProfileManage } from "../pages/profile-manage";
import { PageProfileSearch } from "../pages/profile-search";
import { PageProfileView } from "../pages/profile-view";
import { PageRegistryNew } from "../pages/registry-new";
import "../styles/app.less";
import { networkIds } from "./config";
import { AppContext } from "./context";
import { Nav } from "./nav";

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

export type AppContextType = {
	network: SupportedNetwork;
	setNetwork: Setter<SupportedNetwork>;
	profile: PolymediaProfile | null | undefined;
	profileClient: ProfileClient;
	reloadProfile: () => Promise<void>;
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
			profilePkgId: networkIds[network].packageId,
			registryId: networkIds[network].registryId,
			suiClient,
			signTx: (tx) => walletSignTx({ transaction: tx }),
		});
	}, [suiClient, walletSignTx, network]);

	const reloadProfile = useCallback(async (): Promise<void> => {
		if (!currAcct) {
			setProfile(undefined);
			return;
		}
		await profileClient
			.getProfileByOwner(currAcct.address, false)
			.then((result: PolymediaProfile | null) => {
				console.debug("[reloadProfile] Setting profile:", result);
				setProfile(result);
			})
			.catch((err) => {
				console.warn("[reloadProfile]", err);
				toast.error(String(err));
			});
	}, [currAcct, profileClient]);

	useEffect(() => {
		reloadProfile();
	}, [reloadProfile]);

	const openConnectModal = (): void => {
		setShowConnectModal(true);
	};

	const appContext: AppContextType = {
		network,
		setNetwork,
		profile,
		profileClient,
		reloadProfile,
		openConnectModal,
	};

	return (
		<AppContext.Provider value={appContext}>
			<div id="layout">
				<Nav />
				<Outlet /> {/* loads a page/*.tsx */}
				<div id="filler-section"></div>
				<Toaster
					position="bottom-right"
					toastOptions={{
						success: { className: "toast toast-success" },
						error: { className: "toast toast-error" },
					}}
				/>
				<ConnectModal
					trigger={<button style={{ display: "none" }} />}
					open={showConnectModal}
					onOpenChange={(isOpen) => {
						setShowConnectModal(isOpen);
					}}
				/>
			</div>
		</AppContext.Provider>
	);
};
