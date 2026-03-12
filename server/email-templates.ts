import { BloodPressureReading, UserGoal } from "../drizzle/schema";
import { classifyBloodPressure } from "../shared/bloodPressure";

/**
 * Template de e-mail para lembrete de medição
 */
export function getReminderEmailTemplate(
  userName: string,
  reminderTitle: string,
  reminderDescription?: string
) {
  return {
    subject: `Lembrete: ${reminderTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💙 Hora de Medir a Pressão</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${userName}</strong>!</p>
              <p>Este é um lembrete para medir sua pressão arterial:</p>
              <h2 style="color: #667eea; margin: 20px 0;">${reminderTitle}</h2>
              ${reminderDescription ? `<p style="color: #666; font-style: italic;">${reminderDescription}</p>` : ""}
              <p>Manter um registro regular de suas medições ajuda você e seu médico a acompanhar sua saúde cardiovascular.</p>
              <a href="https://pressaoapp-mgj7pvhu.manus.space/nova-medicao" class="button">Registrar Medição</a>
            </div>
            <div class="footer">
              <p>Sistema de Monitoramento de Pressão Arterial</p>
              <p>Você recebeu este e-mail porque tem um lembrete configurado.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Template de e-mail para alerta de valor fora da meta
 */
export function getAlertEmailTemplate(
  userName: string,
  reading: BloodPressureReading,
  goals: UserGoal
) {
  const classification = classifyBloodPressure(reading.systolic, reading.diastolic);
  const isAboveGoal =
    reading.systolic > goals.targetSystolic || reading.diastolic > goals.targetDiastolic;

  return {
    subject: `⚠️ Alerta: Pressão Arterial ${classification.label}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${classification.bgColor} 0%, ${classification.bgColor}dd 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .reading { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${classification.color}; }
            .reading-value { font-size: 32px; font-weight: bold; color: ${classification.color}; }
            .reading-label { color: #666; font-size: 14px; margin-top: 5px; }
            .button { display: inline-block; background: ${classification.color}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ ${classification.label}</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${userName}</strong>!</p>
              <p>Sua última medição de pressão arterial está <strong>${isAboveGoal ? "acima da sua meta" : "fora dos limites normais"}</strong>.</p>
              
              <div class="reading">
                <div class="reading-value">${reading.systolic}/${reading.diastolic}</div>
                <div class="reading-label">mmHg</div>
                ${reading.heartRate ? `<div class="reading-label">Frequência cardíaca: ${reading.heartRate} bpm</div>` : ""}
              </div>

              ${isAboveGoal ? `
                <div class="warning">
                  <strong>Sua meta:</strong> ${goals.targetSystolic}/${goals.targetDiastolic} mmHg
                  <br>
                  <strong>Limite de alerta:</strong> ${goals.alertThresholdSystolic}/${goals.alertThresholdDiastolic} mmHg
                </div>
              ` : ""}

              <p><strong>Recomendações:</strong></p>
              <ul>
                <li>Descanse por 5-10 minutos antes de medir novamente</li>
                <li>Evite cafeína, exercício e estresse antes da medição</li>
                <li>Se os valores permanecerem elevados, consulte seu médico</li>
              </ul>

              <a href="https://pressaoapp-mgj7pvhu.manus.space/historico" class="button">Ver Histórico</a>
            </div>
            <div class="footer">
              <p>Sistema de Monitoramento de Pressão Arterial</p>
              <p>Se você acha que está em uma emergência médica, ligue para 192 (SAMU) ou procure o pronto-socorro mais próximo.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Template de e-mail para resumo semanal
 */
export function getWeeklyDigestEmailTemplate(
  userName: string,
  readings: BloodPressureReading[],
  goals: UserGoal
) {
  if (readings.length === 0) {
    return {
      subject: "📊 Resumo Semanal - Nenhuma Medição Registrada",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
              .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Seu Resumo Semanal</h1>
              </div>
              <div class="content">
                <p>Olá, <strong>${userName}</strong>!</p>
                <p>Você não registrou nenhuma medição de pressão arterial esta semana.</p>
                <p>Manter um registro regular é importante para monitorar sua saúde cardiovascular. Tente medir sua pressão pelo menos 2-3 vezes por semana.</p>
                <a href="https://pressaoapp-mgj7pvhu.manus.space/nova-medicao" class="button">Registrar Medição Agora</a>
              </div>
              <div class="footer">
                <p>Sistema de Monitoramento de Pressão Arterial</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  }

  const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length);
  const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length);
  const minSystolic = Math.min(...readings.map((r) => r.systolic));
  const maxSystolic = Math.max(...readings.map((r) => r.systolic));
  const minDiastolic = Math.min(...readings.map((r) => r.diastolic));
  const maxDiastolic = Math.max(...readings.map((r) => r.diastolic));

  const avgClassification = classifyBloodPressure(avgSystolic, avgDiastolic);
  const isAboveGoal = avgSystolic > goals.targetSystolic || avgDiastolic > goals.targetDiastolic;

  return {
    subject: `📊 Resumo Semanal - ${readings.length} medições registradas`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .stat-box { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #667eea; }
            .stat-label { color: #666; font-size: 12px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #667eea; margin-top: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Seu Resumo Semanal</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${userName}</strong>!</p>
              <p>Aqui está seu resumo de pressão arterial da semana:</p>

              <div class="stat-box">
                <div class="stat-label">MÉDIA</div>
                <div class="stat-value">${avgSystolic}/${avgDiastolic} mmHg</div>
                <div class="stat-label">${avgClassification.label}</div>
              </div>

              <div class="stat-box">
                <div class="stat-label">VARIAÇÃO</div>
                <div class="stat-value">${minSystolic}-${maxSystolic}/${minDiastolic}-${maxDiastolic} mmHg</div>
              </div>

              <div class="stat-box">
                <div class="stat-label">MEDIÇÕES</div>
                <div class="stat-value">${readings.length}</div>
              </div>

              ${isAboveGoal ? `
                <div class="warning">
                  <strong>Sua média está acima da meta!</strong>
                  <br>
                  Meta: ${goals.targetSystolic}/${goals.targetDiastolic} mmHg
                </div>
              ` : ""}

              <a href="https://pressaoapp-mgj7pvhu.manus.space/graficos" class="button">Ver Gráficos Detalhados</a>
            </div>
            <div class="footer">
              <p>Sistema de Monitoramento de Pressão Arterial</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
