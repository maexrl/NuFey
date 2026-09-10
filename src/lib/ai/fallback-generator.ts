import type { PlanoSemanalEstrutura } from '../neonData.ts';

export function generateLocalFallbackMealPlan(patientData: any): PlanoSemanalEstrutura {
  const name = patientData?.nome || patientData?.patientName || 'Paciente';
  const rawObj = (
    (patientData?.objetivos && Array.isArray(patientData.objetivos) ? patientData.objetivos.join(' ') : '') +
    ' ' +
    (patientData?.objetivo_texto || '') +
    ' ' +
    (patientData?.dadosPaciente || '')
  ).toLowerCase();

  const rawRestr = (
    (patientData?.restricoes_alimentares && Array.isArray(patientData.restricoes_alimentares) ? patientData.restricoes_alimentares.join(' ') : '') +
    ' ' +
    (patientData?.alergias && Array.isArray(patientData.alergias) ? patientData.alergias.join(' ') : '') +
    ' ' +
    (patientData?.patologias && Array.isArray(patientData.patologias) ? patientData.patologias.join(' ') : '') +
    ' ' +
    (patientData?.dadosPaciente || '')
  ).toLowerCase();

  const isEmagrecimento = rawObj.includes('emagrec') || rawObj.includes('perda') || rawObj.includes('gordura');
  const isHipertrofia = rawObj.includes('hiper') || rawObj.includes('massa') || rawObj.includes('músculo');
  const isDiabetes = rawRestr.includes('diabet') || rawRestr.includes('glicem') || rawRestr.includes('açúcar');
  const isSemLactose = rawRestr.includes('lactose') || rawRestr.includes('leite');
  const isSemGluten = rawRestr.includes('glúten') || rawRestr.includes('gluten') || rawRestr.includes('celíac') || rawRestr.includes('trigo');
  const isSemCarneVermelha = rawRestr.includes('carne vermelha');
  const isSemOvo = rawRestr.includes('ovo') || rawRestr.includes('ovos');

  const pesoKg = parseFloat(patientData?.peso_inicial) || 70;
  const alturaM = parseFloat(patientData?.altura) || 1.70;
  const imc = pesoKg / (alturaM * alturaM);

  // Cálculo de gasto calórico básico personalizado pelo perfil e biometria do paciente
  let targetCalories = Math.round((10 * pesoKg) + (6.25 * (alturaM * 100)) - 160);
  if (isEmagrecimento || imc > 25) targetCalories = Math.round(pesoKg * 24);
  if (isHipertrofia) targetCalories = Math.round(pesoKg * 36);

  const proteinas_g = Math.round(pesoKg * (isHipertrofia ? 2.0 : (isEmagrecimento ? 1.8 : 1.5)));
  const gorduras_g = Math.round((targetCalories * 0.25) / 9);
  const carboidratos_g = Math.round((targetCalories - (proteinas_g * 4 + gorduras_g * 9)) / 4);

  const getCafeOptions = (diaIdx: number): string[] => {
    let pao = isSemGluten ? '1 tapioca fina (30g) ou cuscuz de milho' : '2 fatias de pão 100% integral';
    let bebida = isSemLactose ? '1 copo (200ml) de leite vegetais ou chá natural' : '1 copo (200ml) de leite desnatado ou café com leite desnatado';
    let proteina = isSemOvo ? '2 fatias de queijo branco magro ou tofu temperado' : '2 ovos mexidos com azeite de oliva e chia';
    let fruta = isDiabetes ? '1 fatia média de mamão com aveia em flocos' : (diaIdx % 2 === 0 ? '1 fatia de mamão papaia' : '1 banana prata com aveia');

    if (isHipertrofia) {
      proteina = isSemOvo ? '100g de frango desfiado com cottage' : '3 ovos mexidos + 1 fatia de queijo branco';
      fruta = '1 banana grande com 2 colheres de sopa de aveia e pasta de amendoim';
    } else if (isEmagrecimento) {
      proteina = isSemOvo ? '2 fatias de queijo cottage sem gordura' : '2 ovos cozidos com orégano';
      fruta = '1 fatia média de melão ou morangos frescos (100g)';
    }

    return [
      `${pao} acompanhado de ${proteina}`,
      `1 xícara de café preto ou chá sem açúcar`,
      fruta,
      bebida,
      `1 porção de sementes funcionais (chia ou linhaça 10g)`,
    ];
  };

  const getLancheManhaOptions = (diaIdx: number): string[] => {
    let iogurte = isSemLactose ? '1 iogurte de coco ou vegetal (150g)' : '1 iogurte natural desnatado (170g)';
    let fruta = diaIdx % 2 === 0 ? '1 maçã verde com casca' : '1 pera williams fatiada';
    let oleaginosa = '3 castanhas do Pará ou 6 amêndoas torradas';

    if (isHipertrofia) {
      oleaginosa = '1 punhado de mix de castanhas e nozes (30g) + 1 dose de proteína em pó';
    }

    return [
      iogurte,
      fruta,
      oleaginosa,
      '200ml de água de coco natural',
    ];
  };

  const getAlmocoOptions = (diaIdx: number): string[] => {
    let carb = isSemGluten ? '4 colheres de mandioca cozida ou batata doce (120g)' : '4 colheres de sopa de arroz integral com gergelim';
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
    let base = isSemGluten ? '1 tapioca fina com queijo branco' : '1 fatia de pão integral com creme de ricota';
    let suco = diaIdx % 2 === 0 ? '1 copo de suco de maracujá natural (250ml)' : '1 copo de limonada suíça sem açúcar';

    if (isHipertrofia) {
      base = '2 tapiocas finas com peito de frango desfiado e queijo branco';
    }

    return [
      base,
      suco,
      '1 kiwi fatiado ou 1 porção de morangos frescos',
      '1 xícara de chá de camomila morno',
    ];
  };

  const getJantarOptions = (diaIdx: number): string[] => {
    let proteina = isSemOvo ? '150g de filé de peixe assado ou tilápia grelhada' : (diaIdx % 2 === 0 ? 'Omelete com 2 ovos, espinafre e tomate' : '150g de filé de peixe assado ao forno com ervas');
    let acompanhamento = isSemGluten ? '1 porção média de purê de batata doce (100g)' : '1 prato de sopa de legumes com frango desfiado';
    let salada = 'Salada de folhas verdes escuras com azeite de oliva e limão';

    if (isEmagrecimento) {
      proteina = isSemOvo ? '130g de peito de frango desfiado com legumes' : 'Omelete com 2 claras e 1 ovo inteiro, abobrinha e orégano';
      acompanhamento = '1 prato fundo de sopa leve de legumes e peito de frango';
    }

    return [
      proteina,
      acompanhamento,
      salada,
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

  const shoppingList = [
    isSemGluten ? 'Goma de tapioca ou mandioca' : 'Pão 100% integral',
    isSemLactose ? 'Leite de amêndoas / vegetal' : 'Leite desnatado e Iogurte natural',
    isSemOvo ? 'Tofu e Peito de Frango' : 'Ovos caipiras frescos',
    isSemCarneVermelha ? 'Peito de frango e Filés de tilápia' : 'Patinho moído magro e Peito de frango',
    'Arroz integral ou Batata doce',
    'Feijão carioca e Lentilha',
    'Salada variada (alface, rúcula, cenoura, tomate cereja)',
    'Azeite de oliva extravirgem',
    'Sementes de chia e linhaça',
    'Frutas frescas (banana, mamão, maçã verde, morangos)',
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
    resumo_nutricional: {
      calorias_totais: targetCalories,
      carboidratos_g,
      proteinas_g,
      gorduras_g,
    },
    lista_compras: shoppingList,
    status: 'Aprovado',
  };
}
