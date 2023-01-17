import { useEffect, useState, SyntheticEvent } from 'react';
import { ethos } from 'ethos-connect';

import { createRegistry } from '@polymedia/profile-sdk';
import '../css/RegistryNew.less';

export function RegistryNew() {
    useEffect(() => {
        document.title = 'Polymedia Profile - New Registry';
    }, []);

    const [inputName, setInputName] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');

    const { status, wallet } = ethos.useWallet();

    const onSubmitCreateRegistry = async (e: SyntheticEvent) => {
        e.preventDefault();
        const isConnected = status=='connected' && wallet && wallet.address;
        if (!isConnected) {
            ethos.showSignInModal();
            return;
        }
        setWaiting(true);
        console.debug(`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`);
        const result = await createRegistry({
            wallet: wallet,
            registryName: inputName
        });
        if (typeof result == 'string') {
            setError(result);
        } else { // OwnedObjectRef
            const newObjId = result.reference.objectId;
            console.debug('[onSubmitCreateRegistry] New object ID:', newObjId);
        }
        setWaiting(false);
    };

    return <div id='page' className='page-registry-new'>
    <div className='new-wrapper'>

        <div className='new-content'>

            <h1>NEW REGISTRY</h1>
            <form className='form' onSubmit={onSubmitCreateRegistry}>
                <div className='form-field'>
                    <label>Name</label>
                    <input value={inputName} type='text' required maxLength={60}
                        className={waiting ? 'waiting' : ''} disabled={waiting}
                        spellCheck='false' autoCorrect='off' autoComplete='off'
                        onChange={e => setInputName(e.target.value)}
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
