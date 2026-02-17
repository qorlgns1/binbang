import { Bot, Cloud, DollarSign, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('common.appName'),
    description: t('landing.hero.subtitle'),
    url: `https://binbang.com/${locale}`,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      t('landing.features.aiChat.title'),
      t('landing.features.weather.title'),
      t('landing.features.exchange.title'),
      t('landing.features.map.title'),
    ],
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe */}
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPageClient />
    </>
  );
}

function LandingPageClient() {
  const t = useTranslations();

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-xl font-bold'>{t('common.appName')}</h1>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className='container mx-auto px-4 py-20 md:py-32'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-brand-amber bg-clip-text text-transparent'>
            {t('landing.hero.title')}
          </h2>
          <p className='text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
            {t('landing.hero.subtitle')}
          </p>
          <Link
            href='/chat'
            className='inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all duration-150 shadow-lg hover:shadow-xl active:scale-95'
          >
            {t('landing.hero.cta')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className='container mx-auto px-4 py-20 bg-muted/30'>
        <h3 className='text-3xl font-bold text-center mb-12'>{t('landing.features.title')}</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto'>
          <FeatureCard
            icon={<Bot className='h-8 w-8' />}
            title={t('landing.features.aiChat.title')}
            description={t('landing.features.aiChat.description')}
          />
          <FeatureCard
            icon={<Cloud className='h-8 w-8' />}
            title={t('landing.features.weather.title')}
            description={t('landing.features.weather.description')}
          />
          <FeatureCard
            icon={<DollarSign className='h-8 w-8' />}
            title={t('landing.features.exchange.title')}
            description={t('landing.features.exchange.description')}
          />
          <FeatureCard
            icon={<MapPin className='h-8 w-8' />}
            title={t('landing.features.map.title')}
            description={t('landing.features.map.description')}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-border bg-background py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <p className='text-sm text-muted-foreground'>© 2026 {t('common.appName')}. All rights reserved.</p>
            <div className='flex gap-6 text-sm'>
              <Link href='/about' className='text-muted-foreground hover:text-foreground transition-colors'>
                {t('landing.footer.about')}
              </Link>
              <Link href='/contact' className='text-muted-foreground hover:text-foreground transition-colors'>
                {t('landing.footer.contact')}
              </Link>
              <Link href='/privacy' className='text-muted-foreground hover:text-foreground transition-colors'>
                {t('landing.footer.privacy')}
              </Link>
              <Link href='/terms' className='text-muted-foreground hover:text-foreground transition-colors'>
                {t('landing.footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className='bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow'>
      <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4'>
        {icon}
      </div>
      <h4 className='text-lg font-semibold mb-2'>{title}</h4>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}
