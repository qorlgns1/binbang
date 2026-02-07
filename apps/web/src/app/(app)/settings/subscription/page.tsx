import { SubscriptionOverview } from './_components/subscriptionOverview';

export const metadata = {
  title: '구독 관리',
  description: '빈방어때 구독 및 요금제 관리',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubscriptionPage(): React.ReactElement {
  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <SubscriptionOverview />
    </main>
  );
}
