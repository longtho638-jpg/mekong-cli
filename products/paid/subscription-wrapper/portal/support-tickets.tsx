import React, { useState } from 'react';
import { Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  date: string;
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'T-1023', subject: 'Installation issue on Linux', status: 'open', date: '2026-01-25' },
    { id: 'T-1021', subject: 'License key not working', status: 'closed', date: '2026-01-20' },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create Ticket Form */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
          Create New Ticket
        </h3>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
              <option>Technical Issue</option>
              <option>Billing Question</option>
              <option>Feature Request</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Describe your issue in detail..."
            ></textarea>
          </div>

          <div className="pt-4">
            <button className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
              <Send className="w-4 h-4 mr-2" />
              Submit Ticket
            </button>
          </div>
        </form>
      </div>

      {/* Ticket History */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-semibold mb-6">Recent Tickets</h3>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gray-400">{ticket.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {ticket.status.toUpperCase()}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{ticket.subject}</h4>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {ticket.date}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-6 text-sm text-purple-600 font-medium hover:underline">
          View All Tickets
        </button>
      </div>
    </div>
  );
};

export default SupportTickets;
