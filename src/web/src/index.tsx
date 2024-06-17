/*
  ___  ___  _ __   ____  __ ___ ___ ___   _
 | _ \/ _ \| |\ \ / /  \/  | __|   \_ _| /_\
 |  _/ (_) | |_\ V /| |\/| | _|| |) | | / _ \
 |_|_ \___/|____|_| |_| _|_|___|___/___/_/ \_\
 | _ \ _ \/ _ \| __|_ _| |  | __|
 |  _/   / (_) | _| | || |__| _|
 |_| |_|_\\___/|_| |___|____|___| by @juzybits

*/

import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppWrap } from './js/App';
import { Home } from './js/Home';
import { Docs } from './js/Docs';
import { ManageProfile } from './js/ManageProfile';
import { SearchProfiles } from './js/SearchProfiles';
import { ViewProfile } from './js/ViewProfile';
import { RegistryNew } from './js/RegistryNew';
import { NotFound } from './js/NotFound';

ReactDOM
    .createRoot( document.getElementById('app') as Element )
    .render(
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<AppWrap />} >
                <Route index element={<Home />} />
                <Route path='manage' element={<ManageProfile />} />
                <Route path='docs' element={<Docs />} />
                <Route path='registry/new' element={<RegistryNew />} />
                <Route path='search' element={<SearchProfiles />} />
                <Route path='view/:profileId' element={<ViewProfile />} />
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
