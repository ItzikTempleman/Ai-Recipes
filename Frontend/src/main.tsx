import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import {Provider} from "react-redux";
import {store} from "./Redux/Store.ts";
import {ThemeProvider} from "@mui/material";
import {muiTheme} from "./Theme/Theme.ts";
import "./Utils/i18n.ts";
import { MainLayout } from './Components/MainLayout/MainLayout.tsx';

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <BrowserRouter>
            <ThemeProvider theme={muiTheme}>
            <MainLayout/>
            </ThemeProvider>
        </BrowserRouter>
    </Provider>
)
