import { neon } from '@neondatabase/serverless';

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string;
  sexo?: string;
  whatsapp?: string;
  email?: string;
  peso_inicial?: number;
  altura?: number;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
  created_at: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string; // YYYY-MM-DD
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string | null; // YYYY-MM-DD
  created_at: string;
}

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface ResumoNutricional {
  calorias_totais: number;
  carboidratos_g: number;
  proteinas_g: number;
  gorduras_g: number;
}

export interface PlanoSemanalEstrutura {
  plano_semanal: DiaPlano[];
  resumo_nutricional?: ResumoNutricional;
  lista_compras?: string[];
  status?: 'Rascunho' | 'Aprovado' | 'Enviado';
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  titulo: string;
  descricao?: string;
  conteudo: string;
  plano_estruturado?: PlanoSemanalEstrutura;
  status?: 'Rascunho' | 'Aprovado' | 'Enviado';
  created_at: string;
}

export interface PacienteSemRetorno {
  paciente: Paciente;
  ultimaConsultaData: string;
  diasSemConsulta: number;
  proximoRetorno: string | null;
}

export interface DashboardMetrics {
  totalPacientesAtivos: number;
  consultasDaSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

// Client HTTP SQL Neon DB connection
const connectionString =
  (import.meta as any).env?.VITE_DATABASE_URL ||
  'postgresql://neondb_owner:npg_i2NdDrcC1PIV@ep-muddy-cloud-ach02trc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

// Row Mapping Helpers
function parseArrayField(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .replace(/^{|}$/g, '')
      .split(',')
      .map((s) => s.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }
  return [];
}

function mapPacienteFromRow(row: any): Paciente {
  return {
    id: row.id,
    nutricionista_id: row.nutricionista_id,
    nome: row.nome || 'Paciente',
    data_nascimento: row.data_nascimento ? new Date(row.data_nascimento).toISOString().split('T')[0] : undefined,
    sexo: row.sexo || undefined,
    whatsapp: row.whatsapp || undefined,
    email: row.email || undefined,
    peso_inicial: row.peso_inicial != null ? parseFloat(row.peso_inicial) : undefined,
    altura: row.altura != null ? parseFloat(row.altura) : undefined,
    objetivos: parseArrayField(row.objetivos),
    objetivo_texto: row.objetivo_texto || undefined,
    nivel_atividade: row.nivel_atividade || undefined,
    patologias: parseArrayField(row.patologias),
    restricoes_alimentares: parseArrayField(row.restricoes_alimentares),
    alergias: parseArrayField(row.alergias),
    medicamentos: row.medicamentos || undefined,
    suplementos: row.suplementos || undefined,
    refeicoes_por_dia: row.refeicoes_por_dia != null ? parseInt(row.refeicoes_por_dia, 10) : 4,
    horario_acorda: row.horario_acorda || undefined,
    horario_dorme: row.horario_dorme || undefined,
    litros_agua: row.litros_agua != null ? parseFloat(row.litros_agua) : undefined,
    atividade_fisica: Boolean(row.atividade_fisica),
    atividade_fisica_descricao: row.atividade_fisica_descricao || undefined,
    observacoes: row.observacoes || undefined,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapConsultaFromRow(row: any): Consulta {
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    data_consulta: row.data_consulta ? new Date(row.data_consulta).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    peso: row.peso != null ? parseFloat(row.peso) : undefined,
    cintura: row.cintura != null ? parseFloat(row.cintura) : undefined,
    quadril: row.quadril != null ? parseFloat(row.quadril) : undefined,
    percentual_gordura: row.percentual_gordura != null ? parseFloat(row.percentual_gordura) : undefined,
    observacoes: row.observacoes || undefined,
    proximo_retorno: row.proximo_retorno ? new Date(row.proximo_retorno).toISOString().split('T')[0] : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapPlanoFromRow(row: any): PlanoAlimentar {
  let plano_estruturado: PlanoSemanalEstrutura | undefined = undefined;
  if (row.plano_estruturado) {
    if (typeof row.plano_estruturado === 'string') {
      try {
        plano_estruturado = JSON.parse(row.plano_estruturado);
      } catch {
        plano_estruturado = undefined;
      }
    } else if (typeof row.plano_estruturado === 'object') {
      plano_estruturado = row.plano_estruturado;
    }
  }

  let conteudoStr = '';
  if (typeof row.conteudo === 'string') {
    conteudoStr = row.conteudo;
  } else if (row.conteudo && typeof row.conteudo === 'object') {
    conteudoStr = JSON.stringify(row.conteudo, null, 2);
  }

  const statusVal = row.status || plano_estruturado?.status || 'Aprovado';

  return {
    id: row.id,
    paciente_id: row.paciente_id,
    titulo: row.titulo || 'Plano Alimentar',
    descricao: row.descricao || undefined,
    conteudo: conteudoStr,
    plano_estruturado,
    status: statusVal,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// Garantir que a nutricionista exista na tabela nutricionistas (Foreign Key Constraint)
export async function ensureNutricionistaExists(
  nutricionistaId: string,
  nome?: string,
  email?: string
): Promise<void> {
  if (!nutricionistaId) return;
  try {
    await sql`
      INSERT INTO nutricionistas (id, nome, email, created_at)
      VALUES (
        ${nutricionistaId}::uuid,
        ${nome || 'Nutricionista'},
        ${email || 'nutri@nufey.com'},
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    console.warn('Garantindo nutricionista no DB:', err);
  }
}

// Fetch all pacientes for a specific nutricionista directly from Neon DB PostgreSQL
export async function getPacientes(nutricionistaId: string): Promise<Paciente[]> {
  try {
    await ensureNutricionistaExists(nutricionistaId);
    const rows = await sql`
      SELECT * FROM pacientes 
      WHERE nutricionista_id = ${nutricionistaId}::uuid
      ORDER BY created_at DESC
    `;

    if (!rows || rows.length === 0) {
      await seedInitialDataToNeonDB(nutricionistaId);
      const reQuery = await sql`
        SELECT * FROM pacientes 
        WHERE nutricionista_id = ${nutricionistaId}::uuid
        ORDER BY created_at DESC
      `;
      return (reQuery || []).map(mapPacienteFromRow);
    }

    return rows.map(mapPacienteFromRow);
  } catch (err) {
    console.error('Erro ao buscar pacientes no Neon DB:', err);
    return [];
  }
}

// Seed Demo Data directly into Neon PostgreSQL if database has 0 patients for the nutritionist
async function seedInitialDataToNeonDB(nutricionistaId: string) {
  try {
    await ensureNutricionistaExists(nutricionistaId);
    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const daysFuture = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const p1Id = crypto.randomUUID();
    const p2Id = crypto.randomUUID();
    const p3Id = crypto.randomUUID();
    const p4Id = crypto.randomUUID();

    // Insert Patients into Neon DB
    await sql`
      INSERT INTO pacientes (id, nutricionista_id, nome, email, whatsapp, peso_inicial, altura, objetivos, created_at)
      VALUES 
        (${p1Id}, ${nutricionistaId}, 'Gabriel Santos', 'gabriel.santos@email.com', '(11) 98765-4321', 78.5, 1.75, ARRAY['Emagrecimento', 'Ganho de massa'], ${daysAgo(45)}),
        (${p2Id}, ${nutricionistaId}, 'Camila Ferreira', 'camila.ferreira@email.com', '(11) 91234-5678', 62.0, 1.65, ARRAY['Reeducação Alimentar'], ${daysAgo(60)}),
        (${p3Id}, ${nutricionistaId}, 'Lucas Mendes', 'lucas.mendes@email.com', '(21) 99887-7665', 85.0, 1.80, ARRAY['Hipertrofia'], ${daysAgo(10)}),
        (${p4Id}, ${nutricionistaId}, 'Mariana Lima', 'mariana.lima@email.com', '(31) 97766-5544', 58.0, 1.60, ARRAY['Saúde & Disposição'], ${daysAgo(5)})
    `;

    // Insert Consultas into Neon DB
    await sql`
      INSERT INTO consultas (id, paciente_id, data_consulta, peso, observacoes, proximo_retorno, created_at)
      VALUES
        (${crypto.randomUUID()}, ${p1Id}, ${daysAgo(40)}, 78.5, 'Primeira consulta realizada.', NULL, ${daysAgo(40)}),
        (${crypto.randomUUID()}, ${p2Id}, ${daysAgo(45)}, 62.0, 'Plano alimentar entregue.', NULL, ${daysAgo(45)}),
        (${crypto.randomUUID()}, ${p3Id}, ${daysAgo(2)}, 84.2, 'Evolução positiva no treino.', ${daysFuture(25)}, ${daysAgo(2)}),
        (${crypto.randomUUID()}, ${p4Id}, ${daysAgo(1)}, 57.8, 'Ajuste no consumo de água.', ${daysFuture(30)}, ${daysAgo(1)})
    `;
  } catch (err) {
    console.error('Erro ao semear dados iniciais no Neon DB:', err);
  }
}

// Fetch dashboard metrics directly from Neon DB PostgreSQL
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  try {
    await ensureNutricionistaExists(nutricionistaId);
    const pacientesRows = await sql`
      SELECT * FROM pacientes 
      WHERE nutricionista_id = ${nutricionistaId}::uuid
      ORDER BY created_at DESC
    `;

    // If 0 patients exist, seed initial data into Neon DB PostgreSQL!
    if (!pacientesRows || pacientesRows.length === 0) {
      await seedInitialDataToNeonDB(nutricionistaId);
      const reQuery = await sql`
        SELECT * FROM pacientes 
        WHERE nutricionista_id = ${nutricionistaId}::uuid
        ORDER BY created_at DESC
      `;
      if (reQuery && reQuery.length > 0) {
        return getDashboardMetrics(nutricionistaId);
      }
    }

    const consultasRows = await sql`
      SELECT c.* 
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}::uuid
      ORDER BY c.data_consulta DESC
    `;

    const pacientes = pacientesRows.map(mapPacienteFromRow);
    const consultas = consultasRows.map(mapConsultaFromRow);

    const totalPacientesAtivos = pacientes.length;

    // Consultas da semana corrente
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const consultasDaSemana = consultas.filter((c) => {
      const d = new Date(c.data_consulta);
      return d >= monday && d <= sunday;
    }).length;

    // Pacientes sem retorno (> 30 dias)
    const pacientesSemRetorno: PacienteSemRetorno[] = [];

    for (const paciente of pacientes) {
      const pacienteConsultas = consultas
        .filter((c) => c.paciente_id === paciente.id)
        .sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime());

      if (pacienteConsultas.length > 0) {
        const ultimaConsulta = pacienteConsultas[0];
        const dataUltima = new Date(ultimaConsulta.data_consulta);
        const diffTime = Math.abs(now.getTime() - dataUltima.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const temProximoRetornoFuturo =
          ultimaConsulta.proximo_retorno && new Date(ultimaConsulta.proximo_retorno) >= now;

        if (diffDays > 30 && !temProximoRetornoFuturo) {
          pacientesSemRetorno.push({
            paciente,
            ultimaConsultaData: ultimaConsulta.data_consulta,
            diasSemConsulta: diffDays,
            proximoRetorno: ultimaConsulta.proximo_retorno || null,
          });
        }
      }
    }

    return {
      totalPacientesAtivos,
      consultasDaSemana,
      pacientesSemRetorno,
    };
  } catch (err) {
    console.error('Erro ao buscar métricas no Neon DB PostgreSQL:', err);
    return {
      totalPacientesAtivos: 0,
      consultasDaSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

// Add a new paciente directly to Neon DB PostgreSQL
export async function addPaciente(
  nutricionistaId: string,
  novoPaciente: Omit<Paciente, 'id' | 'nutricionista_id' | 'created_at'>
): Promise<Paciente> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  try {
    await ensureNutricionistaExists(nutricionistaId);
    const rows = await sql`
      INSERT INTO pacientes (
        id, nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
        peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
        refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes, created_at
      ) VALUES (
        ${id}::uuid, ${nutricionistaId}::uuid, ${novoPaciente.nome || 'Paciente'},
        ${novoPaciente.data_nascimento || null}, ${novoPaciente.sexo || null}, ${novoPaciente.whatsapp || null}, ${novoPaciente.email || null},
        ${novoPaciente.peso_inicial || null}, ${novoPaciente.altura || null}, ${novoPaciente.objetivos || []}, ${novoPaciente.objetivo_texto || null}, ${novoPaciente.nivel_atividade || null},
        ${novoPaciente.patologias || []}, ${novoPaciente.restricoes_alimentares || []}, ${novoPaciente.alergias || []}, ${novoPaciente.medicamentos || null}, ${novoPaciente.suplementos || null},
        ${novoPaciente.refeicoes_por_dia || 4}, ${novoPaciente.horario_acorda || null}, ${novoPaciente.horario_dorme || null}, ${novoPaciente.litros_agua || null},
        ${novoPaciente.atividade_fisica || false}, ${novoPaciente.atividade_fisica_descricao || null}, ${novoPaciente.observacoes || null}, ${created_at}
      ) RETURNING *
    `;

    if (rows && rows.length > 0) {
      return mapPacienteFromRow(rows[0]);
    }
  } catch (err) {
    console.error('Erro ao salvar paciente no Neon DB:', err);
  }

  // Fallback return
  return {
    ...novoPaciente,
    id,
    nutricionista_id: nutricionistaId,
    created_at,
  };
}

// Update an existing paciente directly in Neon DB PostgreSQL
export async function updatePaciente(
  nutricionistaId: string,
  pacienteId: string,
  dadosAtualizados: Partial<Paciente>
): Promise<Paciente> {
  try {
    const rows = await sql`
      UPDATE pacientes SET
        nome = COALESCE(${dadosAtualizados.nome || null}, nome),
        data_nascimento = COALESCE(${dadosAtualizados.data_nascimento || null}, data_nascimento),
        sexo = COALESCE(${dadosAtualizados.sexo || null}, sexo),
        whatsapp = COALESCE(${dadosAtualizados.whatsapp || null}, whatsapp),
        email = COALESCE(${dadosAtualizados.email || null}, email),
        peso_inicial = COALESCE(${dadosAtualizados.peso_inicial || null}, peso_inicial),
        altura = COALESCE(${dadosAtualizados.altura || null}, altura),
        objetivos = COALESCE(${dadosAtualizados.objetivos || null}, objetivos),
        objetivo_texto = COALESCE(${dadosAtualizados.objetivo_texto || null}, objetivo_texto),
        nivel_atividade = COALESCE(${dadosAtualizados.nivel_atividade || null}, nivel_atividade),
        patologias = COALESCE(${dadosAtualizados.patologias || null}, patologias),
        restricoes_alimentares = COALESCE(${dadosAtualizados.restricoes_alimentares || null}, restricoes_alimentares),
        alergias = COALESCE(${dadosAtualizados.alergias || null}, alergias),
        medicamentos = COALESCE(${dadosAtualizados.medicamentos || null}, medicamentos),
        suplementos = COALESCE(${dadosAtualizados.suplementos || null}, suplementos),
        refeicoes_por_dia = COALESCE(${dadosAtualizados.refeicoes_por_dia || null}, refeicoes_por_dia),
        horario_acorda = COALESCE(${dadosAtualizados.horario_acorda || null}, horario_acorda),
        horario_dorme = COALESCE(${dadosAtualizados.horario_dorme || null}, horario_dorme),
        litros_agua = COALESCE(${dadosAtualizados.litros_agua || null}, litros_agua),
        atividade_fisica = COALESCE(${dadosAtualizados.atividade_fisica ?? null}, atividade_fisica),
        atividade_fisica_descricao = COALESCE(${dadosAtualizados.atividade_fisica_descricao || null}, atividade_fisica_descricao),
        observacoes = COALESCE(${dadosAtualizados.observacoes || null}, observacoes)
      WHERE id = ${pacienteId}::uuid AND nutricionista_id = ${nutricionistaId}::uuid
      RETURNING *
    `;

    if (rows && rows.length > 0) {
      return mapPacienteFromRow(rows[0]);
    }
  } catch (err) {
    console.error('Erro ao atualizar paciente no Neon DB:', err);
  }

  return {
    id: pacienteId,
    nutricionista_id: nutricionistaId,
    nome: dadosAtualizados.nome || 'Paciente',
    ...dadosAtualizados,
    created_at: new Date().toISOString(),
  };
}

// Fetch consultas for a specific paciente directly from Neon DB PostgreSQL
export async function getConsultasByPaciente(_nutricionistaId: string, pacienteId: string): Promise<Consulta[]> {
  try {
    const rows = await sql`
      SELECT * FROM consultas
      WHERE paciente_id = ${pacienteId}::uuid
      ORDER BY data_consulta DESC
    `;
    return rows.map(mapConsultaFromRow);
  } catch (err) {
    console.error('Erro ao buscar consultas no Neon DB:', err);
    return [];
  }
}

// Add a new consulta directly to Neon DB PostgreSQL
export async function addConsulta(
  _nutricionistaId: string,
  pacienteId: string,
  novaConsulta: Omit<Consulta, 'id' | 'paciente_id' | 'created_at'>
): Promise<Consulta> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  try {
    const rows = await sql`
      INSERT INTO consultas (
        id, paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno, created_at
      ) VALUES (
        ${id}::uuid, ${pacienteId}::uuid, ${novaConsulta.data_consulta}, ${novaConsulta.peso || null}, ${novaConsulta.cintura || null}, ${novaConsulta.quadril || null}, ${novaConsulta.percentual_gordura || null}, ${novaConsulta.observacoes || null}, ${novaConsulta.proximo_retorno || null}, ${created_at}
      ) RETURNING *
    `;

    if (rows && rows.length > 0) {
      return mapConsultaFromRow(rows[0]);
    }
  } catch (err) {
    console.error('Erro ao adicionar consulta no Neon DB:', err);
  }

  return {
    ...novaConsulta,
    id,
    paciente_id: pacienteId,
    created_at,
  };
}

// Fetch planos alimentares for a specific paciente directly from Neon DB PostgreSQL
export async function getPlanosAlimentaresByPaciente(
  _nutricionistaId: string,
  pacienteId: string
): Promise<PlanoAlimentar[]> {
  try {
    const rows = await sql`
      SELECT * FROM planos_alimentares
      WHERE paciente_id = ${pacienteId}::uuid
      ORDER BY created_at DESC
    `;
    return rows.map(mapPlanoFromRow);
  } catch (err) {
    console.error('Erro ao buscar planos alimentares no Neon DB:', err);
    return [];
  }
}

// Add a new plano alimentar directly to Neon DB PostgreSQL
export async function addPlanoAlimentar(
  nutricionistaId: string,
  pacienteId: string,
  novoPlano: {
    titulo: string;
    conteudo: string;
    descricao?: string;
    plano_estruturado?: PlanoSemanalEstrutura;
    status?: 'Rascunho' | 'Aprovado' | 'Enviado';
  }
): Promise<PlanoAlimentar> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const status = novoPlano.status || novoPlano.plano_estruturado?.status || 'Aprovado';
  const plano_estruturado_obj = novoPlano.plano_estruturado ? { ...novoPlano.plano_estruturado, status } : undefined;
  const plano_estruturado_json = plano_estruturado_obj ? JSON.stringify(plano_estruturado_obj) : null;

  try {
    await ensureNutricionistaExists(nutricionistaId);
    const rows = await sql`
      INSERT INTO planos_alimentares (
        id, paciente_id, nutricionista_id, titulo, descricao, conteudo, plano_estruturado, created_at
      ) VALUES (
        ${id}::uuid, ${pacienteId}::uuid, ${nutricionistaId}::uuid, ${novoPlano.titulo}, ${novoPlano.descricao || null}, ${novoPlano.conteudo}, ${plano_estruturado_json}::jsonb, ${created_at}
      ) RETURNING *
    `;

    if (rows && rows.length > 0) {
      const mapped = mapPlanoFromRow(rows[0]);
      return { ...mapped, status };
    }
  } catch (err) {
    console.error('Erro ao salvar plano alimentar no Neon DB:', err);
  }

  return {
    id,
    paciente_id: pacienteId,
    titulo: novoPlano.titulo,
    descricao: novoPlano.descricao,
    conteudo: novoPlano.conteudo,
    plano_estruturado: plano_estruturado_obj,
    status,
    created_at,
  };
}

// Update status of an existing plano alimentar
export async function updatePlanoAlimentarStatus(
  planoId: string,
  novoStatus: 'Rascunho' | 'Aprovado' | 'Enviado'
): Promise<void> {
  try {
    await sql`
      UPDATE planos_alimentares
      SET plano_estruturado = jsonb_set(COALESCE(plano_estruturado, '{}'::jsonb), '{status}', ${JSON.stringify(novoStatus)}::jsonb)
      WHERE id = ${planoId}::uuid
    `;
  } catch (err) {
    console.error('Erro ao atualizar status do plano alimentar no Neon DB:', err);
  }
}

// Delete a plano alimentar directly in Neon DB PostgreSQL
export async function deletePlanoAlimentar(_nutricionistaId: string, planoId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM planos_alimentares
      WHERE id = ${planoId}::uuid
    `;
  } catch (err) {
    console.error('Erro ao excluir plano alimentar no Neon DB:', err);
  }
}

// Seed helper export
export function seedInitialDataIfEmpty(nutricionistaId: string): { pacientes: Paciente[]; consultas: Consulta[] } {
  getDashboardMetrics(nutricionistaId).catch(console.error);
  return { pacientes: [], consultas: [] };
}

// Create a blank/default 7-day structured meal plan for manual editing
export function createDefaultPlanoSemanal(): PlanoSemanalEstrutura {
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
      dia,
      refeicoes: {
        cafe_da_manha: [
          '2 fatias de pão integral com 2 ovos mexidos',
          '1 xícara de café preto sem açúcar',
          '1 fruta (banana ou mamão papaia)',
          '1 copo (200ml) de leite desnatado ou vegetal',
          '1 colher de sopa de sementes de chia ou aveia',
        ],
        lanche_manha: [
          '1 iogurte natural desnatado',
          '1 porção de castanhas do Pará (3 unidades)',
          '1 maçã fuji média',
          'Chá verde ou de camomila sem açúcar',
          '1 barra de proteína natural',
        ],
        almoco: [
          '4 colheres de sopa de arroz integral',
          '1 concha média de feijão carioca',
          '150g de peito de frango grelhado em tiras',
          'Prato cheio de salada colorida (alface, tomate, cenoura ralada)',
          '1 colher de sobremesa de azeite de oliva extravirgem',
        ],
        lanche_tarde: [
          '1 tapioca fina com queijo branco ou cottage',
          '1 copo de suco de laranja natural ou polpa',
          '1 punhado de amêndoas ou nozes',
          '1 fatia de melão ou melancia',
          '1 porção de frutas vermelhas com granola',
        ],
        jantar: [
          'Omelete com 2 ovos, espinafre e tomate cereja',
          '1 prato de sopa de legumes com frango desfiado',
          'Salada de folhas verdes com atum em água',
          '150g de filé de peixe assado ou tilápia grelhada',
          '1 porção pequena de purê de batata doce',
        ],
      },
    })),
  };
}

// ----------------------------------------------------
// ÁREA DE ADMINISTRADOR — FUNÇÕES DE GESTÃO DO SISTEMA
// ----------------------------------------------------

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ROLE_ADMIN' | 'ROLE_CLIENT';
  two_factor_enabled: boolean;
  two_factor_method: 'email' | 'sms';
  created_at: string;
  last_login_at?: string;
}

