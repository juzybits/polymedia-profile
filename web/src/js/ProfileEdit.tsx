import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import { AppContext } from './App';

export const ProfileEdit: React.FC = () =>
{
    const { currentAccount, signAndExecuteTransaction } = useWalletKit();

    const { profileManager, openConnectModal } = useOutletContext<AppContext>();

    const [inputName, setInputName] = useState('');
    const [inputImage, setInputImage] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setSuiError] = useState('');

    useEffect(() => {
        document.title = 'Polymedia Profile - Edit Profile';
    }, []);

    const onSubmitEditProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitEditProfile] Attempting to create profile: ${inputName}`);
        setWaiting(true);
        try {
            const profileObjectId = await profileManager.editProfile({
                signAndExecuteTransaction,
                name: inputName,
                url: inputImage,
                description: inputDescription,
            });
            console.debug('[onSubmitEditProfile] New object ID:', profileObjectId);
        } catch(error: any) {
            setSuiError(error.message);
        }
        setWaiting(false);
    };

    return <div id='page' className='page-profile-edit'>
        <h1>EDIT PROFILE</h1>
        <form className='form' onSubmit={onSubmitEditProfile}>
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
                <input value={inputDescription} type='text' maxLength={1000}
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    onChange={e => setInputDescription(e.target.value)}
                />
            </div>
            <button type='submit'className={waiting ? 'primary waiting' : 'primary'} disabled={waiting}
                >CREATE</button>
        </form>

        { error && <div className='error'>{error}</div> }
    </div>; // end of #page
}
