'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileInput } from '@/components/ui/mobile-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Skeleton } from '@/components/ui/skeleton';
import { validateSAID, parseSAID, validatePhoneNumber, normalizePhoneNumber, unformatPhoneNumber } from '@/lib/validation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDeviceDetection, getResponsiveClasses, getOptimalFormLayout, getDeviceContainerClasses } from '@/lib/utils/device';
import { Loader2, CheckCircle, AlertCircle, Shield, User, Phone, FileText, MessageSquare, Timer } from 'lucide-react';
import Link from 'next/link';

type RegistrationStep = 'identity' | 'personal-info' | 'mobile-verification' | 'terms-conditions' | 'complete';

interface FormData {
  saId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  marketingConsent: boolean;
  ageVerification: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface SAIDInfo {
  dateOfBirth: Date;
  age: number;
  gender: string;
  isSACitizen: boolean;
  isValidAge: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setLoading, login } = useAuthStore();
  const deviceInfo = useDeviceDetection();
  const responsiveClasses = getResponsiveClasses(deviceInfo);

  const [currentStep, setCurrentStep] = useState<RegistrationStep>('identity');
  const [formData, setFormData] = useState<FormData>({
    saId: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    marketingConsent: false,
    ageVerification: false,
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [saIdInfo, setSAIdInfo] = useState<SAIDInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'whatsapp'>('sms');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'identity':
        if (!formData.saId) {
          newErrors.saId = 'SA ID is required';
        } else if (!validateSAID(formData.saId)) {
          newErrors.saId = 'Invalid SA ID number';
        } else {
          try {
            const idInfo = parseSAID(formData.saId);
            if (!idInfo.isValidAge) {
              newErrors.saId = 'You must be at least 18 years old to register';
            } else {
              setSAIdInfo(idInfo);
            }
          } catch (error) {
            newErrors.saId = 'Invalid SA ID number';
          }
        }

        if (!formData.ageVerification) {
          newErrors.ageVerification = 'Age verification is required';
        }
        break;

      case 'personal-info':
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!formData.phone) {
          newErrors.phone = 'Phone number is required';
        } else if (!validatePhoneNumber(unformatPhoneNumber(formData.phone))) {
          newErrors.phone = 'Invalid phone number format';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        break;

      case 'mobile-verification':
        if (!otp || otp.length !== 6) {
          newErrors.otp = 'Please enter the complete 6-digit verification code';
        }
        if (otpAttempts >= 3) {
          newErrors.otp = 'Too many failed attempts. Please request a new code';
        }
        break;

      case 'terms-conditions':
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'You must accept the terms and conditions';
        }
        if (!formData.privacyAccepted) {
          newErrors.privacyAccepted = 'You must accept the privacy policy';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    switch (currentStep) {
      case 'identity':
        setCurrentStep('personal-info');
        break;
      case 'personal-info':
        setCurrentStep('mobile-verification');
        await handleRegistration();
        break;
      case 'mobile-verification':
        await handleOTPVerification();
        break;
      case 'terms-conditions':
        await handleFinalSubmission();
        break;
    }
  };

  const handleRegistration = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saId: formData.saId,
          phone: normalizePhoneNumber(unformatPhoneNumber(formData.phone)),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email?.trim() || undefined,
          marketingConsent: formData.marketingConsent,
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted,
          channel: deliveryMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409 && data.code === 'USER_EXISTS') {
          // User already exists - show error with redirect option
          toast.error(data.error, {
            duration: 8000,
            action: {
              label: 'Sign In Instead',
              onClick: () => router.push('/sign-in'),
            },
          });
          return; // Don't throw error, just return
        }

