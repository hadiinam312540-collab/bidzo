import type { Request, Response } from 'express';
import { handleAtexPayWebhook, verifyAtexPaySignature } from '../../src/lib/atexpay';

/**
 * Extracts webhook signature from request headers across various header names and casings.
 */
function extractSignatureHeader(req: any): string | undefined {
  const headers = req?.headers || {};
  if (typeof headers.get === 'function') {
    return (
      headers.get('x-atexpay-signature') ||
      headers.get('atexpay-signature') ||
      headers.get('webhook-signature') ||
      headers.get('x-webhook-signature') ||
      headers.get('x-signature') ||
      headers.get('x-signature-sha256') ||
      headers.get('signature') ||
      headers.get('stripe-signature') ||
      headers.get('x-hub-signature-256') ||
      headers.get('authorization') ||
      undefined
    );
  }

  const candidateNames = [
    'x-atexpay-signature',
    'atexpay-signature',
    'webhook-signature',
    'x-webhook-signature',
    'x-signature',
    'x-signature-sha256',
    'signature',
    'stripe-signature',
    'x-hub-signature-256',
    'authorization',
  ];

  for (const name of candidateNames) {
    if (headers[name] !== undefined) {
      const val = headers[name];
      return Array.isArray(val) ? val[0] : val;
    }
  }

  const headerKeys = Object.keys(headers);
  for (const name of candidateNames) {
    const match = headerKeys.find((k) => k.toLowerCase() === name);
    if (match && headers[match] !== undefined) {
      const val = headers[match];
      return Array.isArray(val) ? val[0] : val;
    }
  }

  return undefined;
}

/**
 * Serverless API function: /api/atexpay/webhook
 * Handles incoming AtexPay POST webhook events, verifies HMAC-SHA256 signature
 * against process.env.ATEXPAY_WEBHOOK_SECRET, and automatically updates bid statuses.
 */
export default async function handler(req: any, res: any) {
  // Support GET for webhook health check & diagnostics
  if (req.method === 'GET') {
    const isConfigured = Boolean(
      process.env.ATEXPAY_WEBHOOK_SECRET &&
      !process.env.ATEXPAY_WEBHOOK_SECRET.includes('your_atexpay_webhook_secret')
    );
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/atexpay/webhook',
      signature_verification_enabled: isConfigured,
      timestamp: new Date().toISOString(),
    });
  }

  // Only POST requests are allowed for webhook callbacks
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
    });
  }

  try {
    // 1. Extract signature from possible header variations
    const signatureHeader = extractSignatureHeader(req);

    // 2. Extract raw body buffer/string or parsed body
    const rawBody = (req as any).rawBody || req.body || '';

    // 3. Verify signature with process.env.ATEXPAY_WEBHOOK_SECRET
    const { isValid, reason } = verifyAtexPaySignature(
      rawBody,
      signatureHeader,
      process.env.ATEXPAY_WEBHOOK_SECRET,
      { headers: req.headers }
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: reason || 'Invalid webhook signature',
      });
    }

    // 4. Parse payload body if not already parsed
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON payload',
        });
      }
    } else if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf8'));
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON payload buffer',
        });
      }
    }

    // 5. Automatically process event and update bid status in memory and Supabase
    const result = await handleAtexPayWebhook(body || {});

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal error processing AtexPay webhook',
    });
  }
}

/**
 * Standard Web API / Edge runtime export for modern serverless runtimes
 */
export async function POST(request: globalThis.Request): Promise<globalThis.Response> {
  try {
    const rawBody = await request.text();
    const signatureHeader = extractSignatureHeader({ headers: request.headers });

    const { isValid, reason } = verifyAtexPaySignature(
      rawBody,
      signatureHeader,
      process.env.ATEXPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: reason || 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }

    const result = await handleAtexPayWebhook(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Serverless webhook error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
