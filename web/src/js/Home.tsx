import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/Home.less';
import imgLogo from '../img/logo.png';

export function Home(props: any) {
    useEffect(() => {
        document.title = 'Polymedia Accounts';
    }, []);

    return <div id='page' className='page-home'>
        HOME
    </div>;
}