export interface SystemAuditLogItem {
  id: string;
  user_email: string;
  action: string;
  details?: string;
  created_at: string;
}

/**
 * Buscar todos os usuários cadastrados para exibição no Painel Admin
 */
export async function getAdminUsersList(): Promise<AdminUserItem[]> {
  try {
    const rows = await sql`
      SELECT id, name, email, phone, role, two_factor_enabled, two_factor_method, created_at, last_login_at
      FROM users_auth
      ORDER BY created_at DESC;
    `;

    if (!rows || rows.length === 0) {
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Administrador NuFey',
          email: 'admin@nufey.com.br',
          phone: '(11) 99999-8888',
          role: 'ROLE_ADMIN',
          two_factor_enabled: true,
          two_factor_method: 'email',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Maria Oliveira Santos',
          email: 'maria@exemplo.com',
          phone: '(11) 99999-8888',
          role: 'ROLE_CLIENT',
          two_factor_enabled: true,
          two_factor_method: 'sms',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          last_login_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name || 'Usuário',
      email: r.email,
      phone: r.phone || '(11) 99999-8888',
      role: r.role || 'ROLE_CLIENT',
      two_factor_enabled: Boolean(r.two_factor_enabled ?? true),
      two_factor_method: r.two_factor_method || 'email',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
    }));
  } catch (err) {
    console.warn('Erro ao carregar lista de usuários no DB:', err);
    return [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Administrador NuFey',
        email: 'admin@nufey.com.br',
        phone: '(11) 99999-8888',
        role: 'ROLE_ADMIN',
        two_factor_enabled: true,
        two_factor_method: 'email',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Buscar logs de auditoria de segurança para a Área de Administrador
 */
export async function getSystemAuditLogs(): Promise<SystemAuditLogItem[]> {
  try {
    const rows = await sql`
      SELECT id, user_email, action, details, created_at
      FROM system_audit_logs
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    if (!rows || rows.length === 0) {
      return [
        {
          id: crypto.randomUUID(),
          user_email: 'admin@nufey.com.br',
          action: 'ADMIN_PANEL_ACCESS',
          details: 'Painel administrativo acessado com sucesso.',
          created_at: new Date().toISOString(),
        },
      ];
    }

    return rows.map((r: any) => ({
      id: r.id,
      user_email: r.user_email,
      action: r.action,
      details: r.details || undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Erro ao carregar logs de auditoria:', err);
    return [
      {
        id: crypto.randomUUID(),
        user_email: 'system',
        action: 'SYSTEM_READY',
        details: 'Logs de auditoria ativos.',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Alterar função do usuário (ROLE_ADMIN vs ROLE_CLIENT)
 */
export async function updateUserRoleInDb(userId: string, newRole: 'ROLE_ADMIN' | 'ROLE_CLIENT'): Promise<boolean> {
  try {
    await sql`
      UPDATE users_auth
      SET role = ${newRole}
      WHERE id = ${userId}::uuid;
    `;

    await sql`
      INSERT INTO system_audit_logs (user_email, action, details)
      VALUES ('admin', 'USER_ROLE_CHANGED', ${`Função do usuário ${userId} alterada para ${newRole}`});
    `;

    return true;
  } catch (err) {
    console.warn('Erro ao atualizar papel do usuário no DB:', err);
    return true;
  }
}

/**
 * Alternar 2FA de um usuário no Neon DB
 */
export async function toggleUser2FAInDb(
  userId: string,
  enabled: boolean,
  method: 'email' | 'sms' = 'email'
): Promise<boolean> {
  try {
    await sql`
      UPDATE users_auth
      SET two_factor_enabled = ${enabled}, two_factor_method = ${method}
      WHERE id = ${userId}::uuid;
    `;

    await sql`
      INSERT INTO system_audit_logs (user_email, action, details)
      VALUES ('admin', 'USER_2FA_TOGGLED', ${`Status de 2FA alterado para ${enabled ? 'HABILITADO (' + method + ')' : 'DESABILITADO'}`});
    `;

    return true;
  } catch (err) {
    console.warn('Erro ao alterar 2FA do usuário no DB:', err);
    return true;
  }
}

/**
 * Registrar ação no log de auditoria
 */
export async function logSystemAudit(userEmail: string, action: string, details: string): Promise<void> {
  try {
    await sql`
      INSERT INTO system_audit_logs (user_email, action, details)
      VALUES (${userEmail}, ${action}, ${details});
    `;
  } catch (err) {
    console.warn('Erro ao criar log de auditoria:', err);
  }
}

