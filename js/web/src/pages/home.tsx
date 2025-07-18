import { makePolymediaUrl } from "@polymedia/suitcase-core";
import { Link } from "react-router-dom";
import { useAppContext } from "../app/context";

export const PageHome: React.FC = () => {
	const { network, profileClient } = useAppContext();

	return (
		<div id="page" className="page-home">
			<h1>HOME</h1>
			<p>
				Polymedia Profile is a fully on-chain profile system on{" "}
				<a href="https://sui.io" target="_blank" rel="noopener noreferrer">
					Sui
				</a>
				. It lets users attach a profile (name, picture, etc) to their Sui address. Over
				137,000 profiles have been created to date.
				<br />
				<br />
				This web app lets users manage their profiles on the default registry, called{" "}
				<i>
					<a
						href={makePolymediaUrl(network, "object", profileClient.registryId)}
						target="_blank"
						rel="noopener noreferrer"
					>
						polymedia-main
					</a>
				</i>
				.
				<br />
				<br />
				The code is fully{" "}
				<a
					href="https://github.com/juzybits/polymedia-profile"
					target="_blank"
					rel="noopener noreferrer"
				>
					open-source
				</a>
				, and there is a{" "}
				<a
					href="https://www.npmjs.com/package/@polymedia/profile-sdk"
					target="_blank"
					rel="noopener noreferrer"
				>
					TypeScript SDK
				</a>{" "}
				to facilitate 3rd party integrations.
			</p>
			<Link to="/manage" className="btn" style={{ marginRight: "0.5em" }}>
				MANAGE PROFILE
			</Link>
			<Link to="/docs" className="btn">
				READ DOCS
			</Link>
		</div>
	);
};
