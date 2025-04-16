require("dotenv").config();

const { Env } = require("pg-sdk-node");

// Test PhonePe credentials
const PHONEPE_TEST_CLIENT_ID = process.env.PHONEPE_TEST_CLIENT_ID;
const PHONEPE_TEST_CLIENT_SECRET = process.env.PHONEPE_TEST_CLIENT_SECRET;
const PHONEPE_TEST_CLIENT_VERSION = Number(
  process.env.PHONEPE_TEST_CLIENT_VERSION
);
const PHONEPE_TEST_APP_BE_URL = process.env.PHONEPE_TEST_APP_BE_URL;
const PHONEPE_TEST_APP_FE_URL = process.env.PHONEPE_TEST_APP_FE_URL;

// Production PhonePe credentials
const PHONEPE_PROD_CLIENT_ID = process.env.PHONEPE_PROD_CLIENT_ID;
const PHONEPE_PROD_CLIENT_SECRET = process.env.PHONEPE_PROD_CLIENT_SECRET;
const PHONEPE_PROD_CLIENT_VERSION = Number(
  process.env.PHONEPE_PROD_CLIENT_VERSION
);
const PHONEPE_PROD_APP_BE_URL = process.env.PHONEPE_PROD_APP_BE_URL;
const PHONEPE_PROD_APP_FE_URL = process.env.PHONEPE_PROD_APP_FE_URL;

// Environment variable to switch between test and production
const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || "TEST"; // "TEST" or "PROD"

// Final PhonePe credentials based on the environment
const clientId =
  PHONEPE_ENVIRONMENT === "TEST"
    ? PHONEPE_TEST_CLIENT_ID
    : PHONEPE_PROD_CLIENT_ID;
const clientSecret =
  PHONEPE_ENVIRONMENT === "TEST"
    ? PHONEPE_TEST_CLIENT_SECRET
    : PHONEPE_PROD_CLIENT_SECRET;
const clientVersion =
  PHONEPE_ENVIRONMENT === "TEST"
    ? PHONEPE_TEST_CLIENT_VERSION
    : PHONEPE_PROD_CLIENT_VERSION;
const env = PHONEPE_ENVIRONMENT === "TEST" ? Env.SANDBOX : Env.PRODUCTION;
const APP_BE_URL =
  PHONEPE_ENVIRONMENT === "TEST"
    ? PHONEPE_TEST_APP_BE_URL
    : PHONEPE_PROD_APP_BE_URL;
const APP_FE_URL =
  PHONEPE_ENVIRONMENT === "TEST"
    ? PHONEPE_TEST_APP_FE_URL
    : PHONEPE_PROD_APP_FE_URL;

// Export the PhonePe configuration
module.exports = {
  clientId,
  clientSecret,
  clientVersion,
  env,
  APP_FE_URL,
  APP_BE_URL,
};
