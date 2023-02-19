import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';

import { OutletContext } from './App';
import '../css/RegistryNew.less';

export function RegistryNew() {
    useEffect(() => {
        document.title = 'Polymedia Profile - New Registry';
    }, []);

    const { currentAccount, signAndExecuteTransaction } = useWalletKit();

    const { profileManager, openConnectModal } = useOutletContext<OutletContext>();

    const [inputName, setInputName] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [suiError, setSuiError] = useState('');

    const onSubmitCreateRegistry = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`);
        setWaiting(true);
        try {
            const registryObject = await profileManager.createRegistry({
                signAndExecuteTransaction,
                registryName: inputName
            });
            console.debug('[onSubmitCreateRegistry] New registry:', registryObject);
        } catch(error: any) {
            setSuiError(error.message);
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
                <button type='submit' className={waiting ? 'primary waiting' : 'primary'} disabled={waiting}
                    >CREATE</button>
            </form>

            { suiError && <div className='error'>{suiError}</div> }
        </div> {/* end of .new-content */}

    </div> {/* end of .new-wrapper */}
    </div>; // end of #page
}
