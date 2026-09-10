# PROMPT PARA IMPLEMENTAÇÃO NO ANTIGRAVITY

## Contexto e Objetivo
Precisamos atualizar nossa aplicação para incluir um **Painel do Cliente**, um **Painel do Administrador** e a **Integração com a API do Google Gemini** para geração automática de planos alimentares personalizados.

Siga os requisitos abaixo para estruturar o código, criar os componentes, as rotas e os serviços backend necessários.

---

## 1. Painel do Cliente (Client Dashboard)
Crie uma interface intuitiva e responsiva para o usuário final com as seguintes funcionalidades:

* **Formulário de Anamnese / Perfil de Saúde:**
  * Dados físicos: idade, sexo, peso atual, altura, nível de atividade física.
  * Objetivos: emagrecimento, hipertrofia, reeducação alimentar, manutenção.
  * Restrições e preferências: alergias, intolerâncias (glúten, lactose, etc.), alimentos de preferência e rejeição, orçamento alimentício.
  * Rotina: número de refeições diárias desejadas e horários.
* **Visualizador do Plano Alimentar:**
  * Exibição clara das refeições diárias (café da manhã, almoço, lanches, jantar) com porções e horários.
  * Resumo nutricional diário: calorias totais, carboidratos, proteínas e gorduras.
  * Botão para exportar ou visualizar o plano em PDF/impressão.
  * Lista de compras automática gerada a partir do plano.

---

## 2. Painel do Administrador (Admin Dashboard)
Crie uma interface restrita para o nutricionista/administrador do sistema:

* **Gestão de Clientes:**
  * Tabela/Lista de clientes cadastrados com busca e filtros.
  * Visualização detalhada do perfil e histórico de cada cliente.
* **Gestão de Planos Alimentares:**
  * Capacidade de acionar a geração de um novo plano alimentar via Gemini para qualquer cliente.
  * Editor manual: permitir que o administrador revise, edite ou ajuste o plano gerado pela IA antes de liberá-lo para o cliente.
  * Status do plano: "Rascunho", "Aprovado", "Enviado".
* **Configurações do Sistema:**
  * Campo seguro para inserção/atualização da chave de API (`GEMINI_API_KEY`).
  * Personalização do prompt-base do Gemini (Engenharia de Prompt administrativa).

---

## 3. Integração com o Google Gemini (Backend Service)
Implemente o serviço de integração com a API do Gemini utilizando o SDK oficial da Google.

* **Rota da API (`/api/generate-meal-plan`):**
  * **Input:** Dados do perfil do cliente (extraídos da anamnese).
  * **Configuração da IA:** Utilizar o modelo `gemini-1.5-pro` (ou `gemini-1.5-flash` para maior velocidade) configurado para retornar **JSON Estruturado** (JSON Schema).
  * **Prompt da IA (System Instruction):**
    > "Você é um nutricionista especialista. Com base nos dados do cliente fornecidos (idade, peso, altura, objetivo, restrições e preferências), crie um plano alimentar semanal completo e detalhado. Retorne estritamente um formato JSON estruturado contendo: calorias totais, distribuição de macronutrientes, array de dias da semana, array de refeições por dia (com ingredientes e quantidades em gramas/medidas caseiras) e uma lista de compras acumulada."
* **Tratamento de Erros e Validação:**
  * Validar a resposta do JSON antes de salvar no banco de dados.
  * Tratamento de limites de requisição (rate limit) e fallback.

---

## 4. Segurança e Controle de Acesso (RBAC)
* Implementar controle de acesso baseado em funções (Roles): `ROLE_CLIENT` e `ROLE_ADMIN`.
* Proteger as rotas do painel administrativo para que clientes não tenham acesso.
* Garantir que cada cliente só possa visualizar o seu próprio plano alimentar.

---

## Passos para Execução
1. Analise a arquitetura atual do projeto nesta pasta.
2. Liste os arquivos que precisam ser criados ou modificados.
3. Apresente as alterações em etapas, começando pela criação dos esquemas do banco de dados/tipos, rotas de API do Gemini e, em seguida, as interfaces de usuário (Admin e Cliente).