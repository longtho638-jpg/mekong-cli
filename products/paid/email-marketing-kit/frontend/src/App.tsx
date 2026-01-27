import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import CampaignList from './components/campaigns/CampaignList';
import CampaignCreate from './components/campaigns/CampaignCreate';
import SubscriberList from './components/subscribers/SubscriberList';
import TemplateList from './components/templates/TemplateList';
import DripList from './components/drips/DripList';
import DripCreate from './components/drips/DripCreate';
import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="campaigns" element={<CampaignList />} />
            <Route path="campaigns/new" element={<CampaignCreate />} />
            <Route path="subscribers" element={<SubscriberList />} />
            <Route path="templates" element={<TemplateList />} />
            <Route path="templates/new" element={<TemplateCreate />} />
            <Route path="drips" element={<DripList />} />
            <Route path="drips/new" element={<DripCreate />} />
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
