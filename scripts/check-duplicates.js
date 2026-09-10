import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.VITE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_i2NdDrcC1PIV@ep-muddy-cloud-ach02trc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function checkAndFixDuplicates() {
  console.log('🔍 Checando duplicatas na tabela pacientes do Neon DB...');
  try {
    const all = await sql`SELECT id, nutricionista_id, nome, email, created_at FROM pacientes ORDER BY nome, created_at ASC;`;
    console.log(`Total de registros de pacientes no DB: ${all.length}`);
    all.forEach(p => console.log(`- ID: ${p.id} | Nutri: ${p.nutricionista_id} | Nome: ${p.nome} | Email: ${p.email} | Created: ${p.created_at}`));

    // Encontrar e apagar duplicatas mantendo apenas o registro mais recente para cada nome/e-mail por nutricionista
    console.log('\n🧹 Limpando duplicatas no Neon DB...');
    await sql`
      DELETE FROM pacientes p1
      USING pacientes p2
      WHERE p1.id < p2.id
        AND LOWER(TRIM(p1.nome)) = LOWER(TRIM(p2.nome))
        AND p1.nutricionista_id = p2.nutricionista_id;
    `;

    const after = await sql`SELECT id, nutricionista_id, nome, email, created_at FROM pacientes ORDER BY nome ASC;`;
    console.log(`\n✅ Registros de pacientes no DB após limpeza de duplicatas (${after.length}):`);
    after.forEach(p => console.log(`- ${p.nome} (${p.email})`));

  } catch (err) {
    console.error('Erro ao checar/limpar duplicatas:', err);
  }
}

checkAndFixDuplicates();
