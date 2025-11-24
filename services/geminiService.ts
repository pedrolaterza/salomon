
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DailyContent } from "../types";

// A chave padrão fornecida para garantir funcionamento imediato
const DEFAULT_API_KEY = "AIzaSyBupxKTUvWaqkXPPIHI2Jj03elqs5I7D7g";

const contentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scriptureReference: { type: Type.STRING, description: "e.g., Provérbios 1" },
    scriptureVerses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          verse: { type: Type.INTEGER },
          text: { type: Type.STRING }
        },
        required: ["verse", "text"]
      },
      description: "Lista completa dos versículos."
    },
    interpretation: { type: Type.STRING, description: "Interpretação concisa (3 frases). Use markdown bold (**texto**)." },
    practicalSteps: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "3 passos práticos e curtos. Use markdown bold (**texto**)."
    },
    reflectionQuestion: { type: Type.STRING, description: "Pergunta de reflexão única baseada no capítulo. USE **negrito**." },
    historicalCuriosity: { type: Type.STRING, description: "Fato histórico/cultural específico sobre o capítulo." }
  },
  required: ["scriptureReference", "scriptureVerses", "interpretation", "practicalSteps", "reflectionQuestion", "historicalCuriosity"]
};

export const fetchDailyWisdom = async (day: number): Promise<DailyContent | null> => {
  try {
    // Usa sempre a chave hardcoded para garantir funcionamento (oculta do usuário)
    const apiKey = DEFAULT_API_KEY;

    // Initialize AI
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      JSON para Provérbios Capítulo ${day}.
      Requisitos:
      1. 'scriptureVerses': Array com TODOS os versículos do cap ${day} (NVI).
      2. 'interpretation': Foco em inteligência emocional.
      3. 'practicalSteps': 3 passos práticos.
      4. 'reflectionQuestion': Pergunta baseada no tema do capítulo.
      5. 'historicalCuriosity': Fato histórico/cultural ESPECÍFICO deste capítulo (ex: leis, costumes).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: contentSchema,
        temperature: 0.7, // Lower temperature for faster, more deterministic output
        topK: 40,
      },
    });

    let text = response.text;
    if (!text) return null;

    // Clean up potential markdown formatting
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    const data = JSON.parse(text);
    
    return {
      day,
      ...data
    } as DailyContent;

  } catch (error: any) {
    console.error("Error fetching wisdom:", error);
    return null;
  }
};