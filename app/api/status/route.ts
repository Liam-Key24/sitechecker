import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, checked } = body;

    if (typeof businessId !== 'string' || typeof checked !== 'boolean') {
      return NextResponse.json(
        { error: 'businessId (string) and checked (boolean) are required' },
        { status: 400 }
      );
    }

    const business = await db.business.update({
      where: { id: businessId },
      data: { checked },
    });

    return NextResponse.json({ success: true, checked: business.checked });
  } catch (error: any) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}

