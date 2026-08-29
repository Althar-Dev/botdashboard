import { NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/db';

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.bot || !body.svalepay) {
      return NextResponse.json({ success: false, error: 'Invalid config structure' }, { status: 400 });
    }

    const saved = await saveConfig(body);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Failed to save config file' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}