        throw new Error(data.error || 'Registration failed');
      }

      setUserId(data.userId);
      setOtpSent(true);
      setResendCountdown(60); // Start with 60 second cooldown
      toast.success(`Registration successful! Verification code sent via ${deliveryMethod.toUpperCase()}.`);

    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Check if the error indicates a user already exists
        if (errorMessage.includes('already exists')) {
          // Show error with option to redirect to sign-in
          toast.error(errorMessage, {
            duration: 6000,
            action: {
              label: 'Sign In',
              onClick: () => router.push('/sign-in'),
            },
          });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizePhoneNumber(unformatPhoneNumber(formData.phone)),
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpAttempts(prev => prev + 1);
        if (otpAttempts >= 2) {
          toast.error('Too many failed attempts. Please request a new verification code.');
          setOtp('');
          setOtpAttempts(0);
        } else {
          toast.error(data.error || 'Invalid verification code. Please try again.');
        }
        throw new Error(data.error || 'OTP verification failed');
      }

      setCurrentStep('terms-conditions');
      toast.success('Phone number verified successfully!');

    } catch (error) {
      console.error('OTP verification error:', error);
      // Don't show additional toast as we already handled it above
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmission = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      // Update auth store with user data
      login({
        id: data.user.id,
        email: data.user.email || '',
        name: `${data.user.firstName} ${data.user.lastName}`,
        role: 'customer',
        isVerified: data.user.isPhoneVerified,
        profile: {
          phone: data.user.phone,
          idNumber: formData.saId,
          dateOfBirth: saIdInfo?.dateOfBirth.toISOString(),
        },
      });

      setCurrentStep('complete');
      toast.success('Registration completed successfully!');

      // Redirect to marketplace after a short delay
      setTimeout(() => {
        router.push('/marketplace');
      }, 2000);

    } catch (error) {
      console.error('Final submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete registration');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizePhoneNumber(unformatPhoneNumber(formData.phone)),
          channel: deliveryMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setOtp('');
      setOtpAttempts(0);
      setResendCountdown(60); // 60 second cooldown
      toast.success(`Verification code sent via ${deliveryMethod.toUpperCase()}!`);

    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'personal-info':
        setCurrentStep('identity');
        break;
      case 'mobile-verification':
        setCurrentStep('personal-info');
        break;
      case 'terms-conditions':
        setCurrentStep('mobile-verification');
        break;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      {
        key: 'identity',
        label: 'Identity Verification',
        stepNumber: 1,
        completed: ['personal-info', 'mobile-verification', 'terms-conditions', 'complete'].includes(currentStep)
      },
      {
        key: 'personal-info',
        label: 'Personal Information',
        stepNumber: 2,
        completed: ['mobile-verification', 'terms-conditions', 'complete'].includes(currentStep)
      },
      {
        key: 'mobile-verification',
        label: 'Mobile Verification',
        stepNumber: 3,
        completed: ['terms-conditions', 'complete'].includes(currentStep)
      },
      {
        key: 'terms-conditions',
        label: 'Terms & Conditions',
        stepNumber: 4,
        completed: currentStep === 'complete'
      },
    ];

    const currentStepInfo = steps.find(step => step.key === currentStep);
    const totalSteps = steps.length;

    return (
      <div className={responsiveClasses.stepIndicator}>
        <div className={`${responsiveClasses.stepText} font-bold text-white mb-2`}>
          Step {currentStepInfo?.stepNumber || 1} of {totalSteps}:
          <span className="text-bigg-neon-green block sm:inline sm:ml-2 mt-1 sm:mt-0">
            {currentStepInfo?.label || 'Identity Verification'}
          </span>
        </div>

        {/* Progress indicator with responsive spacing */}
        <div className={responsiveClasses.stepDots}>
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = step.completed;

            return (
              <div
                key={step.key}
                className={`${responsiveClasses.stepDot} ${
                  isCompleted
                    ? 'bg-bigg-neon-green shadow-bigg-glow-green animate-pulse'
                    : isActive
                    ? 'bg-bigg-neon-green'
                    : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const renderIdentityStep = () => (
    <motion.div
      className={responsiveClasses.formContainer}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div className={`text-center ${responsiveClasses.spacing}`} variants={childVariants}>
        <div className={`relative mx-auto ${responsiveClasses.iconSize}`}>
          <Shield className={`${responsiveClasses.iconSize} text-bigg-neon-green mx-auto animate-bigg-pulse`} />
          <div className="absolute inset-0 bg-bigg-neon-green/20 rounded-full blur-xl animate-pulse" />
        </div>
        <h2 className={`${responsiveClasses.headingSize} font-bold bg-gradient-to-r from-white to-bigg-chrome bg-clip-text text-transparent`}>
          Identity Verification
        </h2>
        <p className={`text-gray-300 ${responsiveClasses.bodySize} font-medium`}>
          Please enter your South African ID number to verify your age
        </p>
      </motion.div>

      <motion.div className={responsiveClasses.spacing} variants={childVariants}>
        <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
          <Label htmlFor="saId" className="text-bigg-neon-green font-bold text-base sm:text-lg block text-center">
            South African ID Number
          </Label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
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
              className={`w-full transition-all duration-300 ${errors.saId ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
              maxLength={13}
            />
          </motion.div>
          {errors.saId && (
            <p className="text-red-400 text-sm mt-2 flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 w-full">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {errors.saId}
            </p>
          )}
          {formData.saId.length === 13 && !errors.saId && saIdInfo && (
            <div className="text-sm text-bigg-neon-green mt-2 bg-bigg-neon-green/10 border border-bigg-neon-green/20 rounded-lg p-3 sm:p-4 w-full">
              <p className="flex items-center font-semibold">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                Valid SA ID - Age: {saIdInfo.age}, Gender: {saIdInfo.gender}
              </p>
            </div>
          )}
        </div>

        <div className="bg-bigg-dark/30 border border-white/10 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <Checkbox
              id="ageVerification"
              checked={formData.ageVerification}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, ageVerification: !!checked });
                if (errors.ageVerification) setErrors({ ...errors, ageVerification: '' });
              }}
              className={`mt-1 ${deviceInfo.touchDevice ? 'min-w-5 min-h-5' : ''}`}
            />
            <div className="flex-1">
              <Label htmlFor="ageVerification" className="text-sm sm:text-base font-semibold text-white cursor-pointer leading-relaxed">
                I confirm that I am 18 years or older and legally allowed to purchase cannabis products in South Africa
              </Label>
            </div>
          </div>
        </div>
        {errors.ageVerification && (
          <p className="text-red-400 text-sm flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {errors.ageVerification}
          </p>
        )}
      </motion.div>
    </motion.div>
  );

  const renderPersonalInfoStep = () => (
    <motion.div
      className={responsiveClasses.formContainer}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className={`text-center ${responsiveClasses.spacing}`}>
        <div className={`relative mx-auto ${responsiveClasses.iconSize}`}>
          <User className={`${responsiveClasses.iconSize} text-bigg-bee-orange mx-auto animate-bigg-pulse`} />
          <div className="absolute inset-0 bg-bigg-bee-orange/20 rounded-full blur-xl animate-pulse" />
        </div>
        <h2 className={`${responsiveClasses.headingSize} font-bold bg-gradient-to-r from-white to-bigg-chrome bg-clip-text text-transparent`}>
          Personal Information
        </h2>
        <p className={`text-gray-300 ${responsiveClasses.bodySize} font-medium`}>
          Complete your profile information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="w-full space-y-3 sm:space-y-4">
          <Label htmlFor="firstName" className="text-bigg-neon-green font-bold text-base sm:text-lg block text-center">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) setErrors({ ...errors, firstName: '' });
            }}
            className={`w-full ${errors.firstName ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
          />
          {errors.firstName && (
            <p className="text-red-400 text-sm mt-2 flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="w-full space-y-3 sm:space-y-4">
          <Label htmlFor="lastName" className="text-bigg-neon-green font-bold text-base sm:text-lg block text-center">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) setErrors({ ...errors, lastName: '' });
            }}
            className={`w-full ${errors.lastName ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
          />
          {errors.lastName && (
            <p className="text-red-400 text-sm mt-2 flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
        <Label htmlFor="phone" className="text-bigg-neon-green font-bold text-base sm:text-lg block text-center">
          Mobile Phone Number
        </Label>
        <div className="w-full">
          <MobileInput
            id="phone"
            value={formData.phone}
            onChange={(cleanValue, formattedValue) => {
              setFormData({ ...formData, phone: formattedValue });
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            className={`w-full ${errors.phone ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
          />
        </div>
        {errors.phone && (
          <p className="text-red-400 text-sm mt-2 flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errors.phone}
          </p>
        )}
        <p className="text-sm text-gray-400 mt-2 font-medium text-center">
          e.g., 082 329 2438
        </p>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
        <Label htmlFor="email" className="text-bigg-chrome font-bold text-base sm:text-lg block text-center">
          Email Address <span className="text-gray-400 font-normal">(Optional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          className={`w-full ${errors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
        />
        {errors.email && (
          <p className="text-red-400 text-sm mt-2 flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Marketing Consent - POPIA Compliant */}
      <div className="bg-gradient-to-r from-bigg-bee-orange/10 to-bigg-neon-green/10 p-4 sm:p-6 rounded-xl border border-bigg-bee-orange/20">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Checkbox
            id="marketingConsent"
            checked={formData.marketingConsent}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, marketingConsent: !!checked });
            }}
            className={`mt-1 ${deviceInfo.touchDevice ? 'min-w-5 min-h-5' : ''}`}
          />
          <div className="flex-1">
            <Label htmlFor="marketingConsent" className="text-sm sm:text-base font-bold text-white cursor-pointer">
              Marketing Communications <span className="text-bigg-bee-orange">(Optional)</span>
            </Label>
            <div className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed space-y-2">
              <p>
                I consent to Bigg Buzz (Pty) Ltd and its authorized partners sending me marketing communications,
                promotional offers, product updates, and newsletters via email, SMS, and other electronic means.
              </p>
              <p>
                I understand that I can withdraw this consent at any time by contacting{' '}
                <a href="mailto:support@biggbuzz.co.za" className="text-bigg-neon-green hover:text-bigg-neon-green-bright transition-colors font-semibold">
                  support@biggbuzz.co.za
                </a>{' '}
                or using the unsubscribe link in communications.
              </p>
              <p className="text-xs text-gray-400">
                This consent is given in accordance with the Protection of Personal Information Act (POPIA) and our{' '}
                <Link href="/privacy" className="text-bigg-neon-green hover:text-bigg-neon-green-bright transition-colors font-semibold">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMobileVerificationStep = () => (
    <motion.div
      className={responsiveClasses.formContainer}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className={`text-center ${responsiveClasses.spacing}`}>
        <div className={`relative mx-auto ${responsiveClasses.iconSize}`}>
          <Phone className={`${responsiveClasses.iconSize} text-bigg-neon-green mx-auto bigg-pulse-green`} />
          <div className="absolute inset-0 bg-bigg-neon-green/20 rounded-full blur-xl animate-pulse" />
        </div>
        <h2 className={`${responsiveClasses.headingSize} font-bold bg-gradient-to-r from-white to-bigg-chrome bg-clip-text text-transparent`}>
          Mobile Verification
        </h2>
        <p className={`text-gray-300 ${responsiveClasses.bodySize} font-medium px-2 sm:px-0`}>
          We&apos;ve sent a verification code to {formData.phone}
        </p>
      </div>

      <div className={responsiveClasses.spacing}>
        {/* Delivery Method Selection */}
        <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
          <Label className="text-bigg-neon-green font-bold text-base sm:text-lg block text-center">Choose delivery method</Label>
          <Select value={deliveryMethod} onValueChange={(value: 'sms' | 'whatsapp') => setDeliveryMethod(value)}>
            <SelectTrigger className="w-full bg-bigg-dark border-bigg-neon-green/20 text-white hover:border-bigg-neon-green/40 h-11 px-4">
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
              <SelectItem value="sms" className="text-white hover:bg-bigg-dark-lighter">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-bigg-neon-green" />
                  <span>SMS</span>
                </div>
              </SelectItem>
              <SelectItem value="whatsapp" className="text-white hover:bg-bigg-dark-lighter">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-bigg-neon-green" />
                  <span>WhatsApp</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-bigg-neon-green font-bold text-base sm:text-lg">Verification Code</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (errors.otp) setErrors({ ...errors, otp: '' });
              }}
              className="gap-1 sm:gap-2"
            >
              <InputOTPGroup className="gap-1 sm:gap-2">
                <InputOTPSlot index={0} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
                <InputOTPSlot index={1} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
                <InputOTPSlot index={2} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
                <InputOTPSlot index={3} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
                <InputOTPSlot index={4} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
                <InputOTPSlot index={5} className={`${responsiveClasses.otpSlotSize} border-2 border-bigg-neon-green/20 bg-bigg-dark text-white text-base sm:text-lg font-bold focus:border-bigg-neon-green focus:shadow-bigg-glow-green`} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {errors.otp && (
            <p className="text-red-400 text-sm mt-2 text-center flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {errors.otp}
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-300 text-center font-medium px-2">
            Enter the 6-digit code sent to your {deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'phone'}
          </p>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
          <Button
            variant="ghost"
            onClick={resendOTP}
            disabled={isLoading || resendCountdown > 0}
            className="w-full text-bigg-neon-green hover:text-bigg-neon-green-bright hover:bg-bigg-dark/50 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : resendCountdown > 0 ? (
              <>
                <Timer className="w-4 h-4 mr-2" />
                Resend in {resendCountdown}s
              </>
            ) : (
              `Resend via ${deliveryMethod.toUpperCase()}`
            )}
          </Button>

          {otpAttempts > 0 && (
            <p className="text-xs sm:text-sm text-bigg-bee-orange font-medium bg-bigg-bee-orange/10 border border-bigg-bee-orange/20 rounded-lg p-3 w-full text-center">
              {otpAttempts}/3 attempts used
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderTermsConditionsStep = () => (
    <div className={responsiveClasses.formContainer}>
      <div className={`text-center ${responsiveClasses.spacing}`}>
        <div className={`relative mx-auto ${responsiveClasses.iconSize}`}>
          <FileText className={`${responsiveClasses.iconSize} text-bigg-bee-orange mx-auto bigg-pulse-green`} />
          <div className="absolute inset-0 bg-bigg-bee-orange/20 rounded-full blur-xl animate-pulse" />
        </div>
        <h2 className={`${responsiveClasses.headingSize} font-bold bg-gradient-to-r from-white to-bigg-chrome bg-clip-text text-transparent`}>
          Terms & Conditions
        </h2>
        <p className={`text-gray-300 ${responsiveClasses.bodySize} font-medium px-2 sm:px-0`}>
          Please review and accept our terms to complete registration
        </p>
      </div>

      <div className={responsiveClasses.spacing}>
        {/* Terms of Service */}
        <div className="bg-bigg-dark/30 border border-bigg-neon-green/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <Checkbox
              id="termsAccepted"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, termsAccepted: !!checked });
                if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: '' });
              }}
              className={`mt-1 ${deviceInfo.touchDevice ? 'min-w-5 min-h-5' : ''}`}
            />
            <div className="flex-1">
              <Label htmlFor="termsAccepted" className="text-sm sm:text-base font-bold text-white cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-bigg-neon-green hover:text-bigg-neon-green-bright transition-colors font-bold underline-offset-4 hover:underline">
                  Terms of Service
                </Link>
              </Label>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                By checking this box, you confirm that you have read and agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-400 text-sm flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {errors.termsAccepted}
          </p>
        )}

        {/* Privacy Policy */}
        <div className="bg-bigg-dark/30 border border-bigg-neon-green/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <Checkbox
              id="privacyAccepted"
              checked={formData.privacyAccepted}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, privacyAccepted: !!checked });
                if (errors.privacyAccepted) setErrors({ ...errors, privacyAccepted: '' });
              }}
              className={`mt-1 ${deviceInfo.touchDevice ? 'min-w-5 min-h-5' : ''}`}
            />
            <div className="flex-1">
              <Label htmlFor="privacyAccepted" className="text-sm sm:text-base font-bold text-white cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link href="/privacy" className="text-bigg-neon-green hover:text-bigg-neon-green-bright transition-colors font-bold underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </Label>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                By checking this box, you acknowledge that you have read and understand our Privacy Policy
              </p>
            </div>
          </div>
        </div>
        {errors.privacyAccepted && (
          <p className="text-red-400 text-sm flex items-center bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {errors.privacyAccepted}
          </p>
        )}

        {/* Legal Notice */}
        <div className="bg-gradient-to-r from-bigg-bee-orange/10 to-bigg-neon-green/10 border border-bigg-bee-orange/30 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-bigg-bee-orange mt-1 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-white">
              <p className="font-bold mb-3 text-sm sm:text-base text-bigg-bee-orange">Legal Notice</p>
              <p className="leading-relaxed font-medium">
                Cannabis products are for adults 18+ only. Use responsibly and in accordance with South African law.
                Bigg Buzz is committed to promoting responsible cannabis use and maintaining compliance with all
                applicable regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-28 mx-auto" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-20 mx-auto" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-20 mx-auto" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className={`${responsiveClasses.formContainer} text-center`}>
      <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        <div className="w-full h-full bg-gradient-to-r from-bigg-neon-green to-bigg-neon-green-bright rounded-full flex items-center justify-center shadow-bigg-glow-green-intense">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white animate-pulse" />
        </div>
        <div className="absolute inset-0 bg-bigg-neon-green/30 rounded-full blur-xl animate-pulse" />
      </div>
      <div className={responsiveClasses.spacing}>
        <h2 className={`${responsiveClasses.headingSize} font-bold bg-gradient-to-r from-bigg-neon-green via-white to-bigg-chrome bg-clip-text text-transparent`}>
          Registration Complete!
        </h2>
        <p className={`text-gray-300 ${responsiveClasses.bodySize} font-medium`}>
          Welcome to Bigg Buzz! Your account has been created and verified.
        </p>
        <div className="flex items-center justify-center space-x-2 text-bigg-neon-green">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm sm:text-base font-bold">
            Redirecting to marketplace...
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-bigg-darker via-bigg-dark to-bigg-darker relative overflow-hidden">
      {/* Animated background effects - responsive */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-bigg-neon-green/10 rounded-full blur-3xl animate-bigg-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-bigg-bee-orange/10 rounded-full blur-3xl animate-bigg-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`${getOptimalFormLayout(deviceInfo)} relative z-10`}>
        <div className={responsiveClasses.container}>
          <Card className="border-bigg-neon-green/20 shadow-2xl shadow-bigg-neon-green/10 backdrop-blur-xl">
            <CardHeader className={`text-center ${responsiveClasses.headerPadding}`}>
              <div className="mx-auto mb-4 relative">
                <h1 className={`${responsiveClasses.titleSize} font-black bg-gradient-to-r from-bigg-neon-green via-white to-bigg-chrome bg-clip-text text-transparent animate-bigg-chrome-shine`}>
                  BIGG BUZZ
                </h1>
                <div className="absolute inset-0 bg-bigg-neon-green/20 blur-xl rounded-full" />
              </div>
              <CardTitle className={`${responsiveClasses.headingSize} font-bold text-white mb-2`}>
                Join the Hive
              </CardTitle>
              <CardDescription className={`text-gray-300 ${responsiveClasses.bodySize}`}>
                South Africa&apos;s premier cannabis marketplace
              </CardDescription>
            </CardHeader>

            <CardContent className={`${responsiveClasses.contentPadding} ${responsiveClasses.spacing}`}>
              {currentStep !== 'complete' && renderStepIndicator()}

              <AnimatePresence mode="wait">
                {currentStep === 'identity' && (
                  <motion.div key="identity">
                    {renderIdentityStep()}
                  </motion.div>
                )}
                {currentStep === 'personal-info' && (
                  <motion.div key="personal-info">
                    {renderPersonalInfoStep()}
                  </motion.div>
                )}
                {currentStep === 'mobile-verification' && (
                  <motion.div key="mobile-verification">
                    {renderMobileVerificationStep()}
                  </motion.div>
                )}
                {currentStep === 'terms-conditions' && (
                  <motion.div key="terms-conditions">
                    {renderTermsConditionsStep()}
                  </motion.div>
                )}
                {currentStep === 'complete' && (
                  <motion.div key="complete">
                    {renderCompleteStep()}
                  </motion.div>
                )}
              </AnimatePresence>

              {currentStep !== 'complete' && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 items-center justify-center max-w-lg mx-auto">
                  {currentStep !== 'identity' && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="w-full sm:w-auto sm:flex-1"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className={`w-full ${currentStep === 'identity' ? '' : 'sm:w-auto sm:flex-1'} shadow-bigg-glow-green-intense`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        <span className="font-bold">
                          {currentStep === 'personal-info' ? 'Creating Account...' : currentStep === 'mobile-verification' ? 'Verifying...' : currentStep === 'terms-conditions' ? 'Completing...' : 'Processing...'}
                        </span>
                      </>
                    ) : currentStep === 'personal-info' ? (
                      'Create Account'
                    ) : currentStep === 'mobile-verification' ? (
                      'Verify Code'
                    ) : currentStep === 'terms-conditions' ? (
                      'Complete Registration'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              )}

              <div className={`text-center text-sm sm:text-base text-gray-300 pt-6 border-t border-white/10 mt-6 sm:mt-8`}>
                Already have an account?{' '}
                <Link href="/sign-in" className="text-bigg-neon-green hover:text-bigg-neon-green-bright font-bold transition-colors duration-300 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}