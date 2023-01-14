import { useEffect, useState, SyntheticEvent } from 'react';
import { ethos } from 'ethos-connect';

import { createRegistry } from '@polymedia/tools';
import '../css/RegistryNew.less';

const POLYMEDIA_PROFILE_PACKAGE = '0x36c3f157d123bf2be6a1ec3e5fe8df069436ae3f'; // TODO move to polymedia-tools

export function RegistryNew() {
    useEffect(() => {
        document.title = 'Polymedia Profile - New Registry';
    }, []);

    const [inputName, setInputName] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');

    const { status, wallet } = ethos.useWallet();

    const onSubmitCreateRegistry = (e: SyntheticEvent) => {
        e.preventDefault();
        const isConnected = status=='connected' && wallet && wallet.address;
        if (!isConnected) {
            ethos.showSignInModal();
            return;
        }
        setWaiting(true);
        console.debug(`[onSubmitCreateRegistry] Calling item::create on package: ${POLYMEDIA_PROFILE_PACKAGE}`);
        createRegistry({
            wallet: wallet,
            packageId: POLYMEDIA_PROFILE_PACKAGE,
            registryName: inputName
        })
        .then((resp: any) => {
            const effects = resp.effects || resp.EffectsCert?.effects?.effects; // Sui/Ethos || Suiet
            if (effects.status.status == 'success') {
                console.debug('[onSubmitCreateRegistry] Success:', resp);
                const newObjId = effects.created[0].reference.objectId;
                console.debug('[onSubmitCreateRegistry] New object ID:', newObjId);
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
