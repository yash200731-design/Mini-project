import {
  Project,
  DocumentItem,
  ChatResponse,
  VivaResponse,
  RequirementAnalysis,
  DocumentReview,
  HealthStatus
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health Check
  async checkHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthStatus>(res);
  },

  // Projects API
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE_URL}/projects`);
    return handleResponse<Project[]>(res);
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleResponse<Project>(res);
  },

  async createProject(name: string, description?: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    return handleResponse<Project>(res);
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      await handleResponse(res);
    }
  },

  // Documents API
  async getDocuments(projectId: string): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE_URL}/documents?project_id=${projectId}`);
    return handleResponse<DocumentItem[]>(res);
  },

  async uploadDocument(projectId: string, file: File): Promise<{ message: string; document: DocumentItem }> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ message: string; document: DocumentItem }>(res);
  },

  async deleteDocument(documentId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      await handleResponse(res);
    }
  },

  // Chat API
  async sendChatMessage(projectId: string, question: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, question }),
    });
    return handleResponse<ChatResponse>(res);
  },

  // Viva Question Generator
  async generateViva(projectId: string, difficulty: string = 'medium', count: number = 10): Promise<VivaResponse> {
    const res = await fetch(`${API_BASE_URL}/viva/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, difficulty, count }),
    });
    return handleResponse<VivaResponse>(res);
  },

  // Requirement Analyzer
  async analyzeRequirements(projectId: string, documentId?: string): Promise<RequirementAnalysis> {
    const res = await fetch(`${API_BASE_URL}/requirements/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, document_id: documentId }),
    });
    return handleResponse<RequirementAnalysis>(res);
  },

  // Document Reviewer
  async reviewDocument(projectId: string, documentId: string): Promise<DocumentReview> {
    const res = await fetch(`${API_BASE_URL}/review/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, document_id: documentId }),
    });
    return handleResponse<DocumentReview>(res);
  }
};
