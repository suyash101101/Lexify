import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import App from './App';
import './index.css';
import { CreditProvider } from './context/CreditContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth0Provider
          domain={import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
          authorizationParams={{
            redirect_uri: window.location.origin
          }}
        >
          <CreditProvider>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#18181B',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '400px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
                success: {
                  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                  style: {
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  },
                },
                error: {
                  icon: <XCircle className="w-5 h-5 text-red-500" />,
                  style: {
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  },
                },
                loading: {
                  icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
                  style: {
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  },
                },
              }}
            />
          </CreditProvider>
        </Auth0Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </>
);
