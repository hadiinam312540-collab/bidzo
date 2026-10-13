/**
 * Internal Diagnostic & Health-Check System for Bidzo Support Assistant
 * 
 * Captures user context, API errors, timeouts, system health, and
 * produces reproducible bug reports with diagnostic IDs.
 */

export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  action: string;
  status: 'info' | 'warn' | 'error' | 'success';
  errorCode?: string;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  checkedAt: string;
  services: {
    serverApi: 'operational' | 'degraded' | 'offline';
    checkoutGateway: 'operational' | 'degraded' | 'offline';
    realtimeSync: 'operational' | 'degraded' | 'offline';
  };
  details?: any;
  error?: string;
}

export interface DiagnosticSnapshot {
  ticketId: string;
  timestamp: string;
  failedAction?: string;
  errorCode?: string;
  errorMessage?: string;
  pageUrl: string;
  viewport: string;
  isOnline: boolean;
  recentLogs: DiagnosticEvent[];
  healthStatus?: string;
  latencyMs?: number;
  customContext?: Record<string, any>;
}

const MAX_LOGS = 25;
const STORAGE_KEY = 'bidzo_diagnostic_events';

// In-memory buffer of recent events
let eventBuffer: DiagnosticEvent[] = [];

// Initialize buffer from sessionStorage if available
try {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    eventBuffer = JSON.parse(saved);
  }
} catch {
  eventBuffer = [];
}

/**
 * Record a diagnostic log event
 */
export function recordDiagnosticLog(event: {
  action: string;
  status?: 'info' | 'warn' | 'error' | 'success';
  errorCode?: string;
  errorMessage?: string;
  details?: Record<string, any>;
}): DiagnosticEvent {
  const newEvent: DiagnosticEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action: event.action,
    status: event.status || 'info',
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    details: event.details,
  };

  eventBuffer.unshift(newEvent);
  if (eventBuffer.length > MAX_LOGS) {
    eventBuffer.pop();
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(eventBuffer));
  } catch {
    // ignore sessionStorage errors in restricted sandboxes
  }

  return newEvent;
}

/**
 * Query recent logs
 */
export function getRecentDiagnosticLogs(): DiagnosticEvent[] {
  return [...eventBuffer];
}

/**
 * Perform a real-time system health check with timeout handling
 */
export async function runSystemHealthCheck(timeoutMs: number = 4000): Promise<SystemHealthReport> {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    recordDiagnosticLog({
      action: 'HEALTH_CHECK_PING',
      status: 'info',
      details: { timeoutMs },
    });

    const response = await fetch('/api/support/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}_${response.statusText}`);
    }

    const data = await response.json();

    const report: SystemHealthReport = {
      status: latency > 1200 ? 'degraded' : 'healthy',
      latencyMs: latency,
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      services: {
        serverApi: 'operational',
        checkoutGateway: data?.services?.checkout_gateway === 'operational' ? 'operational' : 'degraded',
        realtimeSync: 'operational',
      },
      details: data,
    };

    recordDiagnosticLog({
      action: 'HEALTH_CHECK_SUCCESS',
      status: 'success',
      details: { latencyMs: latency, status: report.status },
    });

    return report;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);
    const isTimeout = err?.name === 'AbortError' || latency >= timeoutMs;
    const errorCode = isTimeout ? 'TIMEOUT_ERROR' : (err?.message?.includes('HTTP') ? err.message : 'NETWORK_FAILURE');
    const errorMessage = isTimeout
      ? `System health request timed out after ${timeoutMs}ms.`
      : (err?.message || 'Failed to establish connection with server API.');

    recordDiagnosticLog({
      action: 'HEALTH_CHECK_FAILURE',
      status: 'error',
      errorCode,
      errorMessage,
      details: { latencyMs: latency, isTimeout },
    });

    return {
      status: 'offline',
      latencyMs: latency,
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      services: {
        serverApi: 'offline',
        checkoutGateway: 'offline',
        realtimeSync: 'degraded',
      },
      error: errorMessage,
    };
  }
}

/**
 * Capture a diagnostic context snapshot for bug reporting
 */
export function captureDiagnosticSnapshot(options?: {
  failedAction?: string;
  errorCode?: string;
  errorMessage?: string;
  customContext?: Record<string, any>;
}): DiagnosticSnapshot {
  const ticketId = `DBG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const snapshot: DiagnosticSnapshot = {
    ticketId,
    timestamp: new Date().toISOString(),
    failedAction: options?.failedAction || 'USER_REPORTED_ISSUE',
    errorCode: options?.errorCode || 'DIAG_USER_FLAG',
    errorMessage: options?.errorMessage,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    recentLogs: eventBuffer.slice(0, 5),
    customContext: options?.customContext,
  };

  recordDiagnosticLog({
    action: 'CAPTURE_DIAGNOSTIC_SNAPSHOT',
    status: 'warn',
    errorCode: snapshot.errorCode,
    details: { ticketId, failedAction: snapshot.failedAction },
  });

  // Attempt async fire-and-forget logging to server backend
  try {
    fetch('/api/support/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logId: ticketId,
        errorCode: snapshot.errorCode,
        failedAction: snapshot.failedAction,
        context: {
          errorMessage: snapshot.errorMessage,
          pageUrl: snapshot.pageUrl,
          viewport: snapshot.viewport,
          isOnline: snapshot.isOnline,
          customContext: snapshot.customContext,
        },
        clientInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        },
      }),
    }).catch(() => {
      // safe fallback if server endpoint is unreachable
    });
  } catch {
    // ignore
  }

  return snapshot;
}

/**
 * Format a diagnostic snapshot as plain text for clipboard / email
 */
export function formatDiagnosticReport(snapshot: DiagnosticSnapshot): string {
  return [
    `=== BIDZO DIAGNOSTIC REPORT ===`,
    `Ticket ID: #${snapshot.ticketId}`,
    `Timestamp: ${snapshot.timestamp}`,
    `Failed Action: ${snapshot.failedAction || 'N/A'}`,
    `Error Code: ${snapshot.errorCode || 'None'}`,
    snapshot.errorMessage ? `Error Message: ${snapshot.errorMessage}` : null,
    `Network Online: ${snapshot.isOnline ? 'Yes' : 'No'}`,
    `Viewport: ${snapshot.viewport}`,
    `Page URL: ${snapshot.pageUrl}`,
    `--- RECENT TELEMETRY EVENTS ---`,
    ...snapshot.recentLogs.map((log) => 
      `• [${log.timestamp.slice(11, 19)}] [${log.status.toUpperCase()}] ${log.action}${log.errorCode ? ` (${log.errorCode})` : ''}`
    ),
    `================================`,
  ].filter(Boolean).join('\n');
}
