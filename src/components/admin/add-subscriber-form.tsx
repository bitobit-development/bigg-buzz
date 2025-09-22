'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Calendar, User, Mail, Phone, Shield, CheckCircle, AlertCircle } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'

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
  dateOfBirth: string
  role: string
  isActive: boolean
  termsAccepted: boolean
  marketingConsent: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  saId: '',
  dateOfBirth: '',
  role: 'CUSTOMER',
  isActive: true,
  termsAccepted: true,
  marketingConsent: false
}

export function AddSubscriberForm({ isOpen, onClose, onSuccess }: AddSubscriberFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // Required field validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.saId.trim()) newErrors.saId = 'SA ID is required'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Phone validation (South African format)
    if (formData.phone && !/^\+27[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +27xxxxxxxxx'
    }

    // SA ID validation (13 digits)
    if (formData.saId && !/^[0-9]{13}$/.test(formData.saId)) {
      newErrors.saId = 'SA ID must be 13 digits'
    }

    // Date validation (must be 18 or older)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // age--
      }

      if (age < 18) {
        newErrors.dateOfBirth = 'Subscriber must be 18 or older'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix validation errors')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: new Date(formData.dateOfBirth).toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Subscriber created successfully', `${data.user.firstName} ${data.user.lastName} has been added`)
        handleClose()
        onSuccess()
      } else {
        const errorData = await response.json()
        toast.error('Failed to create subscriber', errorData.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error creating subscriber:', error)
      toast.error('Failed to create subscriber', 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
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
                Add New Subscriber
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white hover:bg-bigg-neon-green/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div>
                    <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className={`pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Subscriber
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}