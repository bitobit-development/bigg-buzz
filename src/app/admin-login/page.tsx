'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, User, Lock, Loader2, AlertCircle, LogIn } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success) {
        toast.success('Welcome to Bigg Buzz Admin Portal')
        router.push('/admin/dashboard')
        router.refresh() // Refresh to update auth state
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bigg-darker via-bigg-dark to-bigg-darker flex items-center justify-center p-4">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bigg-neon-green/10 rounded-full blur-3xl animate-bigg-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bigg-bee-orange/10 rounded-full blur-3xl animate-bigg-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-bigg-neon-green/20 shadow-2xl shadow-bigg-neon-green/10 backdrop-blur-xl bg-bigg-dark/80">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto"
            >
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-full h-full bg-gradient-to-r from-bigg-neon-green to-bigg-bee-orange rounded-full flex items-center justify-center shadow-bigg-glow-green">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-bigg-neon-green/20 rounded-full blur-xl animate-pulse" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-bigg-neon-green via-white to-bigg-chrome bg-clip-text text-transparent">
                BIGG BUZZ
              </h1>
            </motion.div>

            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Admin Portal
              </CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to access the administration panel
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300 font-medium">
                    Username
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white focus:border-bigg-neon-green placeholder:text-gray-500"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-300 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white focus:border-bigg-neon-green placeholder:text-gray-500"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-bigg-neon-green to-bigg-neon-green-bright hover:from-bigg-neon-green-bright hover:to-bigg-neon-green text-black font-bold py-3 shadow-bigg-glow-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Admin Panel
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 rounded-lg bg-bigg-bee-orange/10 border border-bigg-bee-orange/20">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-bigg-bee-orange mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-300">
                  <p className="font-semibold text-bigg-bee-orange mb-1">Security Notice</p>
                  <p>
                    This is a restricted area. Only authorized administrators should access this portal.
                    All activities are logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Development Credentials Notice */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">Development Mode</p>
                  <p>Username: admin | Password: 12345</p>
                </div>
              </div>
            )}

            {/* Back to Main Site */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-bigg-neon-green text-sm"
              >
                ← Back to Bigg Buzz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}