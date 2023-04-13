import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import { AppContext } from './App';
import { notifyError, notifyOkay } from './components/Notification';
import '../css/ManageProfile.less';

export const ManageProfile: React.FC = () =>
{
    /* State */

    const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();

    const { network, profile, profileManager, openConnectModal, reloadProfile } = useOutletContext<AppContext>();

    // Form inputs
    const [inputName, setInputName] = useState('');
    const [inputImage, setInputImage] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    // Form errors
    const [isErrorImage, setIsErrorImage] = useState(false);
    const [isErrorForm, setIsErrorForm] = useState(false);
    // Other state
    const [waiting, setWaiting] = useState(false);

    /* Functions */

    useEffect(() => {
        document.title = 'Polymedia Profile - Manage';
    }, []);

    useEffect(() => {
        setInputName(profile?.name || '');
        setInputImage(profile?.imageUrl || '');
        setInputDescription(profile?.description || '');
    }, [profile]);

    const onInputImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) {
            setIsErrorImage(false);
            setIsErrorForm(false);
        }
        setInputImage(e.target.value);
    };
    const onImageLoad = () => {
        setIsErrorImage(false);
        setIsErrorForm(false);
    };
    const onImageError = () => {
        setIsErrorImage(true);
        setIsErrorForm(true);
        notifyError("That doesn't look like a valid image URL");
    };

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
                signAndExecuteTransactionBlock,
                name: inputName,
                imageUrl: inputImage,
                description: inputDescription,
            });
            console.debug('[onSubmitCreateProfile] New object ID:', profileObjectId);
            notifyOkay('SUCCESS');
            let newProfile;
            do {
                // Deal with RPC lag by retrying until we get the new profile
                newProfile = await reloadProfile();
            } while (!newProfile);
        } catch(error: any) {
            showError('onSubmitCreateProfile', error);
        }
        setWaiting(false);
    };

    // Deal with RPC lag by retrying until we get the updated profile
    const reloadProfileUntilUpdated = async(oldTx: string) => {
        const updatedProfile = await reloadProfile();
        if (!updatedProfile) {
            notifyError('[reloadProfileUntilUpdated] Failed to fetch the updated profile');
            setWaiting(false);
            return;
        }
        if (updatedProfile.previousTx == oldTx) { // Still not updated. Retry.
            setTimeout(reloadProfileUntilUpdated, 1500, oldTx);
            return;
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
            notifyError('[onSubmitEditProfile] Missing profile');
            return;
        }
        setWaiting(true);
        try {
            const response = await profileManager.editProfile({
                signAndExecuteTransactionBlock,
                profile: profile,
                name: inputName,
                imageUrl: inputImage,
                description: inputDescription,
            });
            console.debug('[onSubmitEditProfile] Response:', response);
            notifyOkay('SUCCESS');
            reloadProfileUntilUpdated(profile.previousTx)
        } catch(error: any) {
            showError('onSubmitEditProfile', error);
            setWaiting(false);
        }
    };

    /* HTML */

    let view: React.ReactNode;
    if (!currentAccount) {
        view = <div>
            <p>
                Connect your Sui wallet to get started.
            </p>
            <button onClick={openConnectModal}>LOG IN</button>
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
                <input value={inputImage} type='text'
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    onChange={onInputImageChange}
                />
                {isErrorImage && <div className='field-error'>That doesn't look like a valid image URL</div>}
                <div className='field-info'>Right click the image, then click 'Copy Image Address'. To use a picture from your device, upload it to a service like <a href='https://imgur.com/upload' target='_blank'>imgur.com</a>, then copy the image address.</div>
            </div>
            <div className='form-field'>
                <label>Description</label>
                <textarea value={inputDescription} maxLength={10000}
                    className={waiting ? 'waiting' : ''} disabled={waiting}
                    spellCheck='true' autoCorrect='off' autoComplete='off'
                    onChange={e => setInputDescription(e.target.value)}
                />
            </div>
            <button
                type='submit'
                disabled={waiting || isErrorForm}
                className={isErrorForm ? 'disabled' : (waiting ? 'waiting' : '')}
            >
                {profile===null ? 'CREATE PROFILE' : 'EDIT PROFILE'}
            </button>
            {isErrorForm && <div className='field-error'>Form has errors</div>}
        </form>;
    }

    const imageSection = !inputImage ? <></> :
    <div className={'section section-image '+(isErrorImage?'hidden':'')}>
        <h2>Image preview</h2>
        <img
            src={inputImage}
            onLoad={onImageLoad}
            onError={onImageError}
        />
    </div>;

    const infoSection = !profile ? <></> :
    <div className='section section-info'>
        <h2>Details</h2>
        <p>
            Profile: <a target="_blank" href={`https://explorer.sui.io/object/${profile.id}?network=${network}`}>{profile.id}</a>
        </p>
        <p>
            Registry: <a target="_blank" href={`https://explorer.sui.io/object/${profileManager.getRegistryId()}?network=${network}`}>{profileManager.getRegistryId()}</a>
        </p>
    </div>;

    return <div id='page' className='page-manage-profile'>
        <h1>{profile ? 'EDIT' : (profile===null ? 'CREATE' : 'MANAGE')} PROFILE</h1>
        {view}
        {imageSection}
        {infoSection}
    </div>;
}

const showError = (origin: string, error: any): void =>
{
    let errorString = String(error.stack || error.message || error);
    if (errorString.includes('ejected from user') || // Sui, Ethos
        errorString.includes('User rejection') || // Suiet
        errorString.includes('User Rejected the request') // Martian
    ) {
        console.debug(`[${origin}] Cancelled by the user`);
        return;
    }

    if (errorString.includes('Cannot find gas coin for signer address') || // Sui
        errorString.includes('SUI balance is insufficient to pay for') // Suiet
    ) {
        errorString = "Your wallet doesn't have enough SUI to pay for the transaction";
    }

    notifyError(errorString);
    console.warn(`[${origin}] Error: ${errorString}`);
}
