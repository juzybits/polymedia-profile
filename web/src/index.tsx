import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './js/App';
import { Home } from './js/Home';
import { ProfileNew } from './js/ProfileNew';
import { RegistryNew } from './js/RegistryNew';
import { NotFound } from './js/NotFound';

ReactDOM
    .createRoot( document.getElementById('app') as Element )
    .render(
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<App />} >
                <Route index element={<Home />} />
                <Route path='registry/new' element={<RegistryNew />} />
                {/*<Route path='registry/view/:uid' element={<ProfileView />} />*/}
                <Route path='profile/new' element={<ProfileNew />} />
                {/*<Route path='profile/view/:uid' element={<ProfileView />} />*/}
                {/*<Route path='profile/edit/:uid' element={<ProfileEdit />} />*/}
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
