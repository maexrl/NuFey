
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

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  titulo: string;
  descricao?: string;
  conteudo: string;
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

const STORAGE_PACIENTES_KEY = 'nufey_pacientes_data';
const STORAGE_CONSULTAS_KEY = 'nufey_consultas_data';

// Helper to get local data
function getLocalPacientes(nutricionistaId: string): Paciente[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PACIENTES_KEY}_${nutricionistaId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPacientes(nutricionistaId: string, pacientes: Paciente[]) {
  try {
    localStorage.setItem(`${STORAGE_PACIENTES_KEY}_${nutricionistaId}`, JSON.stringify(pacientes));
  } catch (e) {
    console.error('Erro ao salvar pacientes localmente', e);
  }
}

function getLocalConsultas(nutricionistaId: string): Consulta[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CONSULTAS_KEY}_${nutricionistaId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConsultas(nutricionistaId: string, consultas: Consulta[]) {
  try {
    localStorage.setItem(`${STORAGE_CONSULTAS_KEY}_${nutricionistaId}`, JSON.stringify(consultas));
  } catch (e) {
    console.error('Erro ao salvar consultas localmente', e);
  }
}

// Seed demo data if nutritionist has no patients yet so the dashboard is vibrant and immediately usable
export function seedInitialDataIfEmpty(nutricionistaId: string): { pacientes: Paciente[]; consultas: Consulta[] } {
  let pacientes = getLocalPacientes(nutricionistaId);
  let consultas = getLocalConsultas(nutricionistaId);

  if (pacientes.length === 0) {
    const now = new Date();
    
    // Dates calculation
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

    pacientes = [
      {
        id: p1Id,
        nutricionista_id: nutricionistaId,
        nome: 'Gabriel Santos',
        email: 'gabriel.santos@email.com',
        whatsapp: '(11) 98765-4321',
        peso_inicial: 78.5,
        altura: 1.75,
        objetivos: ['Emagrecimento', 'Ganho de massa'],
        created_at: daysAgo(45),
      },
      {
        id: p2Id,
        nutricionista_id: nutricionistaId,
        nome: 'Camila Ferreira',
        email: 'camila.ferreira@email.com',
        whatsapp: '(11) 91234-5678',
        peso_inicial: 62.0,
        altura: 1.65,
        objetivos: ['Reeducação Alimentar'],
        created_at: daysAgo(60),
      },
      {
        id: p3Id,
        nutricionista_id: nutricionistaId,
        nome: 'Lucas Mendes',
        email: 'lucas.mendes@email.com',
        whatsapp: '(21) 99887-7665',
        peso_inicial: 85.0,
        altura: 1.80,
        objetivos: ['Hipertrofia'],
        created_at: daysAgo(10),
      },
      {
        id: p4Id,
        nutricionista_id: nutricionistaId,
        nome: 'Mariana Lima',
        email: 'mariana.lima@email.com',
        whatsapp: '(31) 97766-5544',
        peso_inicial: 58.0,
        altura: 1.60,
        objetivos: ['Saúde & Disposição'],
        created_at: daysAgo(5),
      },
    ];

    consultas = [
      // p1: última consulta há 40 dias, sem próximo retorno -> Paciente sem retorno (>30d)
      {
        id: crypto.randomUUID(),
        paciente_id: p1Id,
        data_consulta: daysAgo(40),
        peso: 78.5,
        observacoes: 'Primeira consulta realizada.',
        proximo_retorno: null,
        created_at: daysAgo(40),
      },
      // p2: última consulta há 45 dias, sem próximo retorno -> Paciente sem retorno (>30d)
      {
        id: crypto.randomUUID(),
        paciente_id: p2Id,
        data_consulta: daysAgo(45),
        peso: 62.0,
        observacoes: 'Plano alimentar entregue.',
        proximo_retorno: null,
        created_at: daysAgo(45),
      },
      // p3: consulta realizada esta semana
      {
        id: crypto.randomUUID(),
        paciente_id: p3Id,
        data_consulta: daysAgo(2),
        peso: 84.2,
        observacoes: 'Evolução positiva no treino.',
        proximo_retorno: daysFuture(25),
        created_at: daysAgo(2),
      },
      // p4: consulta realizada esta semana
      {
        id: crypto.randomUUID(),
        paciente_id: p4Id,
        data_consulta: daysAgo(1),
        peso: 57.8,
        observacoes: 'Ajuste no consumo de água.',
        proximo_retorno: daysFuture(30),
        created_at: daysAgo(1),
      },
    ];

    saveLocalPacientes(nutricionistaId, pacientes);
    saveLocalConsultas(nutricionistaId, consultas);
  }

  return { pacientes, consultas };
}

// Fetch dashboard metrics for the logged-in nutritionist
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  const { pacientes, consultas } = seedInitialDataIfEmpty(nutricionistaId);

  // 1. Total Pacientes Ativos
  const totalPacientesAtivos = pacientes.length;

  // 2. Consultas da Semana (Monday to Sunday of current week)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
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

  // 3. Pacientes sem retorno:
  // Exibe lista com nome dos pacientes cuja ÚLTIMA consulta foi há mais de 30 dias
  // E que NÃO possuem próximo retorno agendado (proximo_retorno is null or in the past).
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
}

// Add a new paciente
export async function addPaciente(nutricionistaId: string, novoPaciente: Omit<Paciente, 'id' | 'nutricionista_id' | 'created_at'>): Promise<Paciente> {
  const pacientes = getLocalPacientes(nutricionistaId);
  const paciente: Paciente = {
    ...novoPaciente,
    id: crypto.randomUUID(),
    nutricionista_id: nutricionistaId,
    created_at: new Date().toISOString(),
  };
  pacientes.unshift(paciente);
  saveLocalPacientes(nutricionistaId, pacientes);
  return paciente;
}

// Update an existing paciente
export async function updatePaciente(nutricionistaId: string, pacienteId: string, dadosAtualizados: Partial<Paciente>): Promise<Paciente> {
  const pacientes = getLocalPacientes(nutricionistaId);
  const index = pacientes.findIndex((p) => p.id === pacienteId);
  if (index === -1) {
    throw new Error('Paciente não encontrado');
  }
  const pacienteAtualizado: Paciente = {
    ...pacientes[index],
    ...dadosAtualizados,
  };
  pacientes[index] = pacienteAtualizado;
  saveLocalPacientes(nutricionistaId, pacientes);
  return pacienteAtualizado;
}

// Fetch consultas for a specific paciente
export async function getConsultasByPaciente(nutricionistaId: string, pacienteId: string): Promise<Consulta[]> {
  const consultas = getLocalConsultas(nutricionistaId);
  return consultas
    .filter((c) => c.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime());
}

// Fetch planos alimentares for a specific paciente
export async function getPlanosAlimentaresByPaciente(nutricionistaId: string, pacienteId: string): Promise<PlanoAlimentar[]> {
  try {
    const raw = localStorage.getItem(`nufey_planos_${nutricionistaId}`);
    const planos: PlanoAlimentar[] = raw ? JSON.parse(raw) : [];
    return planos
      .filter((p) => p.paciente_id === pacienteId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    return [];
  }
}

// Add a new consulta
export async function addConsulta(nutricionistaId: string, pacienteId: string, novaConsulta: Omit<Consulta, 'id' | 'paciente_id' | 'created_at'>): Promise<Consulta> {
  const consultas = getLocalConsultas(nutricionistaId);
  const consulta: Consulta = {
    ...novaConsulta,
    id: crypto.randomUUID(),
    paciente_id: pacienteId,
    created_at: new Date().toISOString(),
  };
  consultas.unshift(consulta);
  saveLocalConsultas(nutricionistaId, consultas);
  return consulta;
}

