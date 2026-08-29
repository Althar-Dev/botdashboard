import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { UserOrder } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status')?.toLowerCase() || '';

    const users = await getUsers();
    let allOrders: (UserOrder & { userId: number; username?: string })[] = [];

    users.forEach((u) => {
      if (u.order && Array.isArray(u.order)) {
        u.order.forEach((ord) => {
          allOrders.push({
            ...ord,
            userId: u.id,
            username: u.username,
          });
        });
      }
    });

    // Filter by query if provided
    if (query) {
      allOrders = allOrders.filter(
        (ord) =>
          ord.id.toLowerCase().includes(query) ||
          ord.product.toLowerCase().includes(query) ||
          (ord.username && ord.username.toLowerCase().includes(query)) ||
          String(ord.userId).includes(query)
      );
    }

    // Filter by status if provided
    if (status) {
      allOrders = allOrders.filter((ord) => (ord.status || 'success').toLowerCase() === status);
    }

    // Sort descending by date
    allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, count: allOrders.length, data: allOrders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
