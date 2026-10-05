import { QuizApp } from '@/components/QuizApp';
import { loadPublicContent } from '@/lib/server/publicContent';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  return <QuizApp {...await loadPublicContent()} />;
}
