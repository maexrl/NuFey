import type { PlanoSemanalEstrutura } from '../neonData.ts';


export function generateLocalFallbackMealPlan(patientData: any): PlanoSemanalEstrutura {
  const patientName = patientData?.nome || patientData?.patientName || 'Paciente';
  
  const dias = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  return {
    plano_semanal: dias.map((dia) => ({
      dia: `${dia} — ${patientName}`,
      refeicoes: {
        cafe_da_manha: [
          '2 fatias de pão integral com 2 ovos mexidos',
          '1 xícara (200ml) de café preto sem açúcar ou com adoçante natural',
          '1 fatia de mamão papaia com 1 colher de sopa de sementes de chia',
          '1 copo (200ml) de leite desnatado ou bebida vegetal de amêndoas',
          '1 fatia pequena de queijo minas frescal',
        ],
        lanche_manha: [
          '1 iogurte natural desnatado sem açúcar (170g)',
          '1 porção de castanhas do Pará ou amêndoas (4 unidades)',
          '1 maçã fuji ou verde com casca',
          'Chá verde ou de camomila morno (200ml) sem açúcar',
          '1 fatia fina de bolo integral de banana caseiro',
        ],
        almoco: [
          '4 colheres de sopa de arroz integral cozido',
          '1 concha média de feijão carioca ou preto rico em ferro',
          '150g de peito de frango grelhado ou filé de tilápia acebolado',
          'Prato grande de salada colorida (alface americana, cenoura ralada, tomate)',
          '1 colher de sobremesa de azeite de oliva extravirgem',
        ],
        lanche_tarde: [
          '1 tapioca fina com queijo cottage ou ovos mexidos',
          '1 copo de suco de laranja natural ou polpa de acerola (250ml)',
          '1 banana prata fatiada com 1 colher de farelo de aveia',
          '1 punhado de mix de nozes e frutas secas (30g)',
          '1 porção de frutas vermelhas (morangos ou mirtilos)',
        ],
        jantar: [
          'Omelete com 2 ovos, espinafre, tomate cereja e orégano',
          '1 prato fundo de sopa de legumes com peito de frango desfiado',
          'Salada de folhas verdes escuras (rúcula, agrião) com atum em água',
          '150g de filé de peixe assado ou peito de peru grelhado',
          '1 porção média de purê de batata doce ou mandioca (100g)',
        ],
      },
    })),
  };
}
