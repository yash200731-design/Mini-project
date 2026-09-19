'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  ArrowRight, 
  MessageSquare, 
  HelpCircle,
  GraduationCap,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { Project } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setCreating(true);
      const newProj = await api.createProject(projectName.trim(), projectDesc.trim());
      setProjects([newProj, ...projects]);
      setProjectName('');
      setProjectDesc('');
      setShowCreateModal(false);
      router.push(`/projects/${newProj.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"? All documents and chunks will be removed.`)) return;

    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const totalProjects = projects.length;
  const totalDocs = projects.reduce((acc, p) => acc + (p.document_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900">ProjectMentor <span className="text-blue-600">AI</span></span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">Manage your academic projects, knowledge bases, and AI mentorship sessions.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md self-start md:self-auto shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Backend Server Connection Notice</p>
              <p className="mt-1 text-amber-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{totalProjects}</div>
              <div className="text-xs font-medium text-slate-500">Total Projects</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{totalDocs}</div>
              <div className="text-xs font-medium text-slate-500">Total Documents</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{totalDocs}</div>
              <div className="text-xs font-medium text-slate-500">Documents Ready</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">Active</div>
              <div className="text-xs font-medium text-slate-500">RAG Vector Status</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">New Project</div>
                <div className="text-xs text-slate-500">Create workspace</div>
              </div>
            </button>

            {projects.length > 0 ? (
              <Link
                href={`/projects/${projects[0].id}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Upload Doc</div>
                  <div className="text-xs text-slate-500">Add PDF or DOCX</div>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 opacity-60 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Upload Doc</div>
                  <div className="text-xs text-slate-500">Create project first</div>
                </div>
              </button>
            )}

            {projects.length > 0 ? (
              <Link
                href={`/projects/${projects[0].id}?tab=chat`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Ask AI Mentor</div>
                  <div className="text-xs text-slate-500">Context RAG Chat</div>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 opacity-60 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Ask AI Mentor</div>
                  <div className="text-xs text-slate-500">Create project first</div>
                </div>
              </button>
            )}

            {projects.length > 0 ? (
              <Link
                href={`/projects/${projects[0].id}?tab=viva`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Generate Viva</div>
                  <div className="text-xs text-slate-500">Practice questions</div>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 opacity-60 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Generate Viva</div>
                  <div className="text-xs text-slate-500">Create project first</div>
                </div>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Your Projects</h2>
            <span className="text-xs font-semibold text-slate-500">{projects.length} Total</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Projects Yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1 mb-6">
                Create a project to upload documentation, run RAG queries, generate viva questions, and analyze requirements.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                      {proj.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-6">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        {proj.document_count || 0} Docs
                      </span>
                      <span>Created {new Date(proj.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Create New Project</h2>
            <p className="text-slate-500 text-xs mb-5">Set up a dedicated project workspace for your documents and AI mentor.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Healthcare Diagnostic System"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Final year B.Tech thesis on AI medical imaging using Deep Learning..."
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !projectName.trim()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Creating...' : 'Create Workspace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
