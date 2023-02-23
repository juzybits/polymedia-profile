import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import { AppContext } from './App';

export const ProfileEdit: React.FC = () =>
{
    /* State */

    const { currentAccount, signAndExecuteTransaction } = useWalletKit();

    const { profile, profileManager, openConnectModal, reloadProfile } = useOutletContext<AppContext>();

    const [inputName, setInputName] = useState('');
    const [inputImage, setInputImage] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [mainError, setMainError] = useState('');

    /* Functions */

    useEffect(() => {
        document.title = 'Polymedia Profile - Edit Profile';
    }, []);

    useEffect(() => {
        if (profile) {
            setInputName(profile.name);
            setInputImage(profile.url);
            setInputDescription(profile.description);
        }
    }, [profile]);

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
            <button onClick={openConnectModal}>CONNECT WALLET</button>
        </div>;
    }
    else if (profile === undefined) {
        view = <div>
            Loading...
        </div>;
    }
    else if (profile === null) {
        view = <div>
            You don't have a profile. Do you want to create it?
            <br/>
            <br/>
            <button onClick={openConnectModal}>CREATE PROFILE</button>
        </div>;
    }
    else {
        view = <form className='form' onSubmit={onSubmitEditProfile}>
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
            <button type='submit'className={waiting ? 'waiting' : ''} disabled={waiting}
                >UPDATE</button>
        </form>;
    }

    return <div id='page' className='page-profile-edit'>
        <h1>EDIT PROFILE</h1>
        {view}
        { mainError && <div className='error'>{mainError}</div> }
    </div>; // end of #page
}
