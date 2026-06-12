import { NextRequest, NextResponse } from 'next/server';

import { requireSubscriber } from '@/lib/auth/require-subscriber';
import { requireAuth } from '@/lib/auth/route-auth';
import * as documentService from '@/services/document.service';

/**
 * GET /api/v1/documents — list the caller's documents.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = await requireSubscriber(auth);
  if (forbidden) {
    return forbidden;
  }

  const documents = await documentService.listDocuments(auth.userId);

  return NextResponse.json({ documents });
}

/**
 * POST /api/v1/documents — create a document with the default title.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = await requireSubscriber(auth);
  if (forbidden) {
    return forbidden;
  }

  try {
    const document = await documentService.createDocument(auth.userId);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
