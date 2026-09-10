1. SISTEMA DE AUTENTICAÇÃO E NÍVEIS DE ACESSO:
- Crie dois tipos de usuários: "Administrador" (ex: o nutricionista/clínica) e "Usuário Normal" (o paciente).
- Implemente o login seguro salvando o tipo de usuário (role: 'admin' ou 'user') na sessão ou token.
- Proteja as rotas: apenas usuários logados como 'admin' podem ver a lista de pacientes, cadastrar dados clínicos e disparar a geração do plano alimentar. O 'user' comum só pode visualizar o seu próprio plano.

2. GERADOR DE PLANO ALIMENTAR INTEGRADO COM A GEMINI API:
- Crie um formulário no painel do administrador para cadastrar dados do paciente: Dados Clínicos (ex: alergias, diabetes, peso, restrições) e Hábitos (ex: horários, preferências alimentares, rotina).
- Configure a integração com a API do Gemini. Quando o administrador clicar em "Gerar Plano", o backend deve enviar esses dados estruturados para o Gemini.
- O prompt enviado ao Gemini deve instruí-lo a agir como um nutricionista profissional e gerar um "plano alimentar simples, prático e adaptado à rotina informada".
- Salve o plano alimentar gerado no banco de dados atrelado ao perfil daquele paciente.