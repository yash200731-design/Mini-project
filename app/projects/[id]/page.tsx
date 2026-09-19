'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  GraduationCap,
  ArrowLeft,
  FileText,
  Upload,
  MessageSquare,
  HelpCircle,
  Layers,
  BookOpen,
  Trash2,
  Send,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  BookMarked
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../../lib/api';
import {
  Project,
  DocumentItem,
  ChatMessage,
  VivaQuestion,
  RequirementAnalysis,
  DocumentReview
} from '../../../types';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;

  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const [vivaDifficulty, setVivaDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [vivaCount, setVivaCount] = useState<number>(10);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [vivaLoading, setVivaLoading] = useState(false);

  const [requirementsData, setRequirementsData] = useState<RequirementAnalysis | null>(null);
  const [reqLoading, setReqLoading] = useState(false);

  const [selectedReviewDocId, setSelectedReviewDocId] = useState<string>('');
  const [reviewData, setReviewData] = useState<DocumentReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [proj, docs] = await Promise.all([
        api.getProject(projectId),
        api.getDocuments(projectId)
      ]);
      setProject(proj);
      setDocuments(docs);
      if (docs.length > 0 && !selectedReviewDocId) {
        setSelectedReviewDocId(docs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setUploading(true);
      setUploadError(null);
      const res = await api.uploadDocument(projectId, file);
      setDocuments([res.document, ...documents]);
      if (!selectedReviewDocId) setSelectedReviewDocId(res.document.id);
    } catch (err: any) {
      setUploadError(err.message || 'Document upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete '${filename}'?`)) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleSendQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setChatLoading(true);

    try {
      const res = await api.sendChatMessage(projectId, q);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ **Error**: ${err.message || 'Failed to generate response. Please check server connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateViva = async () => {
    try {
      setVivaLoading(true);
      const res = await api.generateViva(projectId, vivaDifficulty, vivaCount);
      setVivaQuestions(res.questions);
    } catch (err: any) {
      alert(err.message || 'Failed to generate viva questions');
    } finally {
      setVivaLoading(false);
    }
  };

  const handleAnalyzeRequirements = async () => {
    try {
      setReqLoading(true);
      const res = await api.analyzeRequirements(projectId);
      setRequirementsData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to analyze requirements');
    } finally {
      setReqLoading(false);
    }
  };

  const handleReviewDocument = async () => {
    if (!selectedReviewDocId) return;
    try {
      setReviewLoading(true);
      const res = await api.reviewDocument(projectId, selectedReviewDocId);
      setReviewData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to review document');
    } finally {
      setReviewLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading Project Workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'Project does not exist or was deleted.'}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1">{project.name}</h1>
              <p className="text-xs text-slate-500">{documents.length} Documents uploaded</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('chat'); setInputQuestion('Summarize the methodology of this project.'); }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Quick Summary</span>
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: BookMarked },
            { id: 'documents', label: 'Documents', icon: FileText, badge: documents.length },
            { id: 'chat', label: 'AI Chat', icon: MessageSquare },
            { id: 'viva', label: 'Viva Generator', icon: HelpCircle },
            { id: 'requirements', label: 'Requirements', icon: Layers },
            { id: 'review', label: 'Document Review', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{project.name}</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {project.description || 'No detailed project description provided yet. Upload documents to automatically index project requirements and research scope.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{documents.length}</div>
                    <div className="text-xs text-slate-500">Knowledge Base Files</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">RAG Ready</div>
                    <div className="text-xs text-slate-500">Vector Status</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">pgvector</div>
                    <div className="text-xs text-slate-500">Retrieval Engine</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <button
                onClick={() => setActiveTab('documents')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Upload Documents</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Add PDF proposals, DOCX specs, reports, or text files.</p>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">AI Project Mentor</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Ask questions grounded strictly in your project files.</p>
              </button>

              <button
                onClick={() => setActiveTab('viva')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Viva Prep</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Generate exam viva questions and expected points.</p>
              </button>

              <button
                onClick={() => setActiveTab('requirements')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Requirements</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Extract functional specs, missing info, and technical risks.</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Upload Project Documents</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Supported formats: PDF, DOCX, TXT, MD (Max 25MB). Page numbers and headings are automatically indexed.
              </p>

              <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-sm">
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? 'Processing & Vectorizing...' : 'Select File to Upload'}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium max-w-md mx-auto">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Uploaded Knowledge Base ({documents.length})</h3>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No documents uploaded yet. Upload project documents above to enable AI RAG chat.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 line-clamp-1">{doc.filename}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            <span>Type: {doc.file_type}</span>
                            <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                            {doc.chunk_count !== undefined && (
                              <span className="text-slate-600 font-medium">{doc.chunk_count} Chunks</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          doc.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {doc.status}
                        </span>

                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-slate-200 h-[calc(100vh-14rem)] min-h-[500px] flex flex-col overflow-hidden shadow-xs">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto py-12">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Ask Your Project AI Mentor</h3>
                  <p className="text-slate-500 text-xs mt-1 mb-6 leading-relaxed">
                    Ask questions about methodology, architecture, tech stack, or dataset. Answers are grounded in your uploaded project documents.
                  </p>

                  <div className="w-full space-y-2">
                    {[
                      "What is the main problem statement solved by this project?",
                      "What methodology or algorithm is used in the implementation?",
                      "List the database schema or data structures mentioned.",
                      "What are the limitations or future scope of this project?"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setInputQuestion(suggestion); }}
                        className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs text-slate-700 font-medium transition-all"
                      >
                        "{suggestion}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-700">
                        {msg.sender === 'user' ? 'You' : 'ProjectMentor AI'}
                      </span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-3xl rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                          : 'bg-slate-100/80 border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.sender === 'ai' ? (
                        <div className="prose prose-sm max-w-none text-slate-800">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div>{msg.text}</div>
                      )}

                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 max-w-3xl w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sources ({msg.sources.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                              <div className="font-semibold text-slate-800 line-clamp-1">{src.filename}</div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                                <span>Page {src.page_number}</span>
                                <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">
                                  {Math.round(src.similarity * 100)}% match
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex items-center gap-3 p-4 bg-slate-100 rounded-2xl max-w-md text-slate-600 text-xs font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Searching project vector embeddings & retrieving context...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendQuestion} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask something about your project..."
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputQuestion.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'viva' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Project Viva Voce Practice</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generate realistic external examiner questions grounded in your project knowledge base.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Difficulty</label>
                  <select
                    value={vivaDifficulty}
                    onChange={e => setVivaDifficulty(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Questions</label>
                  <select
                    value={vivaCount}
                    onChange={e => setVivaCount(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateViva}
                  disabled={vivaLoading}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all mt-auto disabled:opacity-50"
                >
                  {vivaLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{vivaLoading ? 'Generating...' : 'Generate Questions'}</span>
                </button>
              </div>
            </div>

            {vivaLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : vivaQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <HelpCircle className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Ready to Practice for Viva</h3>
                <p className="text-slate-500 text-xs mt-1 mb-5">Click 'Generate Questions' above to extract examiner viva questions.</p>
                <button
                  onClick={handleGenerateViva}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Viva Questions</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {vivaQuestions.map((q, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {q.topic}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(q.question, `viva-${idx}`)}
                        className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1"
                      >
                        {copiedMsgId === `viva-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mb-4 leading-snug">{q.question}</h4>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Expected Viva Answer Points:</div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {q.expected_points.map((pt, pidx) => (
                          <li key={pidx} className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">System Requirement Analyzer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Extracts functional/non-functional requirements, missing specifications, and technical risks.</p>
              </div>

              <button
                onClick={handleAnalyzeRequirements}
                disabled={reqLoading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {reqLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>{reqLoading ? 'Analyzing...' : 'Run Requirement Analysis'}</span>
              </button>
            </div>

            {reqLoading ? (
              <div className="h-48 bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center text-slate-500 text-sm gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Parsing project documentation and analyzing requirements...</span>
              </div>
            ) : !requirementsData ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Layers className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Analyze Project Scope</h3>
                <p className="text-slate-500 text-xs mt-1 mb-5">Click 'Run Requirement Analysis' to inspect uploaded documents.</p>
                <button
                  onClick={handleAnalyzeRequirements}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Analyze Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Functional Requirements</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {requirementsData.functional_requirements.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 text-indigo-600">
                    <Zap className="w-5 h-5" />
                    <span>Non-Functional Requirements</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {requirementsData.non_functional_requirements.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="font-bold text-indigo-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Missing Information</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {requirementsData.missing_information.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 text-amber-900 flex items-start gap-2">
                        <span className="font-bold text-amber-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 text-rose-600">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Technical Risks</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {requirementsData.technical_risks.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-rose-900 flex items-start gap-2">
                        <span className="font-bold text-rose-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic Document Reviewer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated critique identifying document strengths, technical flaws, and clarity improvements.</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedReviewDocId}
                  onChange={e => setSelectedReviewDocId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.filename}</option>
                  ))}
                </select>

                <button
                  onClick={handleReviewDocument}
                  disabled={reviewLoading || !selectedReviewDocId}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {reviewLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                  <span>{reviewLoading ? 'Reviewing...' : 'Review Document'}</span>
                </button>
              </div>
            </div>

            {reviewLoading ? (
              <div className="h-48 bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center text-slate-500 text-sm gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Critiquing document contents and evaluating academic clarity...</span>
              </div>
            ) : !reviewData ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Select Document to Review</h3>
                <p className="text-slate-500 text-xs mt-1 mb-5">Choose a document above and click 'Review Document'.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-2">Executive Summary</h4>
                  <p className="text-slate-700 text-xs leading-relaxed">{reviewData.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-emerald-700 text-sm mb-3">Strengths</h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {reviewData.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-blue-700 text-sm mb-3">Actionable Suggestions</h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {reviewData.suggestions.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
