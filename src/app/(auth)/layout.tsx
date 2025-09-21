import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Bigg Buzz',
  description: 'Sign up or log in to your Bigg Buzz account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}