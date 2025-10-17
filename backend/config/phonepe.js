const { StandardCheckoutClient, Env } = require('pg-sdk-node');

/**
 * PhonePe SDK Configuration
 * Initializes the StandardCheckoutClient as a singleton
 */

const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
let clientVersion =
  process.env.PHONEPE_CLIENT_VERSION ||
  (process.env.PHONEPE_ENV === 'production' ? 'v2' : 'v1');
const environment = process.env.PHONEPE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;

// Validate required environment variables
if (!clientId || !clientSecret) {
  throw new Error('PhonePe configuration error: PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are required');
}

let client = null;

/**
 * Get PhonePe client instance
 * @returns {StandardCheckoutClient} PhonePe client instance
 */
const getPhonePeClient = () => {
  if (!client) {
    try {
      client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, environment);
      console.log(
        `PhonePe SDK initialized in ${environment === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode (clientVersion=${clientVersion})`
      );
    } catch (error) {
      console.error('Failed to initialize PhonePe SDK:', error.message);
      throw new Error('PhonePe SDK initialization failed');
    }
  }
  return client;
};

/**
 * Get PhonePe configuration details
 * @returns {Object} Configuration details
 */
const getPhonePeConfig = () => {
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const redirectUrl = process.env.PHONEPE_REDIRECT_URL || `${frontend}/payments/phonepe/return`;
  return {
    clientId,
    environment: environment === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX',
    clientVersion,
    redirectUrl,
  };
};

const forcePhonePeClientVersion = (version) => {
  if (version && version !== clientVersion) {
    clientVersion = version;
    client = null; // force re-init on next getPhonePeClient()
  }
};

module.exports = { getPhonePeClient, getPhonePeConfig, forcePhonePeClientVersion };
