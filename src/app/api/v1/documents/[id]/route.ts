import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireSubscriber } from '@/lib/auth/require-subscriber';
import { requireAuth } from '@/lib/auth/route-auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  PayloadTooLargeError,
  readJsonBody,
} from '@/lib/security/read-json-body';
import * as documentService from '@/services/document.service';
import {
  documentIdSchema,
  updateDocumentSchema,
} from '@/validators/document.validators';

const AUTOSAVE_BODY_LIMIT = 1024 * 1024; // 1MB — matches the Zod content cap

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/documents/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = await requireSubscriber(auth);
  if (forbidden) {
    return forbidden;
  }

  const id = await validatedId(context);
  if (!id) {
    return invalidIdResponse();
  }

  const document = await documentService.getDocument(id, auth.userId);

  // 404 for both not-found and not-owned — no existence oracle.
  if (!document) {
    return notFoundResponse();
  }

  return NextResponse.json({ document });
}

/**
 * PATCH /api/v1/documents/[id] — rename and/or autosave content.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = await requireSubscriber(auth);
  if (forbidden) {
    return forbidden;
  }

  const limited = enforceRateLimit(
    request,
    `doc-save:${auth.userId}`,
    120,
    60_000
  );
  if (limited) {
    return limited;
  }

  const id = await validatedId(context);
  if (!id) {
    return invalidIdResponse();
  }

  try {
    const input = updateDocumentSchema.parse(
      await readJsonBody(request, AUTOSAVE_BODY_LIMIT)
    );
    const document = await documentService.updateDocument(
      id,
      auth.userId,
      input
    );

    if (!document) {
      return notFoundResponse();
    }

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/documents/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const forbidden = await requireSubscriber(auth);
  if (forbidden) {
    return forbidden;
  }

  const id = await validatedId(context);
  if (!id) {
    return invalidIdResponse();
  }

  const deleted = await documentService.deleteDocument(id, auth.userId);

  if (!deleted) {
    return notFoundResponse();
  }

  return NextResponse.json({ success: true });
}

async function validatedId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;
  const result = documentIdSchema.safeParse(id);

  return result.success ? result.data : null;
}

function invalidIdResponse(): NextResponse {
  return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
}

function notFoundResponse(): NextResponse {
  return NextResponse.json({ error: 'Document not found' }, { status: 404 });
}
