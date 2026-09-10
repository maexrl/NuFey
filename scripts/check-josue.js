import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.VITE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_i2NdDrcC1PIV@ep-muddy-cloud-ach02trc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function checkPatientsAndUsers() {
  console.log('🔍 Checando pacientes e nutricionistas no Neon DB...');
  try {
    const pacientes = await sql`SELECT id, nutricionista_id, nome, email, created_at FROM pacientes ORDER BY created_at DESC;`;
    console.log(`Total de pacientes no DB (${pacientes.length}):`);
    pacientes.forEach(p => console.log(`  - Paciente: ${p.nome} | Nutri ID: ${p.nutricionista_id} | Created: ${p.created_at}`));

    const users = await sql`SELECT id, name, email, role, created_at FROM users_auth ORDER BY created_at DESC;`;
    console.log(`\nTotal de usuários auth no DB (${users.length}):`);
    users.forEach(u => console.log(`  - User: ${u.name} (${u.email}) | ID: ${u.id} | Role: ${u.role}`));

    const nutris = await sql`SELECT id, nome, email, created_at FROM nutricionistas ORDER BY created_at DESC;`;
    console.log(`\nTotal de nutricionistas no DB (${nutris.length}):`);
    nutris.forEach(n => console.log(`  - Nutri: ${n.nome} (${n.email}) | ID: ${n.id}`));

  } catch (err) {
    console.error('Erro na checagem:', err);
  }
}

checkPatientsAndUsers();
