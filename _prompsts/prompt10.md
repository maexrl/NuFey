# Especificação Técnica (Prompt 9): Reformulação do NuFey (PWA de Gestão Nutricional) - v1.2

## 1. Visão Geral e Objetivos
O **NuFey** é um sistema PWA de gestão nutricional em saúde e nutrição humana. Esta especificação orienta a reformulação da interface (inspirada no Nutrium, com design limpo e clínico), a infraestrutura de inteligência artificial e a **garantia de persistência de dados no banco de dados PostgreSQL (Neon DB)**.

---

## 2. REQUISITO CRÍTICO: Persistência de Dados e Correção de Cadastros (Bug Fix)

### 2.1 Diagnóstico do Problema
Atualmente, quando uma alteração é feita no sistema (seja via web ou aplicativo PWA), como o cadastro ou atualização de pacientes, os dados desaparecem ao deslogar ou atualizar a sessão. Isso ocorre porque o estado está sendo alterado apenas localmente no frontend, sem confirmação e salvamento no banco de dados.

### 2.2 Requisitos Obrigatórios de Persistência
1. **Gravação Síncrona no PostgreSQL (Neon DB):**
   - Qualquer operação de criação (`POST`), atualização (`PUT`/`PATCH`) ou exclusão (`DELETE`) de pacientes DEVE executar uma mutação direta no banco de dados PostgreSQL.
   - É proibido manter cadastros de pacientes armazenados exclusivamente em estado local (`React context`, `localStorage` ou `sessionStorage`).

2. **Endpoints de API e Server Actions:**
   - Garantir handlers de mutação válidos nas rotas de API (ex: `/api/patients`):
     - `POST /api/patients`: Insere o novo paciente no banco e retorna a confirmação com o `id` gerado (`201 Created`).
     - `PATCH /api/patients/[id]`: Atualiza os dados persistidos no PostgreSQL.
     - `GET /api/patients`: Consulta e retorna diretamente do banco de dados os pacientes associados ao usuário/nutricionista autenticado.

3. **Invalidação de Cache e Revalidação de Sessão:**
   - Após qualquer alteração (cadastro, edição de medidas, anamnese, etc.), o sistema deve invalidar o cache do cliente/servidor imediatamente (utilizando `revalidatePath` / `revalidateTag` no Next.js ou `refetch` / `invalidateQueries` no cliente).
   - Ao fazer login/relogin, a aplicação deve realizar uma chamada atualizada para buscar os pacientes persistidos no banco, sem utilizar versões em cache desatualizadas.

4. **Estratégia do PWA e Service Worker:**
   - Configurar o Service Worker do PWA com a estratégia **Network First** para todas as requisições da API (`/api/*`).
   - Evitar que dados gravados fiquem presos no cache offline do Service Worker ao alternar de conta ou reabrir o app.

---

## 3. Design System & Interface Clínica (Inspirado no Nutrium)
- **Visual:** Interface limpa, clara e clínica, com foco em usabilidade e redução de ruído visual.
- **Navegação:** Central do paciente organizada por abas (Visão Geral, Anamnese, Antropometria, Plano Alimentar, Exames e Recomendações).
- **PWA Responsivo:** Suporte completo para uso em dispositivos móveis (Web App) e computadores de mesa.

---

## 4. Infraestrutura de Inteligência Artificial & Validação
- **Vercel AI SDK:** Integração para geração dinâmica e assistida de planos alimentares.
- **Validação Estruturada com Zod:** Garantia de que todos os dados retornados pela IA sigam schemas estritamente tipados.
- **Streaming & Fallback:** Resposta contínua via streaming para melhor UX e mecanismo de fallback para prevenir falhas.
- **Fórmulas Antropométricas:** Integração de equações nutricionais (Harris-Benedict, Mifflin-St Jeor, FAO/OMS, dobras cutâneas e IMC).

---

## 5. Modelagem de Dados (PostgreSQL / Neon DB)

```sql
-- Tabela principal de Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_nutritionist ON patients(nutritionist_id);