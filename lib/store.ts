// In-memory fallback stores for Vercel Serverless API routes

declare global {
  var _projectsStore: Map<string, any> | undefined;
  var _documentsStore: Map<string, any> | undefined;
  var _chunksStore: Array<any> | undefined;
}

export const projectsStore = global._projectsStore || (global._projectsStore = new Map());
export const documentsStore = global._documentsStore || (global._documentsStore = new Map());
export const chunksStore = global._chunksStore || (global._chunksStore = []);
