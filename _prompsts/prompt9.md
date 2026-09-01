# Especificacao Tecnica de Implementacao: Redesign UI/UX Estilo Nutrium e Infraestrutura de IA para o NuFey

## 1. Visao Geral e Arquitetura do Sistema

Este documento define a reestruturacao completa do projeto NuFey. O objetivo e transformar o software PWA atual em uma plataforma clinica de gestao nutricional inspirada na experiencia de usuario (UX) e design do Nutrium, resolvendo integralmente as falhas de geracao de planos alimentares por Inteligencia Artificial.

### Pilares da Reestruturacao:
1. Reformulacao do Design System para um tema claro, limpo e hospitalar/clinico (Nutrium Light Theme).
2. Substituicao do modal basico de paciente por uma Central Clinica em Abas (Anamnese, Antropometria, Calculos Energéticos, Plano Alimentar por IA, Prescricao e Exportacao).
3. Correcao definitiva do mecanismo de IA utilizando Vercel AI SDK com resposta estritamente estruturada via Zod, Streaming de dados e Fallback Local imediato em caso de erro na API.
4. Esquema completo de banco de dados PostgreSQL via Neon DB / Prisma ORM.

---

## 2. Design System e Configuracao Visual (Estilo Nutrium)

### 2.1 Configuracao do Tailwind CSS (`tailwind.config.ts`)

Substitua a configuracao atual do Tailwind pela paleta clinica baseada no verde esmeralda e tons slate:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF9',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#09B291', // Cor Principal Nutrium
          600: '#078F74',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
};

export default config;
```

---

## 3. Esquema do Banco de Dados (`prisma/schema.prisma`)

Esquema relational ajustado no Neon DB para persistência de dados antropometricos, anamnese, historicos de consultas e planos gerados por IA.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  password  String
  crn       String?
  phone     String?
  patients  Patient[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Patient {
  id             String          @id @default(uuid())
  userId         String
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String?
  phone          String?
  birthDate      DateTime
  gender         String          // 'male' | 'female'
  heightCm       Float
  weightKg       Float
  activityLevel  String          // 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense'
  goal           String          // 'hypertrophy' | 'weight_loss' | 'maintenance' | 'health'
  allergies      String[]
  dislikes       String[]
  clinicalNotes  String?
  appointments   Appointment[]
  anthropometrics Anthropometry[]
  mealPlans      MealPlan[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Anthropometry {
  id               String   @id @default(uuid())
  patientId        String
  patient          Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  date             DateTime @default(now())
  weightKg         Float
  bodyFatPercent   Float?
  muscleMassPercent Float?
  chestMm          Float?
  tricepsMm        Float?
  subscapularMm    Float?
  suprailiacMm     Float?
  abdominalMm      Float?
  thighMm          Float?
  waistCm          Float?
  hipCm            Float?
}

model Appointment {
  id          String   @id @default(uuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  date        DateTime
  status      String   @default("scheduled") // 'scheduled' | 'completed' | 'cancelled'
  notes       String?
  createdAt   DateTime @default(now())
}

model MealPlan {
  id             String     @id @default(uuid())
  patientId      String
  patient        Patient    @relation(fields: [patientId], references: [id], onDelete: Cascade)
  title          String
  targetCalories Float
  targetProtein  Float
  targetCarbs    Float
  targetFat      Float
  waterRequirementMl Float
  isAiGenerated  Boolean    @default(false)
  status         String     @default("active") // 'active' | 'archived'
  meals          Meal[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model Meal {
  id          String     @id @default(uuid())
  mealPlanId  String
  mealPlan    MealPlan   @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  name        String
  time        String
  orderIndex  Int
  items       MealItem[]
}

model MealItem {
  id          String   @id @default(uuid())
  mealId      String
  meal        Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
  foodName    String
  amount      Float
  unit        String
  calories    Float
  protein     Float
  carbs       Float
  fat         Float
  substitutes String[]
}
```

---

## 4. Modulo de Calculos Nutricionais e Antropometricos (`lib/nutrition-calculator.ts`)

