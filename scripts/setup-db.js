import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.VITE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_i2NdDrcC1PIV@ep-muddy-cloud-ach02trc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function setupDatabase() {
  console.log('🚀 Iniciando atualização das tabelas no Neon Database...');

  try {
    // 1. Tabela nutricionistas (garantir integridade)
    await sql`
      CREATE TABLE IF NOT EXISTS nutricionistas (
        id UUID PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Tabela nutricionistas verificada.');

    // 2. Tabela de Usuários com 2FA e Autenticação Unificada
    await sql`
      CREATE TABLE IF NOT EXISTS users_auth (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'ROLE_ADMIN',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_method VARCHAR(20) DEFAULT 'email',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      );
    `;
    console.log('✅ Tabela users_auth pronta.');

    // 3. Tabela de Códigos 2FA e Verificação
    await sql`
      CREATE TABLE IF NOT EXISTS two_factor_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'login' ou 'reset_password'
        method VARCHAR(20) NOT NULL DEFAULT 'email', -- 'email' ou 'sms'
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Tabela two_factor_codes pronta.');

    // 4. Tabela de Logs de Auditoria do Sistema (Área Admin)
    await sql`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Tabela system_audit_logs pronta.');

    // Inserir usuário administrador inicial se não existir
    const now = new Date().toISOString();
    await sql`
      INSERT INTO users_auth (id, name, email, phone, role, two_factor_enabled, two_factor_method, created_at)
      VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Administrador NuFey',
        'admin@nufey.com.br',
        '(11) 99999-8888',
        'ROLE_ADMIN',
        true,
        'email',
        ${now}
      )
      ON CONFLICT (email) DO UPDATE SET role = 'ROLE_ADMIN';
    `;

    await sql`
      INSERT INTO system_audit_logs (user_email, action, details, created_at)
      VALUES ('system', 'DB_SCHEMA_UPDATE', 'Estrutura de tabelas para 2FA, Redefinição de Senha e Área Admin criada com sucesso.', ${now});
    `;

    console.log('🎉 Banco de Dados Neon atualizado e sincronizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante atualização do banco Neon:', err);
    process.exit(1);
  }
}

setupDatabase();
