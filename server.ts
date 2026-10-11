import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createAtexPayCheckout,
  handleAtexPayWebhook,
  verifyCheckoutSession,
  getPaidBidsFromStore,
} from './src/lib/atexpay';
import atexpayWebhookHandler from './api/atexpay/webhook';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust proxy for secure protocol resolution behind reverse proxies (Cloud Run / AI Studio)
  app.set('trust proxy', 1);

  // Middleware for parsing JSON & URL-encoded request bodies with raw body capture for signature verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        if (!req.rawBody) req.rawBody = buf;
      },
    })
  );
  app.use(
    express.raw({
      type: (req) => !(req as any).rawBody,
      verify: (req: any, _res, buf) => {
        if (!req.rawBody) req.rawBody = buf;
      },
    })
  );

  // --- ATEXPAY API ENDPOINTS ---

  /**
   * POST /api/create-checkout
   * Initiates an AtexPay payment session and returns checkout URL
   */
  app.post('/api/create-checkout', async (req, res) => {
    try {
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
      } = req.body;

      // Dynamically resolve client origin (prioritize body origin from browser window.location.origin)
      let resolvedOrigin =
        bodyOrigin ||
        req.get('origin') ||
        (req.get('referer') ? new URL(req.get('referer')!).origin : null) ||
        (req.get('x-forwarded-host')
          ? `${req.get('x-forwarded-proto') || 'https'}://${req.get('x-forwarded-host')}`
          : null) ||
        process.env.VITE_APP_URL ||
        process.env.APP_URL ||
        process.env.URL ||
        `${req.protocol}://${req.get('host')}`;

      // If resolvedOrigin contains localhost:3000, check environment variables or forwarded headers
      if (resolvedOrigin.includes('localhost:3000')) {
        const envUrl = process.env.VITE_APP_URL || process.env.APP_URL || process.env.URL;
        if (envUrl) {
          resolvedOrigin = envUrl;
        }
      }

      const checkoutResult = await createAtexPayCheckout(
        {
          amount: Number(amount),
          profile_url,
          message,
          category,
          payment_method,
          user_name,
          handle,
          platform,
          origin: resolvedOrigin,
        },
        resolvedOrigin
      );

      if (!checkoutResult.success) {
        return res.status(400).json(checkoutResult);
      }

      return res.status(200).json(checkoutResult);
    } catch (err: any) {
      console.error('[API /api/create-checkout] Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Internal server error while creating checkout session',
      });
    }
  });

  /**
   * /api/atexpay/webhook (Serverless webhook function route)
   * Handles POST webhook callbacks from AtexPay, verifies ATEXPAY_WEBHOOK_SECRET signature,
   * and updates bid statuses automatically.
   */
  app.all('/api/atexpay/webhook', atexpayWebhookHandler);

  /**
   * POST /api/atexpay-webhook (Backward compatibility route)
   */
  app.all('/api/atexpay-webhook', atexpayWebhookHandler);

  /**
   * GET /api/verify-checkout
   * Validates checkout session and marks bid as paid
   */
  app.get('/api/verify-checkout', async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'session_id is required' });
      }

      const result = await verifyCheckoutSession(sessionId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  /**
   * GET /api/bids/paid
   * Returns in-memory paid bids from recent checkouts
   */
  app.get('/api/bids/paid', (req, res) => {
    res.json({ success: true, bids: getPaidBidsFromStore() });
  });

  // --- VITE DEV / PROD MIDDLEWARE ---
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
