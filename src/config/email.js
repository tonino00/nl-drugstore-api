const SibApiV3Sdk = require('sib-api-v3-sdk');

function getClient() {
  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKey = client.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return client;
}

module.exports = {
  getClient,
  sender: {
    email: process.env.BREVO_EMAIL_FROM,
    name: process.env.BREVO_EMAIL_FROM_NAME,
  },
};
