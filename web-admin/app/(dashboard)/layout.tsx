import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HybridNavigationTopBar>{children}</HybridNavigationTopBar>;
}
