import type { Metadata } from 'next';
import { AdminShell } from './_components/admin-shell';

export const metadata: Metadata = {
  title: '后台管理',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
