import { useEffect, useState, SyntheticEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWalletKit } from '@mysten/wallet-kit';
import { ProfileManager } from '@polymedia/profile-sdk';

import '../css/RegistryNew.less';

export function RegistryNew() {
    useEffect(() => {
        document.title = 'Polymedia Profile - New Registry';
    }, []);

    const { currentAccount, signAndExecuteTransaction } = useWalletKit();

    const [profileManager, openConnectModal]: any = useOutletContext();

    const [inputName, setInputName] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');


    const onSubmitCreateRegistry = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            openConnectModal();
            return;
        }
        console.debug(`[onSubmitCreateRegistry] Attempting to create registry with name: ${inputName}`);
        setWaiting(true);
        try {
            const registryObject = await (profileManager as ProfileManager).createRegistry({
                signAndExecuteTransaction,
                registryName: inputName
            });
            console.debug('[onSubmitCreateRegistry] New registry:', registryObject);
        } catch(error: any) {
            setError(error.message);
        }
        setWaiting(false);
    };

    const devFun = async () => {
        // const resp = await getProfileObjects({ objectIds: [
            // '0x02952db874daab29b12cf0fbf1baade3e0195382',
            // '0x2e9684c3fedd4a7447ff5282910946a506a0259f',
            // '0x0e5ebc6d9fa2d69ece881a06e735a223120e9ab8',
            // '0x0e5ebc6d9fa2d69ece881a06e735a223120e9000',
        //     '0xd0b748ef385265fba6d19124edd7dd51043f243e',
        // ]});
        // console.log(resp);
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

            { error && <div className='error'>{error}</div> }
        </div> {/* end of .new-content */}
        <button onClick={devFun}>dev fun</button>

    </div> {/* end of .new-wrapper */}
    </div>; // end of #page
}
