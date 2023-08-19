import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { linkToExplorer } from '@polymedia/webutils';
import { PolymediaProfile } from '@polymedia/profile-sdk';

import { AppContext } from './App';
import '../css/SearchProfiles.less';

import { ADDRESS_REGEX, makeCssUrl } from '@polymedia/webutils';
const addressRegex = new RegExp(ADDRESS_REGEX, 'g');

export const SearchProfiles: React.FC = () =>
{
    /* State */

    const {
        network,
        profileManager,
    } = useOutletContext<AppContext>();

    const [userInput, setUserInput] = useState<string>('');
    const [addressCount, setAddressCount] = useState<number>(0);
    const [results, setResults] = useState<Map<string, PolymediaProfile | null>|undefined>(undefined);
    const [errorMsg, setErrorMsg] = useState<string|null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /* Functions */

    useEffect(() => {
        document.title = 'Polymedia Profile - Search';

        /* A little hack to preload the top-25 addresses in the Ethos 8192 Daily Contest.
         * To generate `top25addresses` from the "All-Time Leaderboard":
         * 1) Go to https://sui8192.ethoswallet.xyz and click "Leaderboard"
         * 2) Run this snippet:
            (function printUserAddresses() {
                // Select all elements with class 'leaderboard-name'
                const leaderboardElements = document.querySelectorAll('.leaderboard-name');

                // Gather the titles into an array
                const titles = Array.from(leaderboardElements).map(element => {
                const innerDiv = element.querySelector('div[title]');
                return innerDiv ? innerDiv.getAttribute('title') : null;
                }).filter(Boolean); // Remove any null values

                // Output the addresses as a space-separated string
                console.log(titles.join(' '));
            })();
        */
        const loadEthosMode = () => {
            // Read 'mode' URL parameter
            const params = new URLSearchParams(window.location.search);
            const mode = params.get('mode');
            if (mode !== 'ethos') {
                return;
            }
            const top25addresses = '0x794045b6612941b36f67df2d416bea477743e3ab5ecf1f50a2d5157523ea5721 0x729677c525abf36db8eda825f980075b4dfe668b410a69d9440f84091dd60197 0xb70abb9a890a4ce9fe3b54f0b2071d547a20d4409a1d248ae1911e1c2a6c3983 0xcd74e872b56672aab2dc705b2ac7c7c6b72c6f62f5ed263bca3beaf4d7ec9f8c 0x87584b9d630645f963b2ee230d7c88a9b8759c3d55ade8a89574bc5a42caac7f 0x6ac3d1face9c875847b1c34173cd41d2e67c253eb96bf4d42c70f04d49ddaeaf 0x0a943b47abd1a90ae9bd4b56b6249acedb9f2f33fc751155be1d4861ce342874 0x7e67bd005c4a2662f3e9e093c0abd2b16430a9f59295141e3b57b408e6a49fdd 0x6291b430be2f5e10253885ed4529d13ff8e1957783e2725dbf74d665b80d4166 0x2fbcd3d22a6c10d5903e83c3624ddb8b14a0b526a74ff9d531129840f28e4adc 0x15731f7eff34015aff2947984c67435acd70d5634adf2c42445d6deadf51a72e 0x794045b6612941b36f67df2d416bea477743e3ab5ecf1f50a2d5157523ea5721 0x61d23a18ab39971f7e236be90faecd8045b4c9dec2c9e268a7388fc94a8a8eb9 0xa1d1960b0c4fd44fb46d12c44f109f1b0ad744162984fb1ce4cee1fd9a8575ef 0xd00711153d638c1a6a79ec05e5623fcdfe9a8c388114ee1a4f80290b0b57c522 0xf0cdaa4c3201fa9da1f1b10a74b570d949172953555c9509446a46f8c8ec2881 0x519433a867baa951adaf6319d975f66d13c954f5354ff54b59309a2ac7206f25 0x729677c525abf36db8eda825f980075b4dfe668b410a69d9440f84091dd60197 0x531d1426df8ebd6b13de472c7b5e29c4f059bfcc3d631ccd8cc44869f79126c2 0x87584b9d630645f963b2ee230d7c88a9b8759c3d55ade8a89574bc5a42caac7f 0x419f4f4666e42f71892d77951b1f7b2f0b35cdd79ca3f40affd34bf1ebcbedea 0x729677c525abf36db8eda825f980075b4dfe668b410a69d9440f84091dd60197 0x3f18caabc6aa4b55a5b0a35d12c1260ca6a428fdd607a0e2d34d85bbcd18848a 0x2e8d0881dcd742f7bcc28094d2ef7a54e5abe1c3c517872a86fd9e0ad5c4c6cd 0xe924a38c3c3788987116011ece038b1e9931a67b00e94bbff2de8c205574ecc1';
            setUserInput(top25addresses);
        };
        loadEthosMode();
    }, []);

    useEffect(() => {
        const loadProfiles = async () => {
            setErrorMsg(null);
            setResults(undefined);
            const addresses = userInput.match(addressRegex) || [];
            setAddressCount(addresses.length);
            if (addresses.length === 0) {
                return;
            }
            setIsLoading(true);
            try {
                const profiles = await profileManager.getProfilesByOwner({lookupAddresses: addresses});
                setResults(profiles);
            } catch(error) {
                const errorString = logError('loadProfiles', error);
                setErrorMsg(errorString);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfiles();
    }, [userInput]);

    const onUserInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const addressesString = e.target.value;
        setUserInput(addressesString)
    };

    /* HTML */

    const ProfileLine: React.FC<{
        address: string,
        profile: PolymediaProfile | null,
    }> = ({
        address,
        profile,
    }) => {
        const hasPfp = profile && profile.imageUrl.length > 0;
        const pfpStyle = !hasPfp
            ? { opacity: 0.7 }
            : { backgroundImage: makeCssUrl(profile.imageUrl) };
        return (
            <tr className='profile-line'>
                <td className='td-owner'>
                    <a
                        href={linkToExplorer(network, 'address', address)}
                        target='_blank' rel='noopener'>{shortenAddress(address)}
                    </a>
                </td>
                <td className='td-profile'>
                {
                    !profile
                    ? <span className='no-profile'>no profile</span>
                    : <Link to={'/view/'+profile.id}>
                        <div className='profile-img-wrap'>
                            <span className='profile-img' style={pfpStyle} />
                        </div>
                        <span className='profile-name'>
                            {profile.name}
                        </span>
                    </Link>
                }
                </td>
            </tr>
        );
    }

    return <div id='page' className='page-search-profiles'>
        <h1>Search profiles</h1>

        <p>
            Enter one or more Sui addresses to fetch their profiles.
        </p>

        <form className='form'>
        <div className='form-field'>
            <textarea
                value={userInput}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                onChange={onUserInputChange}
            />
            <div>
                {addressCount} address{addressCount !== 1 && 'es'}
            </div>
        </div>
            {isLoading && <div className='search-loading'>Loading...</div>}
        </form>

        {results &&
        <div className='search-results'>
            <table>
                <thead>
                    <tr>
                        <th>Owner</th>
                        <th>Profile</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from(results.entries()).map(([address, profile]) => (
                        <ProfileLine key={address} address={address} profile={profile} />
                    ))}
                </tbody>
            </table>
        </div>}

        {errorMsg && <div className='error-message'>{errorMsg}</div>}
    </div>;
}

function shortenAddress(address: string): string {
    return '@' + address.slice(2, 6) + '..' + address.slice(-4);
}

const logError = (origin: string, error: any): string => // TODO: move to @polymedia/webutils
{
    let errorString = String(error.stack || error.message || error);
    console.warn(`[${origin}] ${errorString}`);
    return errorString;
}