import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppWrap } from './js/App';
import { Home } from './js/Home';
import { ProfileEdit } from './js/ProfileEdit';
import { ProfileNew } from './js/ProfileNew';
import { RegistryNew } from './js/RegistryNew';
import { NotFound } from './js/NotFound';

ReactDOM
    .createRoot( document.getElementById('app') as Element )
    .render(
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<AppWrap />} >
                <Route index element={<Home />} />
                <Route path='registry/new' element={<RegistryNew />} />
                {/*<Route path='registry/view/:uid' element={<ProfileView />} />*/}
                <Route path='profile/new' element={<ProfileNew />} />
                {/*<Route path='profile/view/:uid' element={<ProfileView />} />*/}
                {/*<Route path='profile/edit/:uid' element={<ProfileEdit />} />*/}
                <Route path='profile/edit' element={<ProfileEdit />} />
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
