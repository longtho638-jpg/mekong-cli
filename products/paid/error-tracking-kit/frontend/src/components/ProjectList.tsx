import React, { useState, useEffect } from 'react';
import type { Project } from '../types';
import { getProjects, createProject } from '../api';
import { Plus, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject(newProjectName);
      setNewProjectName('');
      setIsCreating(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading projects...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-indigo-600" />
          Projects
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Create New Project</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name (e.g. My SaaS App)"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              autoFocus
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-500 mt-1">ID: {project.id}</p>
              </div>
              <ArrowRight className="text-gray-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-mono break-all">
                DSN: {project.api_key}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No projects yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};
