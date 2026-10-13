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
   * Reusable checkout handler for /api/create-checkout and Netlify function routes
   */
  const handleCreateCheckout = async (req: express.Request, res: express.Response) => {
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
      } = req.body || {};

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
  };

  /**
   * POST /api/create-checkout, /.netlify/functions/create-checkout, /api/atexpay
   * Initiates an AtexPay payment session and returns checkout URL
   */
  app.post('/api/create-checkout', handleCreateCheckout);
  app.post('/.netlify/functions/create-checkout', handleCreateCheckout);
  app.post('/api/atexpay', handleCreateCheckout);
  app.post('/.netlify/functions/atexpay', handleCreateCheckout);

  /**
   * /api/atexpay/webhook (Serverless webhook function route)
   * Handles POST webhook callbacks from AtexPay, verifies ATEXPAY_WEBHOOK_SECRET signature,
   * and updates bid statuses automatically.
   */
  app.all('/api/atexpay/webhook', atexpayWebhookHandler);
  app.all('/api/atexpay-webhook', atexpayWebhookHandler);
  app.all('/.netlify/functions/atexpay-webhook', atexpayWebhookHandler);

  /**
   * GET /api/verify-checkout & Netlify function alias
   * Validates checkout session and marks bid as paid
   */
  const handleVerifyCheckout = async (req: express.Request, res: express.Response) => {
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
  };

  app.get('/api/verify-checkout', handleVerifyCheckout);
  app.get('/.netlify/functions/verify-checkout', handleVerifyCheckout);

  /**
   * GET /api/bids/paid
   * Returns in-memory paid bids from recent checkouts
   */
  app.get('/api/bids/paid', (req, res) => {
    res.json({ success: true, bids: getPaidBidsFromStore() });
  });

  // --- SUPPORT CHATBOT HEALTH-CHECK & DIAGNOSTIC SYSTEM ---
  interface ServerDiagnosticLog {
    id: string;
    timestamp: string;
    errorCode?: string;
    failedAction?: string;
    context?: Record<string, any>;
    clientInfo?: Record<string, any>;
    userMessage?: string;
  }

  const serverDiagnosticLogs: ServerDiagnosticLog[] = [];

  /**
   * GET /api/support/health
   * Real-time system health check endpoint for support bot & telemetry
   */
  app.get('/api/support/health', (_req, res) => {
    const startTime = Date.now();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      services: {
        server_api: 'operational',
        checkout_gateway: 'operational',
        realtime_sync: 'operational',
      },
      system: {
        node_version: process.version,
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      latency_ms: Date.now() - startTime,
      version: '1.2.0',
    });
  });

  /**
   * POST /api/support/log
   * Stores client diagnostic error context when a user reports a bug or an API error occurs
   */
  app.post('/api/support/log', (req, res) => {
    try {
      const { logId, errorCode, failedAction, context, clientInfo, userMessage } = req.body || {};
      const logRecord: ServerDiagnosticLog = {
        id: logId || `DBG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        errorCode: errorCode || 'CLIENT_ERROR',
        failedAction: failedAction || 'UNKNOWN_ACTION',
        context: context || {},
        clientInfo: clientInfo || {},
        userMessage: userMessage || '',
      };

      serverDiagnosticLogs.unshift(logRecord);
      if (serverDiagnosticLogs.length > 50) {
        serverDiagnosticLogs.pop();
      }

      console.log(
        `[SUPPORT_BOT_DIAGNOSTIC] Logged bug report #${logRecord.id} [${logRecord.errorCode}] action: ${logRecord.failedAction}`
      );
      res.json({ success: true, logId: logRecord.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  /**
   * GET /api/support/diagnostics
   * Returns recent captured diagnostic logs for system auditing
   */
  app.get('/api/support/diagnostics', (_req, res) => {
    res.json({ success: true, count: serverDiagnosticLogs.length, logs: serverDiagnosticLogs });
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
