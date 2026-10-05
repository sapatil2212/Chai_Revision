import { HomeApp } from '@/components/HomeApp';
import { loadPublicContent } from '@/lib/server/publicContent';

// Always render with fresh DB content so admin changes show up immediately
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <HomeApp {...await loadPublicContent()} />;
}
