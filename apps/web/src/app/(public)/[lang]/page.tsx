import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing/LandingPage';
import { authOptions } from '@/lib/auth';
import { getLandingCopy, isValidLang, supportedLangs } from '@/lib/i18n/landing';

/**
 * Provide static route parameters for each supported language.
 *
 * @returns An array of objects where each object has a `lang` property set to a supported language (e.g., `{ lang: 'en' }`)
 */
export async function generateStaticParams() {
  return supportedLangs.map((lang) => ({ lang }));
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

/**
 * Render the localized landing page for the requested language, redirecting authenticated users to /dashboard.
 *
 * If the route `lang` is not a supported language, triggers a 404 via `notFound()`. If a server session with a user exists, redirects to `/dashboard`.
 *
 * @param params - A promise resolving to an object with the route `lang` string (e.g., `{ lang: 'en' }`)
 * @returns A React element rendering the landing page localized to the provided `lang`
 */
export default async function Home({ params }: PageProps): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (session?.user) redirect('/dashboard');

  const { lang: langParam } = await params;

  if (!isValidLang(langParam)) {
    notFound();
  }

  const copy = getLandingCopy(langParam);

  return (
    <LandingPage
      lang={langParam}
      copy={copy}
    />
  );
}
