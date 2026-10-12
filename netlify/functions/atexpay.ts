import {
  createAtexPayCheckout,
  handleAtexPayWebhook,
  verifyAtexPaySignature,
} from '../../src/lib/atexpay';

/**
 * Netlify Serverless Function: atexpay
 * Handles both checkout creation and webhook processing under /.netlify/functions/atexpay
 */
export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, x-atexpay-signature',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // Health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'ok',
        provider: 'atexpay',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    let body: any = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    // If body looks like a webhook payload
    if (body.event || body.type === 'checkout.session.completed' || body.event === 'payment.succeeded') {
      const headers = event.headers || {};
      const signature =
        headers['x-atexpay-signature'] ||
        headers['atexpay-signature'] ||
        headers['webhook-signature'] ||
        headers['signature'];

      const rawBody = typeof event.body === 'string' ? event.body : JSON.stringify(body);
      const { isValid, reason } = verifyAtexPaySignature(
        rawBody,
        signature,
        process.env.ATEXPAY_WEBHOOK_SECRET
      );

      if (!isValid) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: reason || 'Invalid signature' }),
        };
      }

      const result = await handleAtexPayWebhook(body);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result),
      };
    }

    // Otherwise treat as checkout session initiation
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
    } = body;

    const headers = event.headers || {};
    const origin =
      bodyOrigin ||
      headers.origin ||
      headers.referer ||
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
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: err?.message || 'Server error' }),
    };
  }
};
