import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';

import { UserDetailView } from './_components/userDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.roles?.includes('ADMIN')) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return (
    <main className='max-w-7xl mx-auto px-4 py-8'>
      <UserDetailView userId={id} />
    </main>
  );
}
