/**
 * LIBERTAMEDIA.COM - GOOGLE AI STUDIO BACKEND AUTOMATION MODULE
 * 
 * Modul ini menyediakan struktur integrasi lengkap untuk mengotomatiskan
 * logika backend server cPanel Anda menggunakan Google AI Studio (aistudio.google.com).
 * 
 * Menggunakan fitur:
 * 1. System Instructions (Aturan Perilaku Backend)
 * 2. Function Calling / Tools (AI Memanggil Fungsi Database cPanel)
 * 3. Structured JSON Output (Format Data Otomatis)
 */

export interface AIStudioActionRequest {
  action: 'auto_categorize' | 'generate_lead' | 'function_call_query' | 'polish_submission';
  payload: {
    title?: string;
    content?: string;
    userQuery?: string;
    submissionData?: any;
  };
}

// 1. System Instructions Utama Google AI Studio
export const AI_STUDIO_SYSTEM_INSTRUCTION = `
Anda adalah Engine Otomatisasi Backend Resmi untuk portal berita libertamedia.com ("Media Untuk Semua").

ATURAN UTAMA BACKEND:
1. Selalu kembalikan respon dalam format JSON terstruktur yang valid.
2. Jaga integritas jurnalisme independen, etika siber, dan bahasa Indonesia baku yang lugas.
3. Kategori yang valid hanya: 'Pemerintahan', 'Politik', 'Mahasiswa', 'Ekonomi', 'Internasional', 'Opini'.
4. Rubrik pilar yang valid hanya: 'news', 'opinion', 'student', 'international'.
`;

// 2. Definisi Deklarasi Alat (Function Calling / Tools Schema) untuk AI Studio
export const AI_STUDIO_FUNCTION_DECLARATIONS = [
  {
    name: "getArticlesByCategory",
    description: "Mengambil daftar berita dari database cPanel berdasarkan kategori dan jumlah limit.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          description: "Kategori berita: Pemerintahan, Politik, Mahasiswa, Ekonomi, Internasional, Opini"
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah berita yang ingin diambil (default: 5)"
        }
      },
      required: ["category"]
    }
  },
  {
    name: "publishSubmissionToHomepage",
    description: "Memindahkan naskah opini dari inbox Suara Warga ke tabel berita utama di beranda.",
    parameters: {
      type: "OBJECT",
      properties: {
        submissionId: {
          type: "STRING",
          description: "ID unik naskah kiriman warga (contoh: sub-17000000)"
        },
        selectedCategory: {
          type: "STRING",
          description: "Kategori tujuan penempatan di beranda"
        }
      },
      required: ["submissionId"]
    }
  }
];

// 3. Helper pemroses aksi otomatisasi AI Studio di Server Express
export async function processAIStudioBackendWorkflow(reqData: AIStudioActionRequest, apiKey?: string) {
  const { action, payload } = reqData;

  // Jika API Key dari Google AI Studio belum terkonfigurasi, gunakan Local Automation Engine
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return handleLocalBackendAutomation(action, payload);
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    if (action === 'auto_categorize' || action === 'generate_lead') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${AI_STUDIO_SYSTEM_INSTRUCTION}
Tolong buatkan ringkasan lead dan tentukan kategori tepat untuk berita berikut:
Judul: ${payload.title || ''}
Isi: ${payload.content || ''}

Kembalikan format JSON:
{
  "lead": "Ringkasan lead 1-2 kalimat",
  "category": "Pemerintahan",
  "pillar": "news",
  "tags": ["Tag1", "Tag2"]
}`
      });

      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return { success: true, engine: "Google AI Studio Live", data: JSON.parse(match[0]) };
      }
    }

    if (action === 'function_call_query') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analisis perintah pengguna berikut dan tentukan apakah perlu memanggil fungsi database cPanel: "${payload.userQuery || ''}"`,
        config: {
          tools: [{ functionDeclarations: AI_STUDIO_FUNCTION_DECLARATIONS as any }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        return {
          success: true,
          engine: "Google AI Studio Function Calling",
          functionToExecute: {
            name: functionCalls[0].name,
            args: functionCalls[0].args
          }
        };
      }
    }

    return handleLocalBackendAutomation(action, payload);
  } catch (err: any) {
    console.warn("AI Studio execution fallback:", err);
    return handleLocalBackendAutomation(action, payload);
  }
}

// Fallback Automation Engine lokal jika server berjalan tanpa API Key
function handleLocalBackendAutomation(action: string, payload: any) {
  const title = payload.title || payload.userQuery || "Berita Libertamedia";
  
  let category = "Pemerintahan";
  if (title.toLowerCase().includes("politik") || title.toLowerCase().includes("dpr")) category = "Politik";
  if (title.toLowerCase().includes("mahasiswa") || title.toLowerCase().includes("kampus")) category = "Mahasiswa";
  if (title.toLowerCase().includes("ekonomi") || title.toLowerCase().includes("rupiah")) category = "Ekonomi";

  return {
    success: true,
    engine: "cPanel Local Automation Engine",
    data: {
      lead: `Analisis mendalam dan liputan independen mengenai ${title}.`,
      category,
      pillar: category === "Mahasiswa" ? "student" : "news",
      tags: [category, "Analisis", "Nasional"]
    }
  };
}
