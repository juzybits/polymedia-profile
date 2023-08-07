import { PolymediaProfile } from '@polymedia/profile-sdk';
import '../css/ViewProfile.less';
import { AppContext } from './App';
import { useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { notifyError } from './components/Notification';
import { useEffect, useState } from 'react';
import { linkToExplorer } from '@polymedia/webutils';

export const ViewProfile: React.FC = () =>
{
    /* State */

    const profileId: string = useParams().profileId || '';

    const {
        network,
        profileManager,
    } = useOutletContext<AppContext>();

    const [profile, setProfile] = useState<PolymediaProfile|null|undefined>(undefined);

    /* Functions */

    useEffect(() => {
        document.title = 'Polymedia Profile - View';
        loadProfile();
    }, []);

    const loadProfile = async (): Promise<void> => {
        return await profileManager.fetchProfileObject({
            objectId: profileId,
        })
        .then((profile: PolymediaProfile|null) => {
            setProfile(profile);
            if (!profile) {
                const errorString = 'Profile does not exist with ID: ' + profileId;
                console.warn('[loadProfile]', errorString);
                notifyError(errorString);
            } else {
                console.debug('[loadProfile] Viewing profile:', profile);
            }
        })
        .catch((error: any) => {
            setProfile(null);
            const errorString = String(error.stack || error.message || error);
            console.warn('[loadProfile]', errorString);
            notifyError(errorString);
        })
    };

    let view: React.ReactNode;

    if (profile === undefined) {
        view = <>
            Loading...
        </>;
    }
    else if (profile === null) {
        view = <>
            Profile not found.
        </>;
    }
    else {
        view = <div id='profile-card'>
            <div className='profile-card'>
                <div className='profile-owner'>
                    <h2>{profile.name}</h2>
                    <div className='section'>
                        <i>{profile.description ? profile.description : '(no description)'}</i>
                    </div>
                    <div className='section'>
                        Profile: <a href={linkToExplorer(network, 'object', profile.id)}
                            target='_blank' rel='noopener'> {shortenAddress(profile.id)}</a>
                    </div>
                    <div className='section'>
                        Owner: <a href={linkToExplorer(network, 'address', profile.owner)}
                            target='_blank' rel='noopener'> {shortenAddress(profile.owner)}</a>
                    </div>
                    <div className='section'>
                        Registry: <a href={linkToExplorer(network, 'object', profileManager.registryId)}
                            target='_blank' rel='noopener'>{shortenAddress(profileManager.registryId)}</a>
                    </div>
                    <div className='section profile-image'>
                        {profile.imageUrl ? <img src={profile.imageUrl} /> : <i>(no image)</i>}
                    </div>
                </div>
            </div>
        </div>;
    }

    return <div id='page' className='page-view-profile'>
        {view}
    </div>;
}
function shortenAddress(address: string): string {
    return '@' + address.slice(2, 10) + '...' + address.slice(-8);
}