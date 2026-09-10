import type { PlanoSemanalEstrutura } from '../neonData.ts';

export function generateLocalFallbackMealPlan(patientData: any): PlanoSemanalEstrutura {
  // 1. Extração completa e higienização dos dados do paciente
  const name = patientData?.nome || patientData?.patientName || 'Paciente';
  const pesoKg = parseFloat(patientData?.peso_inicial || patientData?.peso) || 70;
  const alturaM = parseFloat(patientData?.altura) || 1.70;
  const imc = pesoKg / (alturaM * alturaM);

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

  const rawRoutine = (
    (patientData?.medicamentos || '') +
    ' ' +
    (patientData?.suplementos || '') +
    ' ' +
    (patientData?.observacoes || '') +
    ' ' +
    (patientData?.dadosPaciente || '')
  ).toLowerCase();

  // Flags Clínicas e Pessoais
  const isEmagrecimento = rawObj.includes('emagrec') || rawObj.includes('perda') || rawObj.includes('gordura') || imc >= 25;
  const isHipertrofia = rawObj.includes('hiper') || rawObj.includes('massa') || rawObj.includes('músculo') || rawObj.includes('força');
  
  const isDiabetes = rawRestr.includes('diabet') || rawRestr.includes('glicem') || rawRestr.includes('açúcar') || rawRestr.includes('insulina');
  const isHipertensao = rawRestr.includes('hipertens') || rawRestr.includes('pressão') || rawRestr.includes('sódio');
  const isSemLactose = rawRestr.includes('lactose') || rawRestr.includes('leite') || rawRestr.includes('derivados');
  const isSemGluten = rawRestr.includes('glúten') || rawRestr.includes('gluten') || rawRestr.includes('celíac') || rawRestr.includes('trigo');
  const isVegetariano = rawRestr.includes('vegetari') || rawRestr.includes('vegano') || rawRestr.includes('sem carne');
  const isSemOvo = rawRestr.includes('ovo') || rawRestr.includes('ovos') || rawRestr.includes('alergia a ovo');
  const isGastrite = rawRestr.includes('gastr') || rawRestr.includes('reflux') || rawRestr.includes('estômago');

  const isWheySuplemento = rawRoutine.includes('whey') || rawRoutine.includes('proteína') || rawRoutine.includes('creatina');

  // Rotina de Horários
  const horarioAcorda = patientData?.horario_acorda || '07:00';
  const horarioDorme = patientData?.horario_dorme || '23:00';
  const refeicoesPorDia = parseInt(patientData?.refeicoes_por_dia || 5, 10);
  const litrosAgua = patientData?.litros_agua || 2.5;

  // 2. Cálculo Metabólico Personalizado (Mifflin-St Jeor / Harris-Benedict)
  let targetCalories = Math.round((10 * pesoKg) + (6.25 * (alturaM * 100)) - 160);
  if (isEmagrecimento) targetCalories = Math.round(pesoKg * 23);
  if (isHipertrofia) targetCalories = Math.round(pesoKg * 35);
  if (targetCalories < 1200) targetCalories = 1450;

  const proteinas_g = Math.round(pesoKg * (isHipertrofia ? 2.1 : (isEmagrecimento ? 1.8 : 1.5)));
  const gorduras_g = Math.round((targetCalories * 0.25) / 9);
  const carboidratos_g = Math.round((targetCalories - (proteinas_g * 4 + gorduras_g * 9)) / 4);

  // 3. Montagem dos Cardápios Adaptados para o Perfil Clínico
  const getCafeOptions = (diaIdx: number): string[] => {
    let pao = isSemGluten ? '1 tapioca fina (35g) ou cuscuz de milho' : '2 fatias de pão 100% integral (50g)';
    let bebida = isSemLactose ? '1 copo (200ml) de bebida de amêndoas ou aveia' : '1 xícara de café com leite desnatado (200ml)';
    let proteina = isSemOvo 
      ? '2 fatias de queijo cottage sem lactose ou tofu temperado (60g)' 
      : (isVegetariano ? '2 ovos mexidos com azeite de oliva e orégano' : '2 ovos mexidos ou mexido de frango desfiado (60g)');
    
    let fruta = isDiabetes 
      ? '1 fatia média de mamão papaia com 1 colher de chia (10g)' 
      : (diaIdx % 2 === 0 ? '1 banana prata fatiada com aveia' : '1 fatia de mamão papaia com sementes');

    if (isHipertrofia) {
      proteina = isSemOvo ? '80g de tofu grelhado com gergelim' : '3 ovos mexidos + 1 fatia de queijo branco magro';
      fruta = '1 banana grande com 2 colheres de sopa de aveia em flocos e pasta de amendoim (15g)';
    } else if (isEmagrecimento) {
      proteina = isSemOvo ? '2 colheres de sopa de cottage zera gordura' : '2 ovos cozidos com pitada de azeite';
      fruta = '100g de morangos frescos ou 1 fatia de melão';
    }

    return [
      `⏰ Horário sugerido: ${horarioAcorda} (${refeicoesPorDia} refeições/dia) — ${pao} acompanhado de ${proteina}`,
      `1 xícara (150ml) de café preto sem açúcar ou chá verde`,
      `Fruta: ${fruta}`,
      `Bebida: ${bebida}`,
      `Suplementação/Ajuste: 1 colher de chá de sementes funcionais (chia ou linhaça 10g)`,
    ];
  };

  const getLancheManhaOptions = (diaIdx: number): string[] => {
    let iogurte = isSemLactose ? '1 iogurte vegetal de coco ou aveia (150g)' : '1 iogurte natural desnatado sem adição de açúcares (170g)';
    let fruta = diaIdx % 2 === 0 ? '1 maçã verde com casca' : '1 pera fatiada com casca';
    let oleaginosa = isHipertensao ? '3 castanhas do Pará sem sal (15g)' : '6 amêndoas torradas sem sal (15g)';

    if (isDiabetes) {
      fruta = '1 porção de morangos ou mirtilos frescos (100g)';
    }

    if (isWheySuplemento) {
      iogurte = `${iogurte} misturado com 1 dose de proteína em pó / suplementação prescrita`;
    }

    return [
      `⏰ Horário sugerido: 10:00 — ${iogurte}`,
      `Fruta com baixo índice glicêmico: ${fruta}`,
      `Gordura boa: ${oleaginosa}`,
      `Hidratação: 1 copo (250ml) de água ou chá natural de hortelã sem açúcar`,
    ];
  };

  const getAlmocoOptions = (diaIdx: number): string[] => {
    let carb = isSemGluten ? '4 colheres de sopa de batata doce ou mandioca cozida (120g)' : '4 colheres de sopa de arroz integral cozido (100g)';
    let leguminosa = diaIdx % 2 === 0 ? '1 concha média de feijão carioca temperado com alho e louro' : '1 concha média de lentilha ou grão-de-bico cozido';
    
    let carne = isVegetariano 
      ? '150g de tofu grelhado ou 1 xícara de hambúrguer de lentilha' 
      : (diaIdx % 2 === 0 ? '150g de peito de frango grelhado no azeite com ervas' : '150g de filé de tilápia assado no forno');
    
    let salada = 'Prato cheio de salada colorida (alface americana, rúcula, cenoura ralada, tomate cereja)';

    if (isGastrite) {
      salada = 'Salada de legumes cozidos no vapor (cenoura, chuchu e abobrinha) sem pimenta ou molhos ácidos';
    }

    if (isEmagrecimento) {
      carb = isSemGluten ? '3 colheres de batata doce (90g)' : '3 colheres de arroz integral (80g)';
      carne = isVegetariano ? '130g de tofu grelhado' : '140g de peito de frango grelhado';
    } else if (isHipertrofia) {
      carb = isSemGluten ? '6 colheres de mandioca cozida (180g)' : '6 colheres de arroz integral (180g)';
      carne = isVegetariano ? '180g de hambúrguer de grão-de-bico' : '180g de peito de frango ou patinho moído magro';
    }

    return [
      `⏰ Horário sugerido: 12:30 — Carboidrato complexo: ${carb}`,
      `Proteína principal: ${carne}`,
      `Leguminosa rica em fibras: ${leguminosa}`,
      `Vegetais/Salada: ${salada}`,
      `Tempero: 1 colher de sobremesa (5ml) de azeite de oliva extravirgem e limão`,
    ];
  };

  const getLancheTardeOptions = (diaIdx: number): string[] => {
    let base = isSemGluten 
      ? '1 tapioca fina com cottage sem lactose ou pasta de gergelim' 
      : '1 fatia de pão integral tostado com cremoso light';
    
    let bebida = diaIdx % 2 === 0 ? '1 copo (200ml) de suco de maracujá sem açúcar' : '1 xícara de chá de camomila ou erva-doce';

    return [
      `⏰ Horário sugerido: 16:00 — ${base}`,
      `Bebida funcional: ${bebida}`,
      `1 fatia pequena de kiwi ou 5 morangos frescos`,
      `Consumo de água recomendado até o momento: ${(litrosAgua / 2).toFixed(1)}L`,
    ];
  };

  const getJantarOptions = (diaIdx: number): string[] => {
    let proteina = isVegetariano 
      ? '140g de tofu temperado com ervas ou cogumelos shimeji refogados' 
      : (isSemOvo ? '150g de filé de peixe assado com ervas finas' : (diaIdx % 2 === 0 ? 'Omelete leve com 2 ovos, espinafre e tomate cereja' : '140g de filé de tilápia ou frango desfiado'));
    
    let acompanhamento = isSemGluten ? '1 porção média de purê de batata doce (100g)' : '1 prato de sopa leve de legumes com frango ou lentilha';
    let salada = 'Salada de folhas verdes escuras com azeite de oliva e orégano';

    if (isEmagrecimento) {
      acompanhamento = '1 prato fundo de sopa leve de abobrinha, xuchu e peito de frango desfiado';
    }

    return [
      `⏰ Horário sugerido: 19:30 — Proteína digestível: ${proteina}`,
      `Acompanhamento leve: ${acompanhamento}`,
      `Salada: ${salada}`,
      `Infusão relaxante: 1 xícara (200ml) de chá de camomila ou mulungu antes de dormir (às ${horarioDorme})`,
    ];
  };

  const diasNome = [
    `Segunda-feira — Plano Exclusivo (${name})`,
    `Terça-feira — Plano Exclusivo (${name})`,
    `Quarta-feira — Plano Exclusivo (${name})`,
    `Quinta-feira — Plano Exclusivo (${name})`,
    `Sexta-feira — Plano Exclusivo (${name})`,
    `Sábado — Plano Exclusivo (${name})`,
    `Domingo — Plano Exclusivo (${name})`,
  ];

  const shoppingList = [
    isSemGluten ? 'Goma de tapioca e Batata doce' : 'Pão 100% integral e Arroz integral',
    isSemLactose ? 'Leite vegetal de amêndoas / aveia e Iogurte de coco' : 'Leite desnatado e Iogurte natural sem açúcar',
    isSemOvo ? 'Tofu orgânico e Peito de frango' : 'Ovos caipiras frescos',
    isVegetariano ? 'Tofu, Grão-de-bico, Lentilha e Cogumelos' : 'Peito de frango, Filés de tilápia e Patinho moído magro',
    'Feijão carioca e Lentilha',
    'Salada variada (alface, rúcula, cenoura, tomate cereja, abobrinha)',
    'Azeite de oliva extravirgem e Sementes de chia/linhaça',
    `Frutas adaptadas (mamão papaia, morangos, maçã verde, kiwi, banana)`,
    `Garrafa de água para meta diária de ${litrosAgua}L`,
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
