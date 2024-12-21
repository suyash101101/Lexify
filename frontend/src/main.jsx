import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));

root.render(

    <BrowserRouter>
      
        <CssBaseline />
        <App />

    </BrowserRouter>

);
