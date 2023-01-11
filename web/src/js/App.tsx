import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { EthosConnectProvider } from 'ethos-connect';
import imgLogo from '../img/logo.png';

export function App(props: any)
{
    return <EthosConnectProvider
        ethosConfiguration={{hideEmailSignIn: true}}
        dappName='Polymedia Accounts'
        dappIcon={<img src={imgLogo} alt='Polymedia logo' />}
        connectMessage='Polymedia Accounts'
        >
        <Outlet context={[]} />
    </EthosConnectProvider>;
}
