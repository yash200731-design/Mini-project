export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

export interface DocumentItem {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  storage_path?: string;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  chunk_count?: number;
}

export interface Source {
  document_id: string;
  filename: string;
  page_number: number;
  similarity: number;
  content_snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: Source[];
  isLoading?: boolean;
}

export interface ChatRequest {
  project_id: string;
  question: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface VivaQuestion {
  question: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expected_points: string[];
}

export interface VivaResponse {
  questions: VivaQuestion[];
}

export interface RequirementAnalysis {
  functional_requirements: string[];
  non_functional_requirements: string[];
  missing_information: string[];
  ambiguities: string[];
  technical_risks: string[];
  suggestions: string[];
}

export interface DocumentReview {
  summary: string;
  strengths: string[];
  missing_information: string[];
  technical_issues: string[];
  clarity_issues: string[];
  suggestions: string[];
}

export interface HealthStatus {
  status: string;
  service: string;
}
