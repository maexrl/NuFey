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
                description: 'Opções saudáveis com porções e horários para o café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Opções saudáveis com porções para o lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Opções completas e balanceadas para o almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Opções saudáveis para o lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Opções leves e nutritivas para o jantar',
              },
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
    resumo_nutricional: {
      type: SchemaType.OBJECT,
      description: 'Resumo nutricional diário estimado',
      properties: {
        calorias_totais: { type: SchemaType.NUMBER, description: 'Total de calorias diárias recomendadas (kcal)' },
        carboidratos_g: { type: SchemaType.NUMBER, description: 'Total de carboidratos diários (g)' },
        proteinas_g: { type: SchemaType.NUMBER, description: 'Total de proteínas diárias (g)' },
        gorduras_g: { type: SchemaType.NUMBER, description: 'Total de gorduras diárias (g)' },
      },
      required: ['calorias_totais', 'carboidratos_g', 'proteinas_g', 'gorduras_g'],
    },
    lista_compras: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Lista de compras semanal acumulada a partir dos ingredientes do plano',
    },
  },
  required: ['plano_semanal'],
};

export async function gerarPlanoComGemini(
  dadosPacienteFormatados: string,
  apiKey: string,
  pacienteObj?: any,
  customSystemPrompt?: string
) {
  const effectiveApiKey = (apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();

  if (effectiveApiKey.length > 5) {
    const genAI = new GoogleGenerativeAI(effectiveApiKey);

    const defaultBasePrompt = `Você é um nutricionista clínico especialista em nutrição individualizada.
Sua missão é ler com atenção o RELATÓRIO DO PACIENTE abaixo e prescrever um PLANO ALIMENTAR RESUMIDO, ALTAMENTE EFICAZ E EXCLUSIVO para as características deste paciente.

ATENÇÃO: CADA PACIENTE É ÚNICO. VOCÊ DEVE ADAPTAR TODO O CARDÁPIO ÁS ESPECIFICAÇÕES INDIVIDUAIS DELE (OBJETIVOS, PESO, ALTURA, PATOLOGIAS, ALERGIAS E ROTINA).

=======================================================
RELATÓRIO / ANAMNESE COMPLETA DO PACIENTE:
${dadosPacienteFormatados}
=======================================================`;

    const systemInstruction = customSystemPrompt ? `${customSystemPrompt}\n\n${dadosPacienteFormatados}` : defaultBasePrompt;

    const prompt = `${systemInstruction}

# Regras Críticas de Personalização e Execução Clínica:
- Responda APENAS e estritamente o objeto JSON estruturado correspondente ao esquema.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações ou textos fora do JSON.
- RESPEITE RIGOROSAMENTE todas as ALERGIAS e RESTRIÇÕES alimentares informadas no relatório. NENHUM ingrediente proibido pode aparecer no cardápio!
- Se houver patologias (ex: diabetes, hipertensão), ajuste os nutrientes especificamente para a condição médica do paciente.
- Especifique porções claras em gramas/medidas caseiras práticas brasileiras e horários adaptados aos hábitos do paciente.
- Calcule e forneça o resumo nutricional diário estimado (calorias totais em kcal, carboidratos em g, proteínas em g e gorduras em g) sob medida para a meta biométrica do paciente.
- Forneça uma lista de compras semanal resumida e acumulada a partir dos alimentos do plano deste paciente.`;

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
        console.warn(`Tentativa de geração Gemini com modelo ${modelName} falhou:`, err?.message || err);
      }
    }
  }

  // Motor de Inteligência Artificial local adaptado ao paciente em caso de fallback
  return generateLocalFallbackMealPlan(pacienteObj || { dadosPaciente: dadosPacienteFormatados });
}

// Handler padrão para serverless Vercel / Node / Vite Middleware
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { dadosPaciente, paciente, apiKeyCustom, customSystemPrompt } = body || {};
    const apiKey = apiKeyCustom || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';

    const resultado = await gerarPlanoComGemini(
      dadosPaciente || (typeof paciente === 'string' ? paciente : JSON.stringify(paciente || {})),
      apiKey,
      paciente,
      customSystemPrompt
    );
    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro na rota de API Gemini (/api/gerar-plano), executando motor local:', error);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const fallback = generateLocalFallbackMealPlan(body?.paciente || {});
    return res.status(200).json(fallback);
  }
}

