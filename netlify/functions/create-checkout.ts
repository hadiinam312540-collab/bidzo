import { createAtexPayCheckout } from '../../src/lib/atexpay';

/**
 * Netlify Serverless Function: create-checkout
 * Accessible at /.netlify/functions/create-checkout and /api/create-checkout via redirect
 */
export const handler = async (event: any) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed. Only POST is accepted.' }),
    };
  }

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    const {
      amount,
      profile_url,
      message,
      category,
      payment_method,
      user_name,
      handle,
      platform,
      origin: bodyOrigin,
    } = body as any;

    const headers = event.headers || {};
    const origin =
      bodyOrigin ||
      headers.origin ||
      headers.Origin ||
      headers.referer ||
      headers.Referer ||
      process.env.URL ||
      process.env.DEPLOY_URL ||
      '';

    const result = await createAtexPayCheckout(
      {
        amount: Number(amount),
        profile_url,
        message,
        category,
        payment_method,
        user_name,
        handle,
        platform,
        origin,
      },
      origin
    );

    return {
      statusCode: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('[Netlify create-checkout] Error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error while creating checkout session',
      }),
    };
  }
};
