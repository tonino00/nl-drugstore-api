const SibApiV3Sdk = require('sib-api-v3-sdk');
const { getClient, sender } = require('../config/email');

getClient();

class EmailService {
  async sendPasswordReset(toEmail, token) {
    if (!process.env.BREVO_API_KEY) return;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const resetLink = `${process.env.FRONTEND_URL || ''}/reset-password?token=${token}`;

    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject: 'Recuperação de senha',
      htmlContent: `<p>Use o token abaixo para redefinir sua senha:</p><p><b>${token}</b></p><p>Ou acesse: ${resetLink}</p>`,
    });
  }

  async sendDailyReport(toEmail, htmlContent) {
    if (!process.env.BREVO_API_KEY) return;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject: 'Relatório diário - Farmácia Comunitária',
      htmlContent,
    });
  }
}

module.exports = new EmailService();
