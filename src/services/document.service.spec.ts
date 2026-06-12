/** @jest-environment node */
import * as documentActions from '@/database/actions/document-actions';
import type { Document } from '@/database/schema/documents-schema';
import * as documentService from '@/services/document.service';

jest.mock('@/database/actions/document-actions');

const mockedDocumentActions = jest.mocked(documentActions);

function buildDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    userId: 'user-1',
    title: 'Untitled',
    contentHtml: '',
    createdAt: new Date('2026-06-12T00:00:00Z'),
    updatedAt: new Date('2026-06-12T00:00:00Z'),
    ...overrides,
  };
}

describe('updateDocument', () => {
  it('sanitizes content before persisting (XSS never reaches the DB)', async () => {
    mockedDocumentActions.updateDocumentForUser.mockResolvedValue(
      buildDocument()
    );

    await documentService.updateDocument('doc-1', 'user-1', {
      contentHtml: '<p>ok</p><script>alert(1)</script>',
    });

    expect(mockedDocumentActions.updateDocumentForUser).toHaveBeenCalledWith(
      'doc-1',
      'user-1',
      { contentHtml: '<p>ok</p>' }
    );
  });

  it('renames without touching content', async () => {
    mockedDocumentActions.updateDocumentForUser.mockResolvedValue(
      buildDocument({ title: 'Renamed' })
    );

    const result = await documentService.updateDocument('doc-1', 'user-1', {
      title: 'Renamed',
    });

    expect(mockedDocumentActions.updateDocumentForUser).toHaveBeenCalledWith(
      'doc-1',
      'user-1',
      { title: 'Renamed' }
    );
    expect(result?.title).toBe('Renamed');
  });

  it('returns null when the document is missing or not owned', async () => {
    mockedDocumentActions.updateDocumentForUser.mockResolvedValue(undefined);

    await expect(
      documentService.updateDocument('doc-x', 'user-1', { title: 'a' })
    ).resolves.toBeNull();
  });
});

describe('listDocuments', () => {
  it('returns serializable list items', async () => {
    mockedDocumentActions.listDocumentsByUser.mockResolvedValue([
      { id: 'doc-1', title: 'Notes', updatedAt: new Date('2026-06-12') },
    ]);

    const result = await documentService.listDocuments('user-1');

    expect(result).toEqual([
      { id: 'doc-1', title: 'Notes', updatedAt: expect.any(String) },
    ]);
  });
});
