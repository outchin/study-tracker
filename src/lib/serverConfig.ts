import { NotionConfig } from '@/types/config';

export function getConfigFromRequest(request: Request): NotionConfig | null {
  const authHeader = request.headers.get('authorization');
  const categoriesDbId = request.headers.get('x-categories-db-id');
  const sessionsDbId = request.headers.get('x-sessions-db-id');

  if (!authHeader || !categoriesDbId || !sessionsDbId) {
    return null;
  }

  const apiKey = authHeader.replace('Bearer ', '');

  return {
    apiKey,
    categoriesDbId,
    sessionsDbId
  };
}

export function getNotionHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28'
  };
}