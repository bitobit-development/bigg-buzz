'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { Sheet } from '@/components/ui/sheet';
import { Avatar } from '@/components/ui/avatar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-cannabis-600" />
          <span className="font-bold text-xl">Bigg Buzz</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/marketplace"
            className="text-sm font-medium transition-colors hover:text-cannabis-600"
          >
            Marketplace
          </Link>
          <Link
            href="/vendors"
            className="text-sm font-medium transition-colors hover:text-cannabis-600"
          >
            Vendors
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium transition-colors hover:text-cannabis-600"
          >
            About
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}