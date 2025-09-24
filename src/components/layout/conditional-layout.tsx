'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Hide header and footer for admin and marketplace routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isMarketplaceRoute = pathname.startsWith('/marketplace');

  if (isAdminRoute || isMarketplaceRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}