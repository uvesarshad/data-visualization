import { NextRequest, NextResponse } from 'next/server';
import { saveAnalysis, listAnalyses, searchAnalyses, getAnalysisCount, PayloadTooLargeError, MAX_DATA_JSON_BYTES } from '@/lib/database';

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

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API POST] Saving analysis request for:', name, 'File:', fileName, 'Data size:', data?.length);
    }

    if (!name || !fileName || !data || !metadata) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[API POST] Missing required fields:', { name: !!name, fileName: !!fileName, data: !!data, metadata: !!metadata });
      }
      return NextResponse.json({ error: 'Missing required fields: name, fileName, data, metadata' }, { status: 400 });
    }

    try {
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

      if (process.env.NODE_ENV !== 'production') {
        console.log('[API POST] Successfully saved analysis with ID:', id);
      }
      return NextResponse.json({ id, success: true });
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        const maxMb = Math.round(MAX_DATA_JSON_BYTES / (1024 * 1024));
        const actualMb = Math.round(err.actualBytes / (1024 * 1024));
        return NextResponse.json(
          {
            error: 'Dataset too large to save',
            detail: `Serialized dataset is ${actualMb} MB; the per-analysis limit is ${maxMb} MB. Filter or sample your data before saving.`,
            actualBytes: err.actualBytes,
            maxBytes: err.maxBytes,
          },
          { status: 413 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('[API POST] error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}