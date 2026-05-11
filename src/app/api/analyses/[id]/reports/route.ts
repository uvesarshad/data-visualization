import { NextRequest, NextResponse } from 'next/server';
import { saveReport, getReportsForAnalysis } from '@/lib/database';

// GET /api/analyses/[id]/reports — list reports for an analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const analysisId = parseInt(idStr, 10);
    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const reports = getReportsForAnalysis(analysisId);
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('GET /api/analyses/[id]/reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST /api/analyses/[id]/reports — save a report for an analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const analysisId = parseInt(idStr, 10);
    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const body = await request.json();
    const { report } = body;

    if (!report) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
    }

    const reportId = saveReport(analysisId, report);
    return NextResponse.json({ id: reportId, success: true });
  } catch (error) {
    console.error('POST /api/analyses/[id]/reports error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}