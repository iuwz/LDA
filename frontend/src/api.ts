// src/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const common: RequestInit = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
};

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).detail || res.statusText);
    }
    // Check for empty response body before parsing JSON
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
}

// Helper to handle text responses specifically
async function handleTextResponse(res: Response): Promise<string> {
    if (!res.ok) {
        const body = await res.text(); // Get error details as text
        throw new Error(body || res.statusText);
    }
    return res.text();
}


// ─── AUTH ────────────────────────────────────────────────────────────────
export interface LoginReq { email: string; password: string; }
export interface LoginRes { access_token: string; token_type: "bearer"; }
export function login(data: LoginReq) {
    return fetch(`${API_BASE}/auth/login`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<LoginRes>(r));
}

export interface RegisterReq { username: string; email: string; hashed_password: string; }
export interface RegisterRes { message: string; user: any; }
export function register(data: RegisterReq) {
    return fetch(`${API_BASE}/auth/register`, {
        ...common,
        method: "POST",
        body: JSON.stringify(data),
    }).then(r => handleResponse<RegisterRes>(r));
}

// Logout endpoint: clears the cookie
export function logout() {
    return fetch(`${API_BASE}/auth/logout`, {
        ...common,
        method: "POST",
    }).then(r => {
        if (!r.ok) throw new Error("Logout failed");
    });
}

// ─── RISK ────────────────────────────────────────────────────────────────
export interface AnalyzeRiskReq { document_text: string; }
export interface AnalyzeRiskRes { analysis_result: { id: string; risks: any[] } }
export function analyzeRisk(document_text: string) {
    return fetch(`${API_BASE}/risk/analyze`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<AnalyzeRiskRes>(r));
}

export function listRiskReports() {
    return fetch(`${API_BASE}/risk`, { ...common, method: "GET" })
        .then(r => handleResponse<any[]>(r));
}

// ─── COMPLIANCE ─────────────────────────────────────────────────────────
export interface ComplianceRes { report_id: string; issues: any[] }
export function checkCompliance(document_text: string) {
    return fetch(`${API_BASE}/compliance/check`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<ComplianceRes>(r));
}

// ─── CHATBOT ────────────────────────────────────────────────────────────
export interface ChatResponse { session_id: string; bot_response: string; }
export function chat(query: string) {
    return fetch(`${API_BASE}/chatbot/query`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ query }),
    }).then(r => handleResponse<ChatResponse>(r));
}

// ─── DOCUMENTS ──────────────────────────────────────────────────────────
export interface DocumentRecord { _id: string; filename: string; owner_id: string; file_id: string }
export interface UploadRes { doc_id: string; gridfs_file_id: string }
export function uploadDocument(file: File) {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/documents/upload`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(r => handleResponse<UploadRes>(r));
}
export function listDocuments() {
    return fetch(`${API_BASE}/documents`, { ...common, method: "GET" })
        .then(r => handleResponse<DocumentRecord[]>(r));
}

// Function to fetch document content by ID (still needed for display in text mode if user switches)
export function getDocumentContent(docId: string): Promise<string> {
  // Use handleTextResponse because the backend endpoint returns plain text
  return fetch(`${API_BASE}/documents/content/${docId}`, {
      credentials: "include",
      method: "GET",
  }).then(r => handleTextResponse(r));
}

// Endpoint to download a specific document by ID (used for the rephrased document)
export function downloadDocumentById(docId: string, filename: string) {
  // We don't use handleResponse here as we expect a file stream, not JSON
  return fetch(`${API_BASE}/documents/download/${docId}`, {
      credentials: "include",
      method: "GET",
  }).then(res => {
      if (!res.ok) {
          // If the server returns an error (e.g., 404, 403), try to read it as text
           return res.text().then(text => {
               throw new Error(`Download failed: ${res.statusText} - ${text}`);
           }).catch(() => {
               // Fallback error if text reading fails
                throw new Error(`Download failed: ${res.statusText}`);
           });
      }
      // Use the browser's download mechanism
      const disposition = res.headers.get('Content-Disposition');
      let suggestedFilename = filename;
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameMatch = disposition.match(/filename\*?=([^;]+)/i);
          if (filenameMatch && filenameMatch[1]) {
              suggestedFilename = decodeURIComponent(filenameMatch[1].replace(/^UTF-8''/i, '')).replace(/['"]/g, '');
          } else {
             const basicFilenameMatch = disposition.match(/filename="?([^"]+)"?/i);
             if(basicFilenameMatch && basicFilenameMatch[1]){
                  suggestedFilename = basicFilenameMatch[1];
             }
          }
      }

      return res.blob().then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = suggestedFilename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
      });
  });
}


// ─── REPHRASE & TRANSLATE ─────────────────────────────────────────────────

// Define response types for rephrasing
export interface RephraseTextResponse { report_id: string; rephrased_text: string }
export interface RephraseDocumentResponse { report_id: string; rephrased_doc_id: string; rephrased_doc_filename: string }

// Update the rephrase function to handle both text and document inputs
export function rephrase(data: { document_text: string, style: string } | { doc_id: string, style: string }): Promise<RephraseTextResponse | RephraseDocumentResponse> {
     const requestBody: any = { style: data.style };
     if ('document_text' in data) {
         requestBody.document_text = data.document_text;
     } else if ('doc_id' in data) {
         requestBody.doc_id = data.doc_id;
     } else {
         return Promise.reject(new Error("Invalid rephrase input: either document_text or doc_id must be provided."));
     }

    return fetch(`${API_BASE}/rephrase`, {
        ...common,
        method: "POST",
        body: JSON.stringify(requestBody),
    }).then(r => handleResponse<RephraseTextResponse | RephraseDocumentResponse>(r));
}


export interface TranslateRes { report_id: string; translated_text: string }
export function translate(document_text: string, target_lang: string) {
    return fetch(`${API_BASE}/translate`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text, target_lang }),
    }).then(r => handleResponse<TranslateRes>(r));
}