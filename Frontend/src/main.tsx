import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import {Provider} from "react-redux";
import {store} from "./Redux/Store.ts";
import {ThemeProvider} from "@mui/material";
import {muiTheme} from "./Theme/Theme.ts";
import "./Utils/i18n.ts";
import { MainLayout } from './Components/MainLayout/MainLayout.tsx';
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={muiTheme}>
          <MainLayout />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </GoogleOAuthProvider>
);