import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { orderReceipt } from '@/lib/server/payments/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Receipt for the order-success page. Requires the token handed out at checkout, so
 * knowing an order id alone does not expose someone else's purchase.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get('token');
    const receipt = await orderReceipt(id, token);
    return NextResponse.json(receipt, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
