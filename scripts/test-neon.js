import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_i2NdDrcC1PIV@ep-muddy-cloud-ach02trc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function testFix() {
  const nutId = '00000000-0000-0000-0000-000000000001';
  const pId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    console.log('1. Ensuring nutritionist exists in DB...');
    await sql`
      INSERT INTO nutricionistas (id, nome, email, created_at)
      VALUES (${nutId}::uuid, 'Nutricionista Teste', 'nutri@teste.com', ${now})
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('2. Inserting patient into pacientes table...');
    const rows = await sql`
      INSERT INTO pacientes (
        id, nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
        peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
        refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes, created_at
      ) VALUES (
        ${pId}::uuid, ${nutId}::uuid, 'Maria Oliveira Santos Teste',
        '1995-05-15', 'Feminino', '(11) 99999-8888', 'maria@exemplo.com',
        62, 1.65, ARRAY['Reeducação alimentar'], 'Emagrecimento', 'Moderado',
        ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, NULL,
        5, '07:00', '23:00', 2,
        true, 'Caminhada', 'Sem observações', ${now}
      ) RETURNING *;
    `;
    console.log('✅ INSERT PATIENT SUCCESSFUL:', rows);

    const pacientesInDb = await sql`SELECT id, nome, email, created_at FROM pacientes;`;
    console.log('Total pacientes in Neon DB:', pacientesInDb.length, pacientesInDb);
  } catch (err) {
    console.error('TEST FIX ERROR:', err);
  }
}

testFix();
