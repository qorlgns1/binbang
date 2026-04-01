import { SubscriptionOverview } from './_components/SubscriptionOverview';

export const metadata = {
  title: '베타 이용 정보',
  description: '빈방 베타 이용 현황과 현재 제공 범위',
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
