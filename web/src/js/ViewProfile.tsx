import { PolymediaProfile } from '@polymedia/profile-sdk';
import '../css/ViewProfile.less';
import { AppContext } from './App';
import { useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { notifyError } from './components/Notification';
import { useEffect, useState } from 'react';

export const ViewProfile: React.FC = () =>
{
    /* State */

    const profileId: string = useParams().profileId || '';

    const {
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

    return <div id='page' className='page-view-profile'>
        TODO view profile
        <br/>
        <p style={{overflowWrap: 'anywhere'}}>
            {JSON.stringify(profile, null, 4)}
        </p>
    </div>;
}