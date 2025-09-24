'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, User, Mail, Phone, Shield, CheckCircle, AlertCircle, Clock, RefreshCw, Smartphone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { parseSAID, validateSAID } from '@/lib/validation'

interface AddSubscriberFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  saId: string
  role: string
  isActive: boolean
  termsAccepted: boolean
  marketingConsent: boolean
}

interface PendingRegistration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  gender: string
  role: string
  expiresAt: string
  otpSent: boolean
  otpVerified?: boolean
  otpAttempts?: number
  lastOtpSentAt?: string
  otpVerifiedAt?: string
}

type RegistrationStep = 1 | 2 | 3 | 4

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  saId: '',
  role: 'CUSTOMER',
  isActive: true,
  termsAccepted: true,
  marketingConsent: false
}

export function AddSubscriberForm({ isOpen, onClose, onSuccess }: AddSubscriberFormProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null)
  const [loading, setLoading] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const { toast } = useToast()

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // Required field validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.saId.trim()) newErrors.saId = 'SA ID is required'

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Phone validation (South African format)
    if (formData.phone && !/^\+27[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +27xxxxxxxxx'
    }

    // SA ID validation using the utility function
    if (formData.saId) {
      if (!validateSAID(formData.saId)) {
        newErrors.saId = 'Invalid SA ID number'
      } else {
        try {
          const saIdInfo = parseSAID(formData.saId)
          if (!saIdInfo.isValidAge) {
            newErrors.saId = 'Subscriber must be 18 years or older'
          } else {
            setCalculatedAge(saIdInfo.age)
          }
        } catch (error) {
          newErrors.saId = 'Invalid SA ID number'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep1()) {
      toast.error('Please fix validation errors')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/initiate-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setPendingRegistration(data.pendingRegistration)
        setCurrentStep(2)
        startPolling(data.pendingRegistration.id)
        toast.success('Registration initiated', 'OTP has been sent to the phone number')
      } else {
        toast.error('Registration failed', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error initiating registration:', error)
      toast.error('Registration failed', 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async () => {
    if (!pendingRegistration?.id) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pendingRegistrationId: pendingRegistration.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentStep(4)
        stopPolling()
        toast.success('Registration completed', `${data.user.firstName} ${data.user.lastName} has been created successfully`)
        setTimeout(() => {
          handleClose()
          onSuccess()
        }, 2000)
      } else {
        toast.error('Registration completion failed', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error completing registration:', error)
      toast.error('Registration completion failed', 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!pendingRegistration?.id) return

    setLoading(true)

    try {
      // We'll use the same initiate endpoint to resend OTP
      const response = await fetch('/api/admin/users/initiate-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setPendingRegistration(data.pendingRegistration)
        toast.success('OTP resent', 'A new OTP has been sent to the phone number')
      } else {
        toast.error('Failed to resend OTP', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
      toast.error('Failed to resend OTP', 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = useCallback((registrationId: string) => {
    setPollingActive(true)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/users/verify-otp?id=${registrationId}`)
        const data = await response.json()

        if (response.ok && data.pendingRegistration) {
          setPendingRegistration(data.pendingRegistration)

          if (data.pendingRegistration.otpVerified) {
            setCurrentStep(3)
            clearInterval(pollInterval)
            setPollingActive(false)
          }
        } else if (response.status === 404 || response.status === 410) {
          // Registration not found or expired
          clearInterval(pollInterval)
          setPollingActive(false)
          toast.error('Registration expired', 'Please start a new registration')
          handleClose()
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 30 minutes (when registration expires)
    setTimeout(() => {
      clearInterval(pollInterval)
      setPollingActive(false)
    }, 30 * 60 * 1000)

    return pollInterval
  }, [])

  const stopPolling = useCallback(() => {
    setPollingActive(false)
  }, [])

  const formatTimeRemaining = useCallback((expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) return 'Expired'

    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (pendingRegistration?.expiresAt) {
      const interval = setInterval(() => {
        setTimeRemaining(formatTimeRemaining(pendingRegistration.expiresAt))
      }, 1000)

      return () => clearInterval(interval)
    }
    return undefined
  }, [pendingRegistration?.expiresAt, formatTimeRemaining])

  const handleClose = () => {
    setCurrentStep(1)
    setFormData(initialFormData)
    setPendingRegistration(null)
    setErrors({})
    setCalculatedAge(null)
    setTimeRemaining('')
    stopPolling()
    onClose()
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Auto-calculate age when SA ID changes
    if (field === 'saId' && typeof value === 'string' && value.length === 13) {
      try {
        if (validateSAID(value)) {
          const saIdInfo = parseSAID(value)
          setCalculatedAge(saIdInfo.age)
        } else {
          setCalculatedAge(null)
        }
      } catch (error) {
        setCalculatedAge(null)
      }
    } else if (field === 'saId') {
      setCalculatedAge(null)
    }
  }

  const getStepProgress = () => {
    return (currentStep / 4) * 100
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information'
      case 2: return 'OTP Verification'
      case 3: return 'Verification Complete'
      case 4: return 'Registration Success'
      default: return 'Registration'
    }
  }

  if (!isOpen) return null

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-bigg-neon-green flex items-center">
                <User className="w-4 h-4 mr-2" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="subscriber@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="+27123456789"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="saId" className="text-white">SA ID Number *</Label>
                  <Input
                    id="saId"
                    value={formData.saId}
                    onChange={(e) => handleInputChange('saId', e.target.value)}
                    className={`bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.saId ? 'border-red-500' : ''}`}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                  {errors.saId && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.saId}
                    </p>
                  )}
                </div>

                {calculatedAge && (
                  <div>
                    <Label className="text-white">Calculated Age</Label>
                    <div className="bg-bigg-dark/30 border border-bigg-neon-green/20 rounded-md px-3 py-2">
                      <span className="text-bigg-neon-green font-semibold">{calculatedAge} years old</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-bigg-neon-green flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Account Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                      <SelectItem value="CUSTOMER" className="text-white hover:bg-bigg-neon-green/10">Customer</SelectItem>
                      <SelectItem value="VENDOR" className="text-white hover:bg-bigg-neon-green/10">Vendor</SelectItem>
                      <SelectItem value="ADMIN" className="text-white hover:bg-bigg-neon-green/10">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                      className="border-bigg-neon-green/20"
                    />
                    <Label htmlFor="isActive" className="text-white">Active Account</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
                    className="border-bigg-neon-green/20"
                  />
                  <Label htmlFor="termsAccepted" className="text-white">Terms & Conditions Accepted</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingConsent"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => handleInputChange('marketingConsent', checked as boolean)}
                    className="border-bigg-neon-green/20"
                  />
                  <Label htmlFor="marketingConsent" className="text-white">Marketing Communications Consent</Label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-bigg-neon-green/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black font-semibold"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </div>
          </form>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-bigg-neon-green/20 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-bigg-neon-green" />
              </div>
              <h3 className="text-xl font-semibold text-white">OTP Verification</h3>
              <p className="text-gray-300">
                An OTP has been sent to{' '}
                <span className="text-bigg-neon-green font-semibold">{pendingRegistration?.phone}</span>
              </p>
              <p className="text-sm text-gray-400">
                Please ask the client to check their phone and verify the OTP.
              </p>
            </div>

            {pendingRegistration && (
              <div className="bg-bigg-dark/30 border border-bigg-neon-green/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Registration Status:</span>
                  <div className="flex items-center space-x-2">
                    {pollingActive ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-bigg-neon-green border-t-transparent rounded-full"
                        />
                        <span className="text-bigg-neon-green">Waiting for verification</span>
                      </>
                    ) : (
                      <span className="text-yellow-500">Checking...</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white">Time Remaining:</span>
                  <span className="text-bigg-neon-green font-mono">{timeRemaining}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white">Client Name:</span>
                  <span className="text-white">{pendingRegistration.firstName} {pendingRegistration.lastName}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={loading}
                className="border-bigg-neon-green/20 text-bigg-neon-green hover:bg-bigg-neon-green/10"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-bigg-neon-green border-t-transparent rounded-full mr-2"
                    />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend OTP
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">OTP Verified Successfully!</h3>
              <p className="text-gray-300">
                The client has successfully verified their phone number.
              </p>
            </div>

            {pendingRegistration && (
              <div className="bg-bigg-dark/30 border border-green-500/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Client Name:</span>
                  <span className="text-white">{pendingRegistration.firstName} {pendingRegistration.lastName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Phone Number:</span>
                  <span className="text-green-500">{pendingRegistration.phone} ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Age:</span>
                  <span className="text-white">{pendingRegistration.age} years old</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Role:</span>
                  <span className="text-white">{pendingRegistration.role}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black font-semibold"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Registration Complete!</h3>
              <p className="text-gray-300">
                The subscriber account has been successfully created.
              </p>
            </div>

            {pendingRegistration && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                <div className="text-center">
                  <p className="text-green-500 font-semibold">
                    {pendingRegistration.firstName} {pendingRegistration.lastName}
                  </p>
                  <p className="text-sm text-gray-300">has been added to the system</p>
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-sm text-gray-400">
                This window will close automatically in a few seconds...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={currentStep === 2 ? undefined : handleClose} // Prevent closing during OTP step
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Form Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-bigg-dark border-bigg-neon-green/20 text-white">
          <CardHeader className="border-b border-bigg-neon-green/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-bigg-neon-green to-white bg-clip-text text-transparent flex items-center">
                <Plus className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Add New Subscriber - {getStepTitle()}
              </CardTitle>
              {currentStep !== 2 && ( // Don't allow closing during OTP verification
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white hover:bg-bigg-neon-green/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Step {currentStep} of 4</span>
                <span>{Math.round(getStepProgress())}% Complete</span>
              </div>
              <Progress
                value={getStepProgress()}
                className="h-2 bg-bigg-dark/50"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span className={currentStep >= 1 ? 'text-bigg-neon-green' : ''}>Info</span>
                <span className={currentStep >= 2 ? 'text-bigg-neon-green' : ''}>OTP</span>
                <span className={currentStep >= 3 ? 'text-bigg-neon-green' : ''}>Verified</span>
                <span className={currentStep >= 4 ? 'text-bigg-neon-green' : ''}>Complete</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {renderStepContent()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}