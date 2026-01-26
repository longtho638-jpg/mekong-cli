import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { SessionList } from './components/SessionList';
import { SessionPlayer } from './components/SessionPlayer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-indigo-600">SessionRecorder</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:projectId" element={<SessionList />} />
          <Route path="/sessions/:sessionId" element={<SessionPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
