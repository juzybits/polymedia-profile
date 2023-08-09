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