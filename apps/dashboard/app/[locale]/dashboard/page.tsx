import { redirect } from 'next/navigation';

export default function LocaleDashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  // Redirect to main dashboard which handles the full UI
  redirect('/dashboard');
}
