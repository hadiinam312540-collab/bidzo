import { verifyCheckoutSession } from '../../src/lib/atexpay';

/**
 * Netlify Serverless Function: verify-checkout
 * Validates session and marks bid as paid
 */
export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const sessionId =
    (event.queryStringParameters && event.queryStringParameters.session_id) ||
    (event.queryStringParameters && event.queryStringParameters.sessionId);

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: 'session_id query parameter is required' }),
    };
  }

  try {
    const result = await verifyCheckoutSession(sessionId);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: err?.message || 'Server error verifying session' }),
    };
  }
};