Implementacao pura em TypeScript para formulas clinicas de TMB, GET/TDEE e composicao corporal. Servira como calculador padrao e motor de contingencia (fallback).

```typescript
export interface PatientMetricsInput {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';
  goal: 'weight_loss' | 'maintenance' | 'hypertrophy';
}

export interface CalculatedEnergyRequirements {
  bmr: number; // Taxa Metabolica Basal
  tdee: number; // Gasto Energetico Total
  targetCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  waterMl: number;
}

export function calculateEnergyRequirements(input: PatientMetricsInput): CalculatedEnergyRequirements {
  // Equacao de Mifflin-St Jeor
  let bmr = (10 * input.weightKg) + (6.25 * input.heightCm) - (5 * input.ageYears);
  bmr = input.gender === 'male' ? bmr + 5 : bmr - 161;

  // Fator de Atividade
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
    very_intense: 1.9
  };

  const tdee = bmr * activityMultipliers[input.activityLevel];

  // Ajuste por Objetivo
  let targetCalories = tdee;
  if (input.goal === 'weight_loss') targetCalories = tdee - 500;
  if (input.goal === 'hypertrophy') targetCalories = tdee + 350;

  // Distribuicao de Macronutrientes
  let proteinRatio = 0.25;
  let fatRatio = 0.25;
  let carbRatio = 0.50;

  if (input.goal === 'hypertrophy') {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  } else if (input.goal === 'weight_loss') {
    proteinRatio = 0.35;
    fatRatio = 0.25;
    carbRatio = 0.40;
  }

  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);
  const carbsGrams = Math.round((targetCalories * carbRatio) / 4);
  const waterMl = Math.round(input.weightKg * 35);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: { proteinGrams, carbsGrams, fatGrams },
    waterMl
  };
}

export function calculatePollock7Folds(
  folds: { chest: number; axillary: number; triceps: number; subscapular: number; abdominal: number; suprailiac: number; thigh: number },
  age: number,
  gender: 'male' | 'female'
): number {
  const sum = folds.chest + folds.axillary + folds.triceps + folds.subscapular + folds.abdominal + folds.suprailiac + folds.thigh;
  let bodyDensity = 0;

  if (gender === 'male') {
    bodyDensity = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
  } else {
    bodyDensity = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
  }

  // Formula de Siri
  const bodyFatPercent = ((4.95 / bodyDensity) - 4.5) * 100;
  return Number(bodyFatPercent.toFixed(1));
}
```

---

## 5. Infraestrutura de Inteligencia Artificial sem Falhas

### 5.1 Definicao de Schemas Zod (`lib/ai/schemas.ts`)

```typescript
import { z } from 'zod';

export const MealItemSchema = z.object({
  foodName: z.string().describe("Nome do alimento baseado na Tabela TACO/TBCA"),
  amount: z.number().describe("Quantidade numerica"),
  unit: z.string().describe("Unidade de medida: g, ml, colher de sopa, xicara, unidade"),
  calories: z.number().describe("Valor calorico total em kcal"),
  protein: z.number().describe("Proteinas em gramas"),
  carbs: z.number().describe("Carboidratos em gramas"),
  fat: z.number().describe("Gorduras em gramas"),
  substitutes: z.array(z.string()).describe("Lista de ate 2 substitutos equivalentes")
});

export const MealSchema = z.object({
  name: z.string().describe("Nome da refeicao, ex: Cafe da Manha, Almoco"),
  time: z.string().describe("Horario sugerido no formato HH:MM"),
  items: z.array(MealItemSchema)
});

export const MealPlanResponseSchema = z.object({
  title: z.string().describe("Titulo do plano alimentar"),
  targetCalories: z.number(),
  targetProtein: z.number(),
  targetCarbs: z.number(),
  targetFat: z.number(),
  waterRequirementMl: z.number(),
  meals: z.array(MealSchema),
  generalInstructions: z.array(z.string()).describe("Orientacoes nutricionais complementares")
});

export type MealPlanAIResponse = z.infer<typeof MealPlanResponseSchema>;
```

