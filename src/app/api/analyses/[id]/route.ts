import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis, updateAnalysis, deleteAnalysis } from '@/lib/database';

// GET /api/analyses/[id] — get a single analysis with full data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const analysis = getAnalysis(id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('GET /api/analyses/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}

// PATCH /api/analyses/[id] — update an analysis
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const body = await request.json();
    updateAnalysis(id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/analyses/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 });
  }
}

// DELETE /api/analyses/[id] — delete an analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const deleted = deleteAnalysis(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/analyses/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
  }
}