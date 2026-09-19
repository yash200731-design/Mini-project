'use client';

import React from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Brain, 
  FileText, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">ProjectMentor <span className="text-blue-600">AI</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Demo Projects
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm shadow-blue-600/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-28 px-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Academic Mentor for B.Tech & Graduate Projects</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your AI-powered mentor for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">entire project lifecycle</span>.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your project knowledge base, ask questions, analyze requirements, review documentation, and prepare for your viva with project-specific AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-all shadow-md shadow-blue-600/25"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-6 py-3.5 rounded-xl text-base transition-all"
            >
              <span>View Workspace Demo</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Strict Project Isolation</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Grounded Answers & Sources</span>
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-500" /> PDF, DOCX, TXT, MD</span>
          </div>
        </section>

        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Engineered for Academic Rigor</h2>
              <p className="mt-3 text-slate-600">Built using Retrieval-Augmented Generation (RAG), vector similarity search, and anti-hallucination prompts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Project-Aware AI</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Answers questions strictly based on your uploaded project proposal, research papers, technical specs, and architecture documents.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">RAG-Powered Retrieval</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Uses Supabase pgvector cosine similarity search to retrieve exact page numbers and document passages for every AI response.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Viva Preparation</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Generates realistic external examiner viva questions categorized by difficulty, topic, and expected answer points.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Requirement Analysis</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Automatically extracts functional, non-functional requirements, technical risks, ambiguities, and missing specifications.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Document Reviewer</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Critiques uploaded PDFs and reports to highlight strengths, technical clarity issues, missing evaluation metrics, and improvements.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Zero Hallucination Guarantee</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  If requested information is missing from your uploaded documentation, the AI clearly states it was not found in your knowledge base.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} ProjectMentor AI. Full-Stack RAG System for Academic Projects.</p>
        </div>
      </footer>
    </div>
  );
}
