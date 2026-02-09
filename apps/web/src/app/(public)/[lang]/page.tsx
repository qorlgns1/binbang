import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing/LandingPage';
import { authOptions } from '@/lib/auth';
import { getLandingCopy, isValidLang, supportedLangs } from '@/lib/i18n/landing';

export async function generateStaticParams() {
  return supportedLangs.map((lang) => ({ lang }));
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

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
