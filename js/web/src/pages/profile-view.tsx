import type { PolymediaProfile } from "@polymedia/profile-sdk";
import { LinkToPolymedia } from "@polymedia/suitcase-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../app/context";
import "../styles/view-profile.less";
import toast from "react-hot-toast";

export const PageProfileView: React.FC = () => {
	/* State */

	const profileId: string = useParams().profileId || "";

	const { network, profileClient } = useAppContext();
	const [profile, setProfile] = useState<PolymediaProfile | null | undefined>(undefined);

	/* Functions */

	useEffect(() => {
		const loadProfile = async (): Promise<void> => {
			return profileClient
				.getProfileById(profileId)
				.then((profile: PolymediaProfile | null) => {
					setProfile(profile);
					if (!profile) {
						const errorString = `Profile does not exist with ID: ${profileId}`;
						console.warn("[loadProfile]", errorString);
						toast.error(errorString);
					} else {
						console.debug("[loadProfile] Viewing profile:", profile);
					}
				})
				.catch((err) => {
					setProfile(null);
					console.warn("[loadProfile]", err);
					toast.error(String(err));
				});
		};
		loadProfile();
	}, [profileId, profileClient]);

	let view: React.ReactNode;

	if (profile === undefined) {
		view = "Loading...";
	} else if (profile === null) {
		view = "Profile not found.";
	} else {
		view = (
			<div id="profile-card">
				<div className="profile-card">
					<div className="profile-owner">
						<h2>{profile.name}</h2>
						<div className="section">
							<i>{profile.description ? profile.description : "(no description)"}</i>
						</div>
						<div className="section">
							Profile:{" "}
							<LinkToPolymedia network={network} kind="object" addr={profile.id} />
						</div>
						<div className="section">
							Owner:{" "}
							<LinkToPolymedia network={network} kind="address" addr={profile.owner} />
						</div>
						<div className="section">
							Registry:{" "}
							<LinkToPolymedia
								network={network}
								kind="object"
								addr={profileClient.registryId}
							/>
						</div>
						<div className="section profile-image">
							{profile.imageUrl ? <img src={profile.imageUrl} /> : <i>(no image)</i>}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div id="page" className="page-view-profile">
			{view}
		</div>
	);
};
