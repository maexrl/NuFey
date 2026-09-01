export function generateWhatsAppReturnMessage(patientName: string, daysSinceLastVisit: number): string {
  const firstName = patientName ? patientName.split(' ')[0] : 'Paciente';
  const text = `Olá ${firstName}! Tudo bem?

Notamos que sua última consulta nutricional no consultório foi há ${daysSinceLastVisit} dias. Para mantermos a evolução dos seus resultados e ajustarmos o seu plano alimentar, é fundamental realizarmos o acompanhamento de retorno.

Podemos agendar o seu horário para esta semana?
Aguardamos o seu contato! ✨`;

  return encodeURIComponent(text);
}

export function openWhatsAppChat(phone: string, messageText: string) {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/55${cleanPhone}?text=${messageText}`;
  window.open(url, '_blank');
}
