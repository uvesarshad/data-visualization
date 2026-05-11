import { NextRequest, NextResponse } from 'next/server';
import { saveAnalysis, listAnalyses, searchAnalyses, getAnalysisCount } from '@/lib/database';

// GET /api/analyses — list all saved analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let analyses;
    if (query) {
      analyses = searchAnalyses(query);
    } else {
      analyses = listAnalyses(limit, offset);
    }

    const total = getAnalysisCount();

    return NextResponse.json({ analyses, total });
  } catch (error) {
    console.error('GET /api/analyses error:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}

// POST /api/analyses — save a new analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, fileName, data, metadata, recommendations, insights, columnStats, validationWarnings, groundingEnabled } = body;

    console.log('[API POST] Saving analysis request for:', name, 'File:', fileName, 'Data size:', data?.length);

    if (!name || !fileName || !data || !metadata) {
      console.error('[API POST] Missing required fields:', { name: !!name, fileName: !!fileName, data: !!data, metadata: !!metadata });
      return NextResponse.json({ error: 'Missing required fields: name, fileName, data, metadata' }, { status: 400 });
    }

    const id = saveAnalysis({
      name,
      fileName,
      data,
      metadata,
      recommendations,
      insights,
      columnStats,
      validationWarnings,
      groundingEnabled,
    });

    console.log('[API POST] Successfully saved analysis with ID:', id);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('[API POST] error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}