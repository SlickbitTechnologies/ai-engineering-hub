import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ShipmentProvider } from './contexts/ShipmentContext';
import { SettingsProvider } from './contexts/SettingsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ShipmentProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </ShipmentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);