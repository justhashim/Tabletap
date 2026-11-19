import { redirect } from 'next/navigation';

export default function Home() {
  // The kitchen display requires a restaurant ID.
  // In production this page would show a setup screen; for now redirect to a placeholder.
  redirect('/setup');
}
