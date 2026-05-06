import { GoogleGenAI, Type } from '@google/genai';

let ai: GoogleGenAI | null = null;
try {
  // We check if the expected environment variable exists
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.warn("GEMINI_API_KEY is not defined. Features requiring AI will fail.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini API", e);
}

export interface CVAnalysisResult {
  fileName?: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: { 
      data: await base64EncodedDataPromise, 
      mimeType: file.type 
    },
  };
};

export const analyzeCV = async (file: File, jobDescription: string, jobRequirements: string): Promise<CVAnalysisResult> => {
  if (!ai) {
    throw new Error("لا يمكن الوصول لخدمة الذكاء الاصطناعي حالياً. الرجاء التحقق من إعدادات المفتاح (API Key).");
  }

  const filePart = await fileToGenerativePart(file);

  let jobContext = "";
  if (jobDescription.trim() || jobRequirements.trim()) {
    jobContext = `
الوصف الوظيفي (Job Description):
${jobDescription || 'غير محدد'}

شروط الوظيفة (Job Requirements):
${jobRequirements || 'غير محدد'}
`;
  }

  const prompt = `أنت خبير محترف في مجال الموارد البشرية (HR Expert). قم بتحليل السيرة الذاتية (CV) المرفقة بدقة واحترافية وبناءً على الوظيفة المتقدم إليها والشروط الخاصة بها.
${jobContext}
  يجب عليك استخراج التالي وإرجاعه بتنسيق JSON حصراً:
  1. التقييم العام (score): قيمة رقمية من 0 إلى 100 توضح مدى تطابق السيرة الذاتية مع الوصف الوظيفي والشروط.
  2. ملخص (summary): فقرة موجزة تلخص محتوى السيرة الذاتية ومدى ملاءمتها للوظيفة المحددة.
  3. نقاط القوة (strengths): قائمة بنقاط القوة والمهارات البارزة التي تميز المرشح بالنسبة للوظيفة المطلوبة.
  4. نقاط الضعف (weaknesses): قائمة بنقاط الضعف، الفجوات، أو الجوانب التي يمكن للمرشح تحسينها لملاءمة الوظيفة.

  يجب أن يكون الإخراج باللغة العربية البليغة حصراً ويرجى الالتزام بالصيغة الهيكلية الصحيحة.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [filePart, { text: prompt }]
      }
    ],
    config: {
      temperature: 0.2, // Low temperature for consistent and objective evaluation
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "Evaluation score out of 100" },
          summary: { type: Type.STRING, description: "Detailed summary of the CV content in Arabic" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of strengths in Arabic" },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of weaknesses in Arabic" },
        },
        required: ["score", "summary", "strengths", "weaknesses"]
      }
    }
  });

  if (!response.text) {
     throw new Error("لم يتم إرجاع أي نتيجة من نموذج الذكاء الاصطناعي.");
  }

  // The model config is set to return JSON, so we can parse it directly
  return JSON.parse(response.text) as CVAnalysisResult;
};