### 5.2 Endpoint de Streaming com Vercel AI SDK (`app/api/ai/generate-meal-plan/route.ts`)

```typescript
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google'; // Ou @ai-sdk/openai
import { MealPlanResponseSchema } from '@/lib/ai/schemas';
import { generateLocalFallbackMealPlan } from '@/lib/ai/fallback-generator';

export const maxDuration = 60; // Extende timeout no Vercel para 60s

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientName, age, gender, weightKg, heightCm, goal, targetCalories, allergies, dislikes, mealsCount } = body;

    const prompt = `
      Voce e um nutricionista clinico sênior gerando um plano alimentar personalizado e preciso.
      
      Dados do Paciente:
      - Nome: ${patientName}
      - Idade: ${age} anos | Sexo: ${gender}
      - Peso: ${weightKg} kg | Altura: ${heightCm} cm
      - Objetivo Clinico: ${goal}
      - Meta Calorica Diaria: ${targetCalories} kcal
      - Alergias/Intolerancias: ${allergies?.join(', ') || 'Nenhuma'}
      - Aversoes Alimentares: ${dislikes?.join(', ') || 'Nenhuma'}
      - Numero de Refeicoes Desejadas: ${mealsCount || 5}

      Requisitos Obrigatorios:
      1. Utilize alimentos comuns da Tabela TACO / TBCA (Brasil).
      2. A soma das calorias e macros das refeicoes deve se aproximar rigidamente da Meta Calorica Diaria (${targetCalories} kcal).
      3. Nao inclua alimentos com as alergias ou aversoes informadas.
      4. Forneca substitutos realistas e nutricionalmente equivalentes para cada alimento.
    `;

    const result = await streamObject({
      model: google('gemini-1.5-pro'),
      schema: MealPlanResponseSchema,
      prompt: prompt,
      temperature: 0.2,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Erro na geracao por IA. Ativando Fallback Local:", error);
    
    // Retorno do plano estatico caso a chamada da API de IA falhe
    const fallbackPlan = generateLocalFallbackMealPlan(await req.json());
    return new Response(JSON.stringify(fallbackPlan), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 5.3 Motor de Contingencia Local (`lib/ai/fallback-generator.ts`)

```typescript
import { MealPlanAIResponse } from '@/lib/ai/schemas';

export function generateLocalFallbackMealPlan(input: any): MealPlanAIResponse {
  const calories = input.targetCalories || 2000;
  
  return {
    title: `Plano Alimentar Equilibrado (Modo de Seguranca) - ${input.patientName}`,
    targetCalories: calories,
    targetProtein: Math.round((calories * 0.25) / 4),
    targetCarbs: Math.round((calories * 0.50) / 4),
    targetFat: Math.round((calories * 0.25) / 9),
    waterRequirementMl: Math.round((input.weightKg || 70) * 35),
    generalInstructions: [
      "Mastigue bem os alimentos e faca as refeicoes com calma.",
      "Mantenha a ingestao de agua conforme a recomendacao diaria.",
      "Este plano foi gerado via base padrao de contingencia devido a instabilidade temporaria de conexao."
    ],
    meals: [
      {
        name: "Cafe da Manha",
        time: "07:30",
        items: [
          {
            foodName: "Ovo de galinha cozido",
            amount: 2,
            unit: "unidade",
            calories: 140,
            protein: 12,
            carbs: 1,
            fat: 10,
            substitutes: ["Omelete simples", "Tofu grelhado 100g"]
          },
          {
            foodName: "Pao integral",
            amount: 50,
            unit: "g",
            calories: 120,
            protein: 4,
            carbs: 22,
            fat: 2,
            substitutes: ["Tapioca 40g", "Cuscuz cozido 100g"]
          }
        ]
      },
      {
        name: "Almoco",
        time: "12:30",
        items: [
          {
            foodName: "Arroz branco cozido",
            amount: 150,
            unit: "g",
            calories: 190,
            protein: 3,
            carbs: 42,
            fat: 0.5,
            substitutes: ["Batata doce cozida 180g", "Mandioca cozida 150g"]
          },
          {
            foodName: "Feijao carioca cozido",
            amount: 100,
            unit: "g",
            calories: 76,
            protein: 5,
            carbs: 14,
            fat: 0.5,
            substitutes: ["Lentilha cozida 100g", "Grao de bico 90g"]
          },
          {
            foodName: "Peito de frango grelhado",
            amount: 120,
            unit: "g",
            calories: 195,
            protein: 38,
            carbs: 0,
            fat: 4,
            substitutes: ["Patinho moido 120g", "File de tilápia 140g"]
          }
        ]
      }
    ]
  };
}
```

---

## 6. Central Clinica do Paciente (Interface em Abas Estilo Nutrium)

Componente do perfil do paciente (`components/patient/PatientDetailView.tsx`) integrando todo o fluxo clinico:

```tsx
'use client';

