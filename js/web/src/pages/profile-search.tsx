import type { PolymediaProfile } from "@polymedia/profile-sdk";
import { REGEX_ADDRESS } from "@polymedia/suitcase-core";
import { LinkToPolymedia, makeCssUrl } from "@polymedia/suitcase-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../app/context";
import "../styles/search-profiles.less";

const addressRegex = new RegExp(REGEX_ADDRESS, "g");

export const PageProfileSearch: React.FC = () => {
	/* State */

	const { network, profileClient } = useAppContext();

	const [userInput, setUserInput] = useState<string>("");
	const [addressCount, setAddressCount] = useState<number>(0);
	const [results, setResults] = useState<
		Map<string, PolymediaProfile | null> | undefined
	>(undefined);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	/* Functions */

	useEffect(() => {
		const loadProfiles = async () => {
			setErrorMsg(null);
			setResults(undefined);
			const addresses = userInput.match(addressRegex) || [];
			setAddressCount(addresses.length);
			if (addresses.length === 0) {
				return;
			}
			setIsLoading(true);
			try {
				const profiles = await profileClient.getProfilesByOwner(addresses);
				setResults(profiles);
			} catch (err) {
				console.warn("[loadProfiles]", err);
				setErrorMsg(String(err));
			} finally {
				setIsLoading(false);
			}
		};
		loadProfiles();
	}, [userInput, profileClient.getProfilesByOwner]);

	const onUserInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const addressesString = e.target.value;
		setUserInput(addressesString);
	};

	/* HTML */

	const ProfileLine: React.FC<{
		address: string;
		profile: PolymediaProfile | null;
	}> = ({ address, profile }) => {
		const hasPfp = profile && profile.imageUrl.length > 0;
		const pfpStyle = !hasPfp
			? { opacity: 0.7 }
			: { backgroundImage: makeCssUrl(profile.imageUrl) };
		return (
			<tr className="profile-line">
				<td className="td-owner">
					<LinkToPolymedia network={network} kind="address" addr={address} />
				</td>
				<td className="td-profile">
					{!profile ? (
						<span className="no-profile">no profile</span>
					) : (
						<Link to={`/view/${profile.id}`}>
							<div className="profile-img-wrap">
								<span className="profile-img" style={pfpStyle} />
							</div>
							<span className="profile-name">{profile.name}</span>
						</Link>
					)}
				</td>
			</tr>
		);
	};

	return (
		<div id="page" className="page-search-profiles">
			<h1>SEARCH PROFILES</h1>

			<p>Enter one or more Sui addresses to fetch their profiles.</p>

			<form className="form">
				<div className="form-field">
					<textarea
						value={userInput}
						spellCheck="false"
						autoCorrect="off"
						autoComplete="off"
						onChange={onUserInputChange}
					/>
					<div>
						{addressCount} address{addressCount !== 1 && "es"}
					</div>
				</div>
				{isLoading && <div className="search-loading">Loading...</div>}
			</form>

			{results && (
				<div className="search-results">
					<table>
						<thead>
							<tr>
								<th>Owner</th>
								<th>Profile</th>
							</tr>
						</thead>
						<tbody>
							{Array.from(results.entries()).map(([address, profile]) => (
								<ProfileLine key={address} address={address} profile={profile} />
							))}
						</tbody>
					</table>
				</div>
			)}

			{errorMsg && <div className="error-message">{errorMsg}</div>}
		</div>
	);
};
