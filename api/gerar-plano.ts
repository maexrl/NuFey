import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { generateLocalFallbackMealPlan } from '../src/lib/ai/fallback-generator.ts';

export const planoSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista com os 7 dias da semana e suas respectivas refeições',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)',
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis e práticas para o café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis para o lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis e completas para o almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis para o lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis e nutritivas para o jantar',
              },
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
};

export async function gerarPlanoComGemini(dadosPacienteFormatados: string, apiKey: string, pacienteObj?: any) {
  if (apiKey && apiKey.trim().length > 10 && !apiKey.startsWith('AQ.')) {
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest',
    ];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: planoSchema,
          },
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const parsedJson = JSON.parse(text);

        if (parsedJson && parsedJson.plano_semanal && Array.isArray(parsedJson.plano_semanal)) {
          return parsedJson;
        }
      } catch (err: any) {
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err);
      }
    }
  }

  // Motor de Inteligência Artificial local adaptado ao paciente
  return generateLocalFallbackMealPlan(pacienteObj || { dadosPaciente: dadosPacienteFormatados });
}

// Handler padrão para serverless Vercel / Node
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY || '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { dadosPaciente, paciente } = body || {};

    const resultado = await gerarPlanoComGemini(dadosPaciente || '', apiKey, paciente);
    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro na função /api/gerar-plano, executando motor estático:', error);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const fallback = generateLocalFallbackMealPlan(body?.paciente || {});
    return res.status(200).json(fallback);
  }
}
