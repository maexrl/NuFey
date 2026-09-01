import type { PlanoSemanalEstrutura } from '../neonData.ts';

export function generateLocalFallbackMealPlan(patientData: any): PlanoSemanalEstrutura {
  const name = patientData?.nome || patientData?.patientName || 'Paciente';
  const rawObj = (patientData?.objetivos?.join(' ') || patientData?.objetivo_texto || patientData?.dadosPaciente || '').toLowerCase();
  const rawRestr = (patientData?.restricoes_alimentares?.join(' ') || patientData?.alergias?.join(' ') || patientData?.dadosPaciente || '').toLowerCase();

  const isEmagrecimento = rawObj.includes('emagrec') || rawObj.includes('perda') || rawObj.includes('gordura');
  const isHipertrofia = rawObj.includes('hiper') || rawObj.includes('massa') || rawObj.includes('músculo');
  const isSemLactose = rawRestr.includes('lactose') || rawRestr.includes('leite');
  const isSemGluten = rawRestr.includes('glúten') || rawRestr.includes('gluten') || rawRestr.includes('celíac') || rawRestr.includes('trigo');
  const isSemCarneVermelha = rawRestr.includes('carne vermelha');

  // Helper para montar opção de café da manhã sem lactose/glúten se necessário
  const getCafeOptions = (diaIdx: number): string[] => {
    let pao = isSemGluten ? '1 tapioca fina (30g) ou cuscuz de milho' : '2 fatias de pão integral 100% grãos';
    let bebida = isSemLactose ? '1 copo (200ml) de leite de amêndoas ou suco natural de acerola' : '1 copo (200ml) de leite desnatado ou café preto sem açúcar';
    let proteina = '2 ovos mexidos com gergelim e azeite';
    let fruta = diaIdx % 2 === 0 ? '1 fatia de mamão papaia com aveia' : '1 banana prata fatiada com chia';

    if (isHipertrofia) {
      proteina = '3 ovos mexidos + 1 fatia de queijo branco (ou tofu)';
      fruta = '1 banana prata grande com 2 colheres de aveia e pasta de amendoim';
    } else if (isEmagrecimento) {
      proteina = '2 ovos cozidos com pitada de orégano';
      fruta = '1 fatia média de melão ou morangos frescos (100g)';
    }

    return [
      `${pao} com ${proteina}`,
      `1 xícara de café preto sem açúcar ou chá verde`,
      fruta,
      bebida,
      `1 porção pequena de sementes de girassol ou gergelim (10g)`,
    ];
  };

  const getLancheManhaOptions = (diaIdx: number): string[] => {
    let iogurte = isSemLactose ? '1 iogurte de leite de coco sem açúcar (150g)' : '1 iogurte natural desnatado (170g)';
    let fruta = diaIdx % 2 === 0 ? '1 maçã verde com casca' : '1 pera williams fatiada';
    let oleaginosa = '3 castanhas do Pará ou 6 amêndoas torradas';

    if (isHipertrofia) {
      oleaginosa = '1 punhado de mix de castanhas e nozes (30g) + 1 dose de proteína em pó';
    }

    return [
      iogurte,
      fruta,
      oleaginosa,
      '200ml de água de coco natural ou chá de hortelã gelado',
      '1 barra de proteína natural sem adição de açúcares',
    ];
  };

  const getAlmocoOptions = (diaIdx: number): string[] => {
    let carb = isSemGluten ? '4 colheres de mandioca cozida ou batata doce assada (120g)' : '4 colheres de sopa de arroz integral com gergelim';
    let leguminosa = diaIdx % 2 === 0 ? '1 concha média de feijão carioca' : '1 concha média de lentilha ou grão-de-bico';
    let carne = isSemCarneVermelha ? '150g de peito de frango grelhado acebolado' : (diaIdx % 3 === 0 ? '150g de patinho moído refogado' : '150g de filé de frango ou tilápia grelhada');
    let salada = 'Prato cheio de salada colorida (alface, rúcula, cenoura ralada, tomate cereja)';

    if (isEmagrecimento) {
      carb = isSemGluten ? '3 colheres de batata doce cozida (90g)' : '3 colheres de arroz integral cozido (90g)';
      carne = '140g de peito de frango ou filé de tilápia grelhado no azeite';
    } else if (isHipertrofia) {
      carb = isSemGluten ? '6 colheres de mandioca cozida (180g)' : '6 colheres de arroz integral (180g)';
      carne = '180g de peito de frango grelhado ou filé mignon suíno magro';
    }

    return [
      carb,
      leguminosa,
      carne,
      salada,
      '1 colher de sobremesa de azeite de oliva extravirgem',
    ];
  };

  const getLancheTardeOptions = (diaIdx: number): string[] => {
    let base = isSemGluten ? '1 tapioca fina com cottage (ou ovo mexido)' : '1 fatia de pão integral com creme de ricota (ou queijo vegano)';
    let suco = diaIdx % 2 === 0 ? '1 copo de suco de maracujá natural (250ml)' : '1 copo de suco de acerola ou limonada suíça';

    if (isHipertrofia) {
      base = '2 tapiocas finas com peito de frango desfiado e queijo branco';
    }

    return [
      base,
      suco,
      '1 kiwi fatiado ou 1 porção de morangos frescos',
      '1 xícara de chá de camomila ou erva-doce morno',
      '1 porção de sementes de abóbora tostadas (15g)',
    ];
  };

  const getJantarOptions = (diaIdx: number): string[] => {
    let proteina = diaIdx % 2 === 0 ? 'Omelete com 2 ovos, espinafre e tomate' : '150g de filé de peixe assado ao forno com ervas';
    let acompanhamento = isSemGluten ? '1 porção média de purê de batata doce (100g)' : '1 prato de sopa de legumes com frango desfiado';
    let salada = 'Salada de folhas verdes escuras com azeite de oliva e limão';

    if (isEmagrecimento) {
      proteina = 'Omelete com 2 claras e 1 ovo inteiro, com abobrinha e orégano';
      acompanhamento = '1 prato fundo de sopa leve de legumes e peito de frango';
    }

    return [
      proteina,
      acompanhamento,
      salada,
      '1 filé de frango ou tilápia grelhada na frigideira antiaderente',
      'Chá de hortelã ou cidreira morno antes de dormir (200ml)',
    ];
  };

  const diasNome = [
    `Segunda-feira (${name})`,
    `Terça-feira (${name})`,
    `Quarta-feira (${name})`,
    `Quinta-feira (${name})`,
    `Sexta-feira (${name})`,
    `Sábado (${name})`,
    `Domingo (${name})`,
  ];

  return {
    plano_semanal: diasNome.map((dia, idx) => ({
      dia,
      refeicoes: {
        cafe_da_manha: getCafeOptions(idx),
        lanche_manha: getLancheManhaOptions(idx),
        almoco: getAlmocoOptions(idx),
        lanche_tarde: getLancheTardeOptions(idx),
        jantar: getJantarOptions(idx),
      },
    })),
  };
}
