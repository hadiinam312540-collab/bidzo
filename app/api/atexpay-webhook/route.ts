import { handleAtexPayWebhook } from '../../../src/lib/atexpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await handleAtexPayWebhook(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        received: false,
        error: err?.message || 'Failed to process webhook',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
