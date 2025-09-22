import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to{' '}
            <span className="text-cannabis-600">Bigg Buzz</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            South Africa&apos;s premier cannabis marketplace connecting consumers with verified vendors.
            Discover quality products from trusted local suppliers.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/marketplace">Browse Products</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/vendors">Find Vendors</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Why Choose Bigg Buzz?
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground">
            We provide a safe, secure, and compliant platform for cannabis commerce in South Africa.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Verified Vendors</CardTitle>
              <CardDescription>
                All vendors are thoroughly vetted and verified for compliance and quality.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Age Verification</CardTitle>
              <CardDescription>
                Strict age verification using South African ID numbers ensures legal compliance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure Payments</CardTitle>
              <CardDescription>
                Multiple secure payment options with buyer protection and fraud prevention.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance</CardTitle>
              <CardDescription>
                Lab-tested products with detailed cannabinoid profiles and quality guarantees.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fast Delivery</CardTitle>
              <CardDescription>
                Quick and discreet delivery across South Africa with tracking included.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Support</CardTitle>
              <CardDescription>
                24/7 customer support to help with orders, products, and any questions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 text-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground">
            Join thousands of satisfied customers and verified vendors on South Africa&apos;s most trusted cannabis marketplace.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/become-vendor">Become a Vendor</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}