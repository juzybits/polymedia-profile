/*
   _____   ____  _  __     ____  __ ______ _____ _____    __
  |  __ \ / __ \| | \ \   / /  \/  |  ____|  __ \_   _|  /  \
  | |__) | |  | | |  \ \_/ /| \  / | |__  | |  | || |   /    \
  |  ___/| |  | | |   \   / | |\/| |  __| | |  | || |  /  /\  \
  | |    | |__| | |____| |  | |  | | |____| |__| || |_/  ____  \
  |_|___  \____/|______|_|__|_|__|_|______|_____/_______/    \__\
  |  __ \|  __ \ / __ \|  ____|_   _| |    |  ____|
  | |__) | |__) | |  | | |__    | | | |    | |__
  |  ___/|  _  /| |  | |  __|   | | | |    |  __|
  | |    | | \ \| |__| | |     _| |_| |____| |____
  |_|    |_|  \_\\____/|_|    |_____|______|______|  by @juzybits

*/

import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppWrap } from './js/App';
import { Home } from './js/Home';
import { Docs } from './js/Docs';
import { ManageProfile } from './js/ManageProfile';
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
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
