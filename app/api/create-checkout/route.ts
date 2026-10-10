import { createAtexPayCheckout } from '../../../src/lib/atexpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const origin = url.origin;

    const result = await createAtexPayCheckout(
      {
        amount: Number(body.amount),
        profile_url: body.profile_url,
        message: body.message,
        category: body.category,
        payment_method: body.payment_method,
        user_name: body.user_name,
        handle: body.handle,
        platform: body.platform,
      },
      origin
    );

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to process checkout request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
