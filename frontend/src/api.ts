// src/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const common: RequestInit = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
};

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        // Try to read as JSON first, fall back to text if JSON parsing fails
        try {
            const body = await res.json();
             // Assuming backend error structure has a 'detail' field
            throw new Error(body.detail || res.statusText);
        } catch (e) {
             // If JSON parsing failed or 'detail' was not present, use status text
            throw new Error(res.statusText);
        }
    }
    // Check for empty response body before parsing JSON
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
}

// Helper to handle text responses specifically (used for document content preview)
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
// Assuming AnalyzeRiskRes structure based on the provided main.py endpoint return
export interface AnalyzeRiskRes { analysis_result: { id: string; risks: any[] } }
export function analyzeRisk(document_text: string) {
    return fetch(`${API_BASE}/risk/analyze`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text }),
    }).then(r => handleResponse<AnalyzeRiskRes>(r));
}

// Assuming a /risk endpoint exists to list reports (not shown in user's main.py snippet, but often exists)
// export function listRiskReports() {
//     return fetch(`${API_BASE}/risk`, { ...common, method: "GET" })
//         .then(r => handleResponse<any[]>(r));
// }


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
export function uploadDocument(file: File): Promise<UploadRes> { // Added return type hint
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/documents/upload`, {
        credentials: "include",
        method: "POST",
        body: form,
    }).then(r => handleResponse<UploadRes>(r));
}
export function listDocuments(): Promise<DocumentRecord[]> { // Added return type hint
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
export async function downloadDocumentById(docId: string, filename: string): Promise<void> { // Added async and Promise<void>
    try {
        // Create a new Headers object by copying common headers
        const headers = new Headers(common.headers);
        // Explicitly delete the 'Content-Type' header for file downloads
        headers.delete('Content-Type');

        const response = await fetch(`${API_BASE}/documents/download/${docId}`, {
            ...common,
            method: "GET",
            // Use the modified headers object
            headers: headers
        });

        if (!response.ok) {
             // Try to read error as text, fall back to status text
             const errorDetail = await response.text().catch(() => response.statusText);
            throw new Error(`Failed to download document ${filename}: ${response.status} ${response.statusText} - ${errorDetail}`);
        }

        // Get filename from headers if available, otherwise use provided filename
        const contentDisposition = response.headers.get('Content-Disposition');
        let effectiveFilename = filename; // Default fallback filename
         if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=UTF-8''(.+)$/);
            if (filenameMatch && filenameMatch[1]) {
                // Decode URI component for UTF-8 filenames
                effectiveFilename = decodeURIComponent(filenameMatch[1]);
            } else {
                 // Fallback to basic filename="...", handling potential quotes
                 const basicFilenameMatch = contentDisposition.match(/filename="(.+)"/);
                 if (basicFilenameMatch && basicFilenameMatch[1]) {
                      effectiveFilename = basicFilenameMatch[1].replace(/['"]/g, ''); // Remove surrounding quotes
                 } else {
                      // Fallback to simple filename=... (less common but possible)
                       const simpleFilenameMatch = contentDisposition.match(/filename=([^;]+)/i);
                       if(simpleFilenameMatch && simpleFilenameMatch[1]){
                           effectiveFilename = simpleFilenameMatch[1].trim().replace(/['"]/g, '');
                       }
                 }
            }
         }


        // Create a blob from the response
        const blob = await response.blob();

        // Create a link element, set the download attribute, and trigger click
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = effectiveFilename; // Use the determined filename
        document.body.appendChild(a); // Temporarily add link to body
        a.click(); // Trigger the download

        // Clean up: remove link and revoke object URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download failed:", error);
        // Display a user-friendly error message
        alert(`Download failed: ${(error as Error).message}`);
    }
}


// ─── REPHRASE & TRANSLATE ─────────────────────────────────────────────────

// Define response types for rephrasing
export interface RephraseTextResponse { report_id: string; rephrased_text: string }
export interface RephraseDocumentResponse { report_id: string; rephrased_doc_id: string; rephrased_doc_filename: string }

// Update the rephrase function to handle both text and document inputs
export function rephrase(data: { document_text: string, style: string } | { doc_id: string, style: string }): Promise<RephraseTextResponse | RephraseDocumentResponse> {
     const requestBody: any = { style: data.style };
     if ('document_text' in data && data.document_text !== undefined && data.document_text !== null && data.document_text !== "") { // Explicitly check for undefined/null/empty string
         requestBody.document_text = data.document_text;
     } else if ('doc_id' in data && data.doc_id !== undefined && data.doc_id !== null && data.doc_id !== "") { // Explicitly check for undefined/null/empty string
         requestBody.doc_id = data.doc_id;
     } else {
         // This case should ideally be caught by UI validation, but good practice here too.
         return Promise.reject(new Error("Invalid rephrase input: either non-empty document_text or doc_id must be provided."));
     }


    return fetch(`${API_BASE}/rephrase`, {
        ...common,
        method: "POST",
        body: JSON.stringify(requestBody), // Send the data object directly
    }).then(r => handleResponse<RephraseTextResponse | RephraseDocumentResponse>(r));
}


export interface TranslateRes { report_id: string; translated_text: string }
export function translate(document_text: string, target_lang: string): Promise<TranslateRes> { // Added return type hint
    return fetch(`${API_BASE}/translate`, {
        ...common,
        method: "POST",
        body: JSON.stringify({ document_text, target_lang }),
    }).then(r => handleResponse<TranslateRes>(r));
}

// ─── COMPLIANCE ─────────────────────────────────────────────────────────
// Update ComplianceRes to match the backend ComplianceReportResponse model
export interface ComplianceIssue {
    rule_id: string;
    description: string;
    status: string; // e.g., 'Issue Found', 'OK', 'Warning'
    // Add the new field for the extracted text snippet
    extracted_text_snippet?: string | null; // Added optional string or null
    // location?: string; // Match backend model if location is added
}

export interface ComplianceReportResponse {
    report_id: string;
    issues: ComplianceIssue[];
}

// Update checkCompliance function signature and body
export function checkCompliance(data: { document_text: string } | { doc_id: string }): Promise<ComplianceReportResponse> {
    const requestBody: any = {};
    // Ensure only one of document_text or doc_id is sent and has a value
    if ('document_text' in data && data.document_text !== undefined && data.document_text !== null && data.document_text !== "") {
         requestBody.document_text = data.document_text;
    } else if ('doc_id' in data && data.doc_id !== undefined && data.doc_id !== null && data.doc_id !== "") {
         requestBody.doc_id = data.doc_id;
    } else {
        // This case should ideally be caught by UI validation, but good practice here too.
         return Promise.reject(new Error("Invalid compliance input: either non-empty document_text or doc_id must be provided."));
    }


    return fetch(`${API_BASE}/compliance/check`, {
        ...common,
        method: "POST",
        body: JSON.stringify(requestBody), // Send the data object directly
    }).then(r => handleResponse<ComplianceReportResponse>(r));
}

// Add function to download compliance report by ID
export async function downloadComplianceReport(reportId: string): Promise<void> {
     try {
        // Create a new Headers object by copying common headers
        const headers = new Headers(common.headers);
        // Explicitly delete the 'Content-Type' header for file downloads
        headers.delete('Content-Type');

        // The backend returns a text file for this endpoint
        const response = await fetch(`${API_BASE}/compliance/report/download/${reportId}`, {
            ...common,
            method: "GET",
            // Use the modified headers object
            headers: headers
        });

        if (!response.ok) {
            // Try to read error as text, fall back to status text
            const errorDetail = await response.text().catch(() => response.statusText);
            throw new Error(`Failed to download compliance report ${reportId}: ${response.status} ${response.statusText} - ${errorDetail}`);
        }

         // Get filename from headers if available, otherwise use a default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `compliance_report_${reportId}.txt`; // Default filename
         if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=UTF-8''(.+)$/);
            if (filenameMatch && filenameMatch[1]) {
                 // Decode URI component for UTF-8 filenames
                filename = decodeURIComponent(filenameMatch[1]);
            } else {
                 // Fallback to basic filename="...", handling potential quotes
                 const basicFilenameMatch = contentDisposition.match(/filename="(.+)"/);
                 if (basicFilenameMatch && basicFilenameMatch[1]) {
                      filename = basicFilenameMatch[1].replace(/['"]/g, ''); // Remove surrounding quotes
                 } else {
                      // Fallback to simple filename=... (less common but possible)
                       const simpleFilenameMatch = contentDisposition.match(/filename=([^;]+)/i);
                       if(simpleFilenameMatch && simpleFilenameMatch[1]){
                           filename = simpleFilenameMatch[1].trim().replace(/['"]/g, '');
                       }
                 }
            }
         }


        // Create a blob from the response
        const blob = await response.blob();

        // Create a link element, set the download attribute, and trigger click
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Use the determined filename
        document.body.appendChild(a); // Temporarily add link to body
        a.click(); // Trigger the download

        // Clean up: remove link and revoke object URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Compliance report download failed:", error);
        // Display a user-friendly error message
        alert(`Compliance report download failed: ${(error as Error).message}`);
    }
}