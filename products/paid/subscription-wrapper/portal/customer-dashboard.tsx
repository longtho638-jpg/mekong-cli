import React, { useState } from 'react';
import { Layout, Menu, Bell, User, LogOut } from 'lucide-react';
import SubscriptionManager from './subscription-manager';
import SupportTickets from './support-tickets';

// MD3 Colors (Approximation)
const COLORS = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  surface: '#F3F3FA',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
};

const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscription' | 'support'>('subscription');

  return (
    <div className="flex h-screen bg-gray-50 font-sans" style={{ backgroundColor: COLORS.surface, color: COLORS.onSurface }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary" style={{ color: COLORS.primary }}>Mekong Portal</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`w-full flex items-center px-4 py-3 rounded-full transition-colors ${activeTab === 'subscription' ? 'bg-purple-100 text-purple-900 font-medium' : 'hover:bg-gray-100'}`}
          >
            <Layout className="w-5 h-5 mr-3" />
            Subscription
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center px-4 py-3 rounded-full transition-colors ${activeTab === 'support' ? 'bg-purple-100 text-purple-900 font-medium' : 'hover:bg-gray-100'}`}
          >
            <User className="w-5 h-5 mr-3" />
            Support
          </button>
        </nav>
        <div className="p-4 border-t">
          <button className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
              MK
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'subscription' ? <SubscriptionManager /> : <SupportTickets />}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
