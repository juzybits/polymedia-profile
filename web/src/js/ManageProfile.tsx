import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import { AppContext } from './App';
import '../css/ManageProfile.less';

export const ManageProfile: React.FC = () =>
{
    /* State */

    const { currentAccount, signAndExecuteTransaction } = useWalletKit();

    const { network, profile, profileManager, openConnectModal, reloadProfile } = useOutletContext<AppContext>();

    const [inputName, setInputName] = useState('');
    const [inputImage, setInputImage] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [mainError, setMainError] = useState('');

    /* Functions */

    useEffect(() => {
        document.title = 'Polymedia Profile - Manage';
    }, []);

    useEffect(() => {
        if (profile) {
            setInputName(profile.name);
            setInputImage(profile.url);
            setInputDescription(profile.description);
        } else {
            setInputName('');
            setInputImage('');
            setInputDescription('');
        }
    }, [profile]);

    const onSubmitCreateProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitCreateProfile] Attempting to create profile: ${inputName}`);
        setWaiting(true);
        try {
            const profileObjectId = await profileManager.createProfile({
                // @ts-ignore
                signAndExecuteTransaction,
                name: inputName,
                url: inputImage,
                description: inputDescription,
            });
            console.debug('[onSubmitCreateProfile] New object ID:', profileObjectId);
        } catch(error: any) {
            setMainError(error.message);
        }
        setWaiting(false);
    };

    const onSubmitEditProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        if (!profile) {
            setMainError('[onSubmitEditProfile] Missing profile');
            return;
        }
        setWaiting(true);
        try {
            const profileObjectId = await profileManager.editProfile({
                // @ts-ignore
                signAndExecuteTransaction,
                profile: profile,
                name: inputName,
                url: inputImage,
                description: inputDescription,
            });
            console.debug('[onSubmitEditProfile] Result:', profileObjectId);
            reloadProfile();
        } catch(error: any) {
            const errorString = String(error.stack || error.message || error);
            setMainError(errorString);
            console.warn('[onSubmitEditProfile] Error:', errorString);
        }
        setWaiting(false);
    };

    /* HTML */

    let view: React.ReactNode;
    if (!currentAccount) {
        view = <div>
            <p>
                Connect your Sui wallet to get started.
            </p>
            <button onClick={openConnectModal}>CONNECT</button>
        </div>;
    }
    else if (profile === undefined) {
        view = <div>
            Loading...
        </div>;
    }
    else {
        view = <form className='form' onSubmit={profile===null ? onSubmitCreateProfile : onSubmitEditProfile}>
            <div className='form-field'>
                <label>Name</label>
                <input value={inputName} type='text' required maxLength={60}
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    onChange={e => setInputName(e.target.value)}
                />
            </div>
            <div className='form-field'>
                <label>Image URL</label>
                <input value={inputImage} type='text' maxLength={1000}
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    onChange={e => setInputImage(e.target.value)}
                />
            </div>
            <div className='form-field'>
                <label>Description</label>
                <textarea value={inputDescription} maxLength={1000}
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='true' autoCorrect='off' autoComplete='off'
                    onChange={e => setInputDescription(e.target.value)}
                />
            </div>
            <button type='submit' className={waiting ? 'waiting' : ''} disabled={waiting}>
                {profile===null ? 'CREATE' : 'UPDATE'}
            </button>
        </form>;
    }

    const infoSection = !profile ? <></> :
    <div className='section section-info'>
        <h2>Details</h2>
        <p>
            Profile ID: <a target="_blank" href={`https://explorer.sui.io/object/${profile.id}?network=${network}`}>{profile.id}</a>
        </p>
        <p>
        Registry ID: <a target="_blank" href={`https://explorer.sui.io/object/${profileManager.getRegistryId()}?network=${network}`}>{profileManager.getRegistryId()}</a>
        </p>
    </div>;

    const imageSection = (!profile || !profile.url) ? <></> :
    <div className='section section-image'>
        <h2>Image preview</h2>
        <img src={inputImage} />
    </div>;

    return <div id='page' className='page-manage-profile'>
        <h1>{profile ? 'EDIT' : (profile===null ? 'CREATE' : 'MANAGE')} PROFILE</h1>
        {view}
        {infoSection}
        {imageSection}
        { mainError && <div className='error'>{mainError}</div> }
    </div>;
}
