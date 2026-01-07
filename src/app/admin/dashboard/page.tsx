import { Suspense } from 'react';
import { AdminDashboardSkeleton } from '../_components/AdminSkeletons';
import DashboardClient from './DashboardClient';

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}

