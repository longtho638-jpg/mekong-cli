import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutShell } from './components/layout-shell';
import { DashboardPage } from './pages/dashboard-page';
import { BacktestsPage } from './pages/backtests-page';
import { MarketplacePage } from './pages/marketplace-page';
import { SettingsPage } from './pages/settings-page';
import { ReportingPage } from './pages/reporting-page';
import { LicensePage } from './pages/license-page';
import { Phase2Page } from './pages/phase2-page';
import { Phase3Page } from './pages/phase3-page';
import { Phase9Page } from './pages/phase9-page';
import { Phase10Page } from './pages/phase10-page';
import { Phase11Page } from './pages/phase11-page';

export function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/backtests" element={<BacktestsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/licenses" element={<LicensePage />} />
        <Route path="/admin/licenses" element={<LicensePage />} />
        <Route path="/phase2" element={<Phase2Page />} />
        <Route path="/phase3" element={<Phase3Page />} />
        <Route path="/phase9" element={<Phase9Page />} />
        <Route path="/phase10" element={<Phase10Page />} />
        <Route path="/phase11" element={<Phase11Page />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LayoutShell>
  );
}
