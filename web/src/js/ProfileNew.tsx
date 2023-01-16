import { useEffect, useState, SyntheticEvent } from 'react';
import { ethos } from 'ethos-connect';

import { createProfile } from '@polymedia/profile-sdk';
import '../css/ProfileNew.less';

const POLYMEDIA_PROFILE_PACKAGE = '0x029a669d58113d3153811722f684dc3b7785543d'; // TODO move to polymedia-tools
const POLYMEDIA_PROFILE_REGISTRY = '0x0faaf2d1fcb02a6a3a1372d8b149929051f7a84a'; // TODO move to polymedia-tools

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

    const onSubmitCreateProfile = (e: SyntheticEvent) => {
        e.preventDefault();
        const isConnected = status=='connected' && wallet && wallet.address;
        if (!isConnected) {
            ethos.showSignInModal();
            return;
        }
        setWaiting(true);
        console.debug(`[onSubmitCreateProfile] Calling item::create on package: ${POLYMEDIA_PROFILE_PACKAGE}`);
        createProfile({
            wallet: wallet,
            packageId: POLYMEDIA_PROFILE_PACKAGE,
            registryId: POLYMEDIA_PROFILE_REGISTRY,
            name: inputName,
            image: inputImage,
            description: inputDescription,
        })
        .then((resp: any) => {
            const effects = resp.effects || resp.EffectsCert?.effects?.effects; // Sui/Ethos || Suiet
            if (effects.status.status == 'success') {
                console.debug('[onSubmitCreateProfile] Success:', resp);
                const newObjId0 = effects.created[0].reference.objectId;
                const newObjId1 = effects.created[1].reference.objectId;
                console.debug('[onSubmitCreateProfile] New object ID 0:', newObjId0);
                console.debug('[onSubmitCreateProfile] New object ID 1:', newObjId1);
            } else {
                setError(effects.status.error);
            }
        })
        .catch((error: any) => {
            setError(error.message);
        })
        .finally(() => {
            setWaiting(false);
        });
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
