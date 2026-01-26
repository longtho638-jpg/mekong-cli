import { useState, useEffect } from 'react';
import { FlagList } from './components/FlagList';
import { FlagEditor } from './components/FlagEditor';
import { getFlags, createFlag, updateFlag, deleteFlag } from './api';
import type { FeatureFlag, FeatureFlagCreate } from './types';
import { Flag } from 'lucide-react';

function App() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      const data = await getFlags();
      setFlags(data);
      setError(null);
    } catch (err) {
      setError('Failed to load flags. Is the backend running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleSave = async (data: FeatureFlagCreate) => {
    try {
      if (editingFlag) {
        await updateFlag(editingFlag.key, data);
      } else {
        await createFlag(data);
      }
      await fetchFlags();
      setEditingFlag(null);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      throw err; // Re-throw to be handled by the form
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteFlag(key);
      await fetchFlags();
    } catch (err) {
      alert('Failed to delete flag');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Flag className="text-white h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Feature Flags
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isCreating || editingFlag ? (
            <div className="max-w-3xl mx-auto">
              <FlagEditor
                initialData={editingFlag || undefined}
                onSave={handleSave}
                onCancel={() => {
                  setEditingFlag(null);
                  setIsCreating(false);
                }}
              />
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <FlagList
                  flags={flags}
                  onCreate={() => setIsCreating(true)}
                  onEdit={(flag) => setEditingFlag(flag)}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
