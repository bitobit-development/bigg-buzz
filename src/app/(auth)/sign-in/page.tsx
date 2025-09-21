'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileInput } from '@/components/ui/mobile-input';
import { validateSAID, normalizePhoneNumber, unformatPhoneNumber } from '@/lib/validation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loader2, LogIn, Shield, Phone } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  saId: string;
  phone: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { setLoading } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    saId: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.saId) {
      newErrors.saId = 'SA ID is required';
    } else if (!validateSAID(formData.saId)) {
      newErrors.saId = 'Invalid SA ID number';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      // For now, just show a message that sign-in is not implemented yet
      // In a real implementation, this would verify credentials and log the user in
      toast.info('Sign-in functionality is currently under development. Please contact support if you need access to your existing account.');

      // Optional: redirect to a coming soon page or support contact
      setTimeout(() => {
        router.push('/contact-support');
      }, 3000);

    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bigg-darker via-bigg-dark to-bigg-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bigg-neon-green/10 rounded-full blur-3xl animate-bigg-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bigg-bee-orange/10 rounded-full blur-3xl animate-bigg-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="border-bigg-neon-green/20 shadow-2xl shadow-bigg-neon-green/10 backdrop-blur-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 relative">
              <h1 className="text-4xl font-black bg-gradient-to-r from-bigg-neon-green via-white to-bigg-chrome bg-clip-text text-transparent animate-bigg-chrome-shine">
                BIGG BUZZ
              </h1>
              <div className="absolute inset-0 bg-bigg-neon-green/20 blur-xl rounded-full" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
              <LogIn className="w-6 h-6 mr-2 text-bigg-neon-green" />
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Sign in to your Bigg Buzz account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="saId" className="text-bigg-neon-green font-bold text-base flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  South African ID Number
                </Label>
                <Input
                  id="saId"
                  type="text"
                  placeholder="0000000000000"
                  value={formData.saId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                    setFormData({ ...formData, saId: value });
                    if (errors.saId) setErrors({ ...errors, saId: '' });
                  }}
                  className={errors.saId ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}
                  maxLength={13}
                />
                {errors.saId && (
                  <p className="text-red-400 text-sm mt-2">
                    {errors.saId}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-bigg-neon-green font-bold text-base flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Mobile Phone Number
                </Label>
                <MobileInput
                  id="phone"
                  value={formData.phone}
                  onChange={(cleanValue, formattedValue) => {
                    setFormData({ ...formData, phone: formattedValue });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  className={errors.phone ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-2">
                    {errors.phone}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2 font-medium">
                  e.g., 082 329 2438
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full shadow-bigg-glow-green-intense"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    <span className="font-bold">Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-3" />
                    <span className="font-bold">Sign In</span>
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-base text-gray-300 pt-6 border-t border-white/10 mt-8">
              Don't have an account?{' '}
              <Link href="/register" className="text-bigg-neon-green hover:text-bigg-neon-green-bright font-bold transition-colors duration-300 hover:underline">
                Join the Hive
              </Link>
            </div>

            <div className="mt-4 p-4 bg-bigg-bee-orange/10 border border-bigg-bee-orange/20 rounded-lg">
              <p className="text-sm text-bigg-bee-orange font-medium">
                <strong>Notice:</strong> Sign-in functionality is currently under development.
                If you have an existing account and need assistance, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}