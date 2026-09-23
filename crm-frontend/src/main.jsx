import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { RoleProvider } from './context/RoleContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import { PresenceProvider } from './context/PresenceContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <PresenceProvider>
              <RoleProvider>
                <UIProvider>
                  <App />
                </UIProvider>
              </RoleProvider>
            </PresenceProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);