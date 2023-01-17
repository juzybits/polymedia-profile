import { useEffect, useState, SyntheticEvent } from 'react';
import { ethos } from 'ethos-connect';

import { createProfile } from '@polymedia/profile-sdk';
import '../css/ProfileNew.less';

export function ProfileNew() {
    useEffect(() => {
        document.title = 'Polymedia Profile - New Profile';
    }, []);

    const [inputName, setInputName] = useState('');
    const [inputImage, setInputImage] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');

    const { status, wallet } = ethos.useWallet();

    const onSubmitCreateProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        const isConnected = status=='connected' && wallet && wallet.address;
        if (!isConnected) {
            ethos.showSignInModal();
            return;
        }
        setWaiting(true);
        console.debug(`[onSubmitCreateProfile] Attempting to create profile: ${inputName}`);
        const result = await createProfile({
            wallet: wallet,
            name: inputName,
            image: inputImage,
            description: inputDescription,
        });
        if (typeof result == 'string') {
            setError(result);
        } else { // Array<OwnedObjectRef>
            console.debug('[onSubmitCreateProfile] New object ID 0:', result[0].reference.objectId);
            console.debug('[onSubmitCreateProfile] New object ID 1:', result[1].reference.objectId);
        }
        setWaiting(false);
    };

    return <div id='page' className='page-profile-new'>
    <div className='new-wrapper'>

        <div className='new-content'>

            <h1>NEW PROFILE</h1>
            <form className='form' onSubmit={onSubmitCreateProfile}>
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
        </div> {/* end of .new-content */}

    </div> {/* end of .new-wrapper */}
    </div>; // end of #page
}
