import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityPage } from './pages/IdentityPage';
import { CredentialsPage } from './pages/CredentialsPage';
import { ConsentPage } from './pages/ConsentPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ConnectedServicesPage } from './pages/ConnectedServicesPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="identity" element={<IdentityPage />} />
          <Route path="credentials" element={<CredentialsPage />} />
          <Route path="consents" element={<ConsentPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="services" element={<ConnectedServicesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
