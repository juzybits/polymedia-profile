import { useAppContext } from "./context";

export const NetworkRibbon: React.FC = () => {
	const { network } = useAppContext();
	if (network === "mainnet") return null;

	return <div className="network-ribbon">{network.toUpperCase()}</div>;
};
