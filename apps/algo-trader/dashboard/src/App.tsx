import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutShell } from './components/layout-shell';
import { DashboardPage } from './pages/dashboard-page';
import { BacktestsPage } from './pages/backtests-page';
import { MarketplacePage } from './pages/marketplace-page';
import { SettingsPage } from './pages/settings-page';
import { ReportingPage } from './pages/reporting-page';

export function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/backtests" element={<BacktestsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LayoutShell>
  );
}
