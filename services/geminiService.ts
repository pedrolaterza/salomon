import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DailyContent } from "../types";

// Lazy initialization to prevent top-level crashes if API_KEY is missing during build/init
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Ensure we have a string, even if empty, to prevent constructor error
    const apiKey = process.env.API_KEY || '';
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

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
      description: "Lista completa dos versículos do capítulo, cada um com seu número."
    },
    interpretation: { type: Type.STRING, description: "Interpretação moderna do capítulo (3-5 frases). Use markdown bold (**texto**) para destacar palavras-chave." },
    practicalSteps: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "3 passos práticos para o dia a dia. Use markdown bold (**texto**) para destacar a ação principal."
    },
    reflectionQuestion: { type: Type.STRING, description: "Uma pergunta de reflexão ÚNICA e ESPECÍFICA baseada em uma metáfora ou versículo deste capítulo (ex: se o cap fala de preguiça, pergunte sobre proatividade; se fala de palavras, pergunte sobre o que foi dito hoje). Conecte isso com a vontade de Deus. EVITE perguntas genéricas do tipo 'como buscar sabedoria'. USE **negrito** para ênfase." },
    historicalCuriosity: { type: Type.STRING, description: "Uma curiosidade histórica ESPECÍFICA sobre costumes, leis, agricultura ou arquitetura do Oriente Médio Antigo relacionados EXCLUSIVAMENTE aos temas deste capítulo. NÃO repita fatos genéricos sobre a riqueza de Salomão." }
  },
  required: ["scriptureReference", "scriptureVerses", "interpretation", "practicalSteps", "reflectionQuestion", "historicalCuriosity"]
};

export const fetchDailyWisdom = async (day: number): Promise<DailyContent | null> => {
  try {
    // Check if API key is actually present before making a call to give better error message
    if (!process.env.API_KEY) {
      console.warn("API Key is missing. Check your environment variables.");
      // We don't throw here to allow the UI to handle the null return gracefully or show a specific message
    }

    const ai = getAI();
    
    const prompt = `
      Hoje é o Dia ${day} de uma jornada de sabedoria.
      
      Gere um objeto JSON com o conteúdo para: Livro de Provérbios, Capítulo ${day}.
      
      Requisitos Estritos:
      1. 'scriptureVerses': Array com TODOS os versículos do capítulo ${day} (versão NVI ou Almeida). Texto fiel.
      2. 'interpretation': Interpretação focada em inteligência emocional e sabedoria. USE **negrito** para destacar conceitos chave.
      3. 'practicalSteps': 3 passos práticos. USE **negrito** nas palavras de ação.
      4. 'reflectionQuestion': Crie uma pergunta de reflexão ÚNICA e ESPECÍFICA baseada em uma metáfora ou versículo deste capítulo (ex: se o cap fala de preguiça, pergunte sobre proatividade; se fala de palavras, pergunte sobre o que foi dito hoje). Conecte isso com a vontade de Deus. EVITE perguntas genéricas do tipo "como buscar sabedoria". USE **negrito** para ênfase.
      5. 'historicalCuriosity': PROIBIDO falar genericamente que Salomão era rico ou sábio. Traga um fato arqueológico, cultural ou linguístico ESPECÍFICO que explique um versículo deste capítulo (ex: como eram os telhados na época, leis sobre fiança, colheita, educação de filhos no oriente médio antigo). Varie o tema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: contentSchema,
        temperature: 0.8,
      },
    });

    let text = response.text;
    if (!text) return null;

    // Clean up potential markdown formatting if the model adds it
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    const data = JSON.parse(text);
    
    return {
      day,
      ...data
    } as DailyContent;

  } catch (error) {
    console.error("Error fetching wisdom from Gemini:", error);
    return null;
  }
};