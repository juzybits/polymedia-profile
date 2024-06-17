import {
    ConnectModal,
    SuiClientProvider,
    WalletProvider,
    createNetworkConfig,
    useCurrentAccount,
    useSuiClient,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { PolymediaProfile, ProfileClient } from "@polymedia/profile-sdk";
import { loadNetwork } from "@polymedia/suitcase-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Docs } from "./Docs";
import { Home } from "./Home";
import { ManageProfile } from "./ManageProfile";
import { Nav } from "./Nav";
import { NotFound } from "./NotFound";
import { RegistryNew } from "./RegistryNew";
import { SearchProfiles } from "./SearchProfiles";
import { ViewProfile } from "./ViewProfile";
import { notifyError } from "./components/Notification";
import "./styles/App.less";

/* App router */

export const AppRouter: React.FC = () => {
    return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<AppSuiProviders />} >
                <Route index element={<Home />} />
                <Route path="manage" element={<ManageProfile />} />
                <Route path="docs" element={<Docs />} />
                <Route path="registry/new" element={<RegistryNew />} />
                <Route path="search" element={<SearchProfiles />} />
                <Route path="view/:profileId" element={<ViewProfile />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    </BrowserRouter>
    );
};

/* Sui providers + network config */

const supportedNetworks = ["mainnet", "testnet", "devnet"] as const;
export type NetworkName = typeof supportedNetworks[number];

const { networkConfig } = createNetworkConfig({
    mainnet: { url: "https://mainnet.suiet.app" },
    testnet: { url: getFullnodeUrl("testnet") },
    devnet: { url: getFullnodeUrl("devnet") },
});

const queryClient = new QueryClient();
const AppSuiProviders: React.FC = () => {
    const [network, setNetwork] = useState(loadNetwork(supportedNetworks, "mainnet"));
    return (
    <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network={network}>
            <WalletProvider autoConnect={true}>
                <App network={network} _setNetwork={setNetwork} />
            </WalletProvider>
        </SuiClientProvider>
    </QueryClientProvider>
    );
};

/* App */

export type ReactSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export type AppContext = {
    network: NetworkName;
    profile: PolymediaProfile|null|undefined;
    profileClient: ProfileClient;
    reloadProfile: () => Promise<PolymediaProfile|null|undefined>;
    openConnectModal: () => void;
};

const App: React.FC<{
    network: NetworkName;
    _setNetwork: ReactSetter<NetworkName>;
}> = ({
    network,
}) =>
{
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    const [ profile, setProfile ] = useState<PolymediaProfile|null|undefined>(undefined);
    const [ showConnectModal, setShowConnectModal ] = useState(false);
    const [ profileClient, setProfileManager ] = useState<ProfileClient>(
        new ProfileClient(network, suiClient)
    );

    useEffect(() => {
        setProfileManager(
            new ProfileClient(network, suiClient)
        );
    }, [network, suiClient]);

    useEffect(() => {
        reloadProfile();
    }, [currentAccount]);

    const reloadProfile = async (): Promise<PolymediaProfile|null|undefined> => {
        if (!currentAccount) {
            setProfile(undefined);
            return undefined;
        }
        return await profileClient.getProfileByOwner(currentAccount.address, false)
        .then((result: PolymediaProfile|null) => {
            console.debug("[reloadProfile] Setting profile:", result);
            setProfile(result);
            return result;
        })
        .catch((error: any) => {
            const errorString = String(error.stack || error.message || error);
            console.warn("[reloadProfile] Error:", errorString);
            notifyError(errorString);
            return undefined;
        });
    };

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

    return <>
        <ConnectModal
            trigger={<></>}
            open={showConnectModal}
            onOpenChange={isOpen => { setShowConnectModal(isOpen); }}
        />

        <div id="layout">
             {/* #nav */}
            <Nav network={network} openConnectModal={openConnectModal} profile={profile} />
            {/* #page */}
            <Outlet context={appContext} />
            <div id="filler-section"></div>
        </div>
    </>;
};