import React, { useState } from 'react';
import { calculateEnergyRequirements } from '@/lib/nutrition-calculator';

interface PatientDetailViewProps {
  patient: any;
  onClose: () => void;
}

export function PatientDetailView({ patient, onClose }: PatientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'anamnesis' | 'anthropometry' | 'energy' | 'mealplan' | 'prescription'>('mealplan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlanData, setMealPlanData] = useState<any>(null);

  const energyReqs = calculateEnergyRequirements({
    gender: patient.gender || 'male',
    weightKg: patient.weightKg || 70,
    heightCm: patient.heightCm || 170,
    ageYears: 30,
    activityLevel: patient.activityLevel || 'moderate',
    goal: patient.goal || 'weight_loss'
  });

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          age: 30,
          gender: patient.gender,
          weightKg: patient.weightKg,
          heightCm: patient.heightCm,
          goal: patient.goal,
          targetCalories: energyReqs.targetCalories,
          allergies: patient.allergies,
          dislikes: patient.dislikes,
          mealsCount: 5
        })
      });

      const data = await response.json();
      setMealPlanData(data);
    } catch (err) {
      console.error("Erro na requisicao", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-modal flex flex-col overflow-hidden border border-navy-200">
        
        {/* Header do Paciente */}
        <div className="bg-navy-50 border-b border-navy-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-lg">
              {patient.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-800">{patient.name}</h2>
              <p className="text-xs text-navy-500">
                {patient.heightCm} cm | {patient.weightKg} kg | IMC: {(patient.weightKg / Math.pow(patient.heightCm/100, 2)).toFixed(1)} kg/m²
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700 font-bold text-xl px-2">
            X
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-navy-200 bg-white px-6 gap-2">
          {[
            { id: 'anamnesis', label: '1. Anamnese' },
            { id: 'anthropometry', label: '2. Antropometria' },
            { id: 'energy', label: '3. Calculos Energéticos' },
            { id: 'mealplan', label: '4. Plano Alimentar' },
            { id: 'prescription', label: '5. Prescricao e Exportacao' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-navy-500 hover:text-navy-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-navy-50/50">
          {activeTab === 'energy' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-navy-200 shadow-card">
                <span className="text-xs text-navy-400 font-semibold uppercase">TMB (Mifflin-St Jeor)</span>
                <p className="text-2xl font-bold text-navy-800 mt-1">{energyReqs.bmr} kcal</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-navy-200 shadow-card">
                <span className="text-xs text-navy-400 font-semibold uppercase">GET / TDEE</span>
                <p className="text-2xl font-bold text-navy-800 mt-1">{energyReqs.tdee} kcal</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-navy-200 shadow-card bg-brand-50/30">
                <span className="text-xs text-brand-700 font-semibold uppercase">Meta Calorica Recomendada</span>
                <p className="text-2xl font-bold text-brand-600 mt-1">{energyReqs.targetCalories} kcal</p>
              </div>
            </div>
          )}

          {activeTab === 'mealplan' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-navy-200">
                <div>
                  <h3 className="font-bold text-navy-800">Plano Alimentar Inteligente</h3>
                  <p className="text-xs text-navy-500">Gere cardapios completos alinhados as metas e restricoes do paciente.</p>
                </div>
                <button
                  onClick={handleGenerateAIPlan}
                  disabled={isGenerating}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? 'Gerando Plano com IA...' : 'Gerar Plano com IA'}
                </button>
              </div>

              {mealPlanData && (
                <div className="bg-white p-6 rounded-lg border border-navy-200 space-y-6">
                  <div className="border-b border-navy-100 pb-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold text-navy-800">{mealPlanData.title}</h4>
                      <p className="text-xs text-navy-500 mt-0.5">
                        Calorias: {mealPlanData.targetCalories} kcal | P: {mealPlanData.targetProtein}g | C: {mealPlanData.targetCarbs}g | G: {mealPlanData.targetFat}g
                      </p>
                    </div>
                    <span className="bg-brand-100 text-brand-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      Agua Recomendada: {mealPlanData.waterRequirementMl} ml/dia
                    </span>
                  </div>

                  {mealPlanData.meals.map((meal: any, idx: number) => (
                    <div key={idx} className="border border-navy-200 rounded-lg overflow-hidden">
                      <div className="bg-navy-50 px-4 py-2 flex justify-between items-center border-b border-navy-200">
                        <span className="font-bold text-sm text-navy-800">{meal.name}</span>
                        <span className="text-xs font-semibold text-navy-500">{meal.time}</span>
                      </div>
                      <div className="divide-y divide-navy-100">
                        {meal.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="p-3 text-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium text-navy-800">{item.foodName} - {item.amount} {item.unit}</p>
                              {item.substitutes?.length > 0 && (
                                <p className="text-xs text-navy-400 mt-0.5">
                                  Substitutos: {item.substitutes.join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-navy-500 font-mono">
                              {item.calories} kcal | P: {item.protein}g C: {item.carbs}g G: {item.fat}g
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Formatação de Mensagem de Retorno via WhatsApp (`lib/whatsapp-formatter.ts`)

```typescript
export function generateWhatsAppReturnMessage(patientName: string, daysSinceLastVisit: number): string {
  const text = `Olá, ${patientName}! Tudo bem?

Notamos que sua última consulta nutricional foi há ${daysSinceLastVisit} dias. Para mantermos seus resultados e ajustarmos o seu plano alimentar, é fundamental realizarmos a sua avaliação de retorno.

Podemos agendar o seu horário para esta semana?
Aguardamos seu contato!`;

  return encodeURIComponent(text);
}

export function openWhatsAppChat(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/55${cleanPhone}?text=${message}`;
  window.open(url, '_blank');
}
```

---

## 8. Checklist Sequencial de Execucao

- [ ] **Fase 1: Atualizacao do Design System e Estilos**
  - Aplicar `tailwind.config.ts` com paleta verde esmeralda (`#09B291`) e tons slate/navy.
  - Substituir o fundo escuro global pelo fundo claro `#F8FAFC`.
- [ ] **Fase 2: Estruturacao do Banco de Dados**
  - Aplicar `prisma/schema.prisma` ao Neon DB executando `npx prisma db push`.
- [ ] **Fase 3: Implementacao dos Calculos e Motores de IA**
  - Criar `lib/nutrition-calculator.ts` com formulas clinicas.
  - Criar `lib/ai/schemas.ts` com os objetos Zod tipados.
  - Criar `lib/ai/fallback-generator.ts` para garantia de alta disponibilidade.
  - Implementar a rota de API `/app/api/ai/generate-meal-plan/route.ts` com Vercel AI SDK.
- [ ] **Fase 4: Reformulacao das Interfaces de Pacientes**
  - Atualizar o Dashboard para apresentar dados resumidos no formato limpo.
  - Substituir o modal antigo de paciente pelo `PatientDetailView.tsx` estruturado em abas.
- [ ] **Fase 5: Validacao de Fluxos e Integracao WhatsApp**
  - Testar o botao de acao do WhatsApp direto do Dashboard para pacientes em alerta.
  - Testar a geracao de plano por IA e simular falha de rede para garantir o funcionamento do fallback estatico.

---
*Documento de Especificacao Tecnica para Implementacao no NuFey*