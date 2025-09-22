'use client'

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-bigg-darker via-bigg-dark to-bigg-darker flex items-center justify-center p-4">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-bigg-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bigg-bee-orange/10 rounded-full blur-3xl animate-bigg-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="border-red-500/20 shadow-2xl shadow-red-500/10 backdrop-blur-xl bg-bigg-dark/80">
          <CardHeader className="text-center space-y-4">
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto"
            >
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="w-full h-full bg-gradient-to-r from-red-500 to-bigg-bee-orange rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              </div>
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-bold text-white">Access Denied</CardTitle>
              <p className="text-gray-400 mt-2">
                You don&apos;t have permission to access the admin panel
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Details */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-red-400 mb-2">Insufficient Privileges</p>
                  <p className="mb-2">
                    The admin panel is restricted to authorized administrators only. If you believe
                    you should have access to this area, please contact your system administrator.
                  </p>
                  <p className="text-xs text-gray-400">
                    This access attempt has been logged for security purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-bigg-bee-orange/10 border border-bigg-bee-orange/20 rounded-lg p-4">
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-bigg-bee-orange mb-2">Need Admin Access?</p>
                <p className="mb-2">
                  Contact the system administrator or technical support team:
                </p>
                <div className="space-y-1 text-xs">
                  <p>📧 Email: admin@biggbuzz.co.za</p>
                  <p>📞 Phone: +27 (0) 11 123 4567</p>
                  <p>🕒 Hours: Monday - Friday, 9:00 AM - 5:00 PM SAST</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 border-bigg-neon-green/20 hover:border-bigg-neon-green/40 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push('/')}
                className="flex-1 bg-gradient-to-r from-bigg-neon-green to-bigg-neon-green-bright hover:from-bigg-neon-green-bright hover:to-bigg-neon-green text-black font-bold"
              >
                <Home className="w-4 h-4 mr-2" />
                Home Page
              </Button>
            </div>

            {/* Admin Sign In Link */}
            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">
                Already have admin credentials?
              </p>
              <Button
                variant="ghost"
                onClick={() => router.push('/admin-login')}
                className="text-bigg-neon-green hover:text-bigg-neon-green-bright"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}