import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, saldo, action, amount } = body;

    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.id === Number(userId));

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (typeof saldo === 'number') {
      users[userIndex].saldo = Math.max(0, saldo);
    } else if (action === 'add' && typeof amount === 'number') {
      users[userIndex].saldo += amount;
    } else if (action === 'deduct' && typeof amount === 'number') {
      users[userIndex].saldo = Math.max(0, users[userIndex].saldo - amount);
    }

    await saveUsers(users);
    return NextResponse.json({ success: true, data: users[userIndex] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
