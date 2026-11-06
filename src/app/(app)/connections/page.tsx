'use client';

/**
 * Connections Page
 * Shows user's connections and pending requests
 */

import { useState } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';
import ConnectionsList from '@/components/connections/ConnectionsList';
import ConnectionRequests from '@/components/connections/ConnectionRequests';
import { useRouter } from 'next/navigation';

export default function ConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Connections
          </h1>
          <p className="text-gray-600">
            Manage your connections and view pending requests
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => router.push('/connections/search')}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <Search className="w-5 h-5" />
            Find People
          </button>
          <button
            onClick={() => router.push('/listeners')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            Find Listeners
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('connections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connections'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                My Connections
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Requests
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'connections' ? (
            <ConnectionsList />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ConnectionRequests />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
