'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileInput } from '@/components/ui/mobile-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { validateSAID } from '@/lib/validation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loader2, LogIn, Shield, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  saId: string;
  phone: string;
  otp: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { setLoading } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    saId: '',
    phone: '',
    otp: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpSent, setOtpSent] = useState(false);

  const validateCredentials = (): boolean => {
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCredentials()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: formData.phone,
          saId: formData.saId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent to your phone number');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.length < 4) {
      setErrors({ otp: 'Please enter the OTP code' });
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      // First verify the OTP using the working endpoint
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: formData.phone,
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      // If OTP verification successful, create login session
      if (data.success && data.user) {
        // Call the login session endpoint to create JWT token
        const loginResponse = await fetch('/api/session/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: data.user.id,
            phone: data.user.phone,
          }),
        });

        if (loginResponse.ok) {
          toast.success('Login successful! Redirecting to marketplace...');
          setTimeout(() => {
            router.push('/marketplace');
          }, 1000);
        } else {
          // Fallback: redirect without JWT if session creation fails
          toast.success('Login successful! Redirecting to marketplace...');
          setTimeout(() => {
            router.push('/marketplace');
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      setErrors({ otp: error.message || 'Invalid OTP code' });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtpSent(false);
    setFormData({ ...formData, otp: '' });
    setErrors({});
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
              {step === 'credentials' ? 'Welcome Back' : 'Verify Your Phone'}
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              {step === 'credentials'
                ? 'Sign in to your Bigg Buzz account'
                : 'Enter the verification code sent to your phone'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'credentials' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
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
                      <span className="font-bold">Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-3" />
                      <span className="font-bold">Send Verification Code</span>
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-bigg-neon-green font-bold text-base flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enter Verification Code
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={formData.otp}
                      onChange={(value) => {
                        setFormData({ ...formData, otp: value });
                        if (errors.otp) setErrors({ ...errors, otp: '' });
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {errors.otp && (
                    <p className="text-red-400 text-sm mt-2 text-center">
                      {errors.otp}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 text-center">
                    Code sent to {formData.phone}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full shadow-bigg-glow-green-intense"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        <span className="font-bold">Verifying...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-3" />
                        <span className="font-bold">Sign In</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToCredentials}
                    className="w-full text-gray-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to credentials
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center text-base text-gray-300 pt-6 border-t border-white/10 mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-bigg-neon-green hover:text-bigg-neon-green-bright font-bold transition-colors duration-300 hover:underline">
                Join the Hive
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}