'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Shield,
  Database,
  Bell,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Save,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'Bigg Buzz Admin',
    maintenanceMode: false,
    debugMode: false,
    maintenanceMessage: 'System is currently under maintenance. Please check back later.',

    // Security Settings
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    slackIntegration: false,
    slackWebhookUrl: '',
    notificationFrequency: 'immediate',

    // Data Settings
    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: 10, // MB

    // Performance Settings
    cacheEnabled: true,
    compressionEnabled: true,
    rateLimitEnabled: true,
    rateLimitPerHour: 1000
  })

  const [loading, setLoading] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null)
  const { toast } = useToast()
  const confirmations = useConfirmationDialog()

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true)
        // Simulate API call with validation
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Validate critical settings
        if (settings.sessionTimeout < 5) {
          throw new Error('Session timeout must be at least 5 minutes')
        }
        if (settings.maxLoginAttempts < 3) {
          throw new Error('Maximum login attempts must be at least 3')
        }

        resolve({ settingsCount: Object.keys(settings).length })
      } catch (error) {
        reject(error)
      } finally {
        setLoading(false)
      }
    })

    toast.promise(promise, {
      loading: 'Saving settings...',
      success: (data: any) => `Successfully saved ${data.settingsCount} settings`,
      error: (error: any) => error.message || 'Failed to save settings'
    })
  }

  const exportSystemData = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        // Simulate export process
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Simulate creating export file
        const exportData = {
          timestamp: new Date().toISOString(),
          settings: settings,
          filename: `bigg-buzz-system-export-${new Date().toISOString().split('T')[0]}.json`
        }

        resolve(exportData)
      } catch (error) {
        reject(error)
      }
    })

    toast.promise(promise, {
      loading: 'Generating system export...',
      success: (data: any) => `Export complete! File: ${data.filename}`,
      error: 'Failed to export system data'
    })
  }

  const resetToDefaults = () => {
    setConfirmationDialog({
      title: 'Reset to Default Settings',
      description: 'This will reset all settings to their default values. This action cannot be undone.',
      confirmText: 'Reset Settings',
      variant: 'warning' as const,
      onConfirm: () => {
        // Reset to defaults logic here
        toast.success('Settings reset to defaults')
      },
      isOpen: true,
      onClose: () => setConfirmationDialog(null)
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-bigg-neon-green to-white bg-clip-text text-transparent">
            Admin Settings
          </h1>
          <p className="text-gray-400 mt-1">
            Configure system settings and administrative preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black font-semibold"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </motion.div>

      {/* System Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-bigg-neon-green" />
              System Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Basic system settings and operational mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="systemName" className="text-white">System Name</Label>
                <Input
                  id="systemName"
                  value={settings.systemName}
                  onChange={(e) => handleSettingChange('systemName', e.target.value)}
                  className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Maintenance Mode</Label>
                    <p className="text-xs text-gray-400">Temporarily disable user access</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Debug Mode</Label>
                    <p className="text-xs text-gray-400">Enable detailed logging</p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                  />
                </div>
              </div>
            </div>

            {settings.maintenanceMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="maintenanceMessage" className="text-white">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={settings.maintenanceMessage}
                  onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                  className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  placeholder="Enter the message users will see during maintenance..."
                  rows={3}
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-bigg-bee-orange" />
              Security Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Authentication and security policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts" className="text-white">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                    className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength" className="text-white">Password Min Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                    className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Require Two-Factor Auth</Label>
                    <p className="text-xs text-gray-400">Mandatory 2FA for all admins</p>
                  </div>
                  <Switch
                    checked={settings.requireTwoFactor}
                    onCheckedChange={(checked) => handleSettingChange('requireTwoFactor', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Require Special Characters</Label>
                    <p className="text-xs text-gray-400">Passwords must contain special chars</p>
                  </div>
                  <Switch
                    checked={settings.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => handleSettingChange('passwordRequireSpecialChars', checked)}
                  />
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure how you receive system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Email Notifications</Label>
                <p className="text-xs text-gray-400">Receive alerts via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">SMS Notifications</Label>
                <p className="text-xs text-gray-400">Receive critical alerts via SMS</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Slack Integration</Label>
                <p className="text-xs text-gray-400">Send notifications to Slack channel</p>
              </div>
              <Switch
                checked={settings.slackIntegration}
                onCheckedChange={(checked) => handleSettingChange('slackIntegration', checked)}
              />
            </div>

            {settings.slackIntegration && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="slackWebhookUrl" className="text-white">Slack Webhook URL</Label>
                <Input
                  id="slackWebhookUrl"
                  type="url"
                  value={settings.slackWebhookUrl}
                  onChange={(e) => handleSettingChange('slackWebhookUrl', e.target.value)}
                  className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notificationFrequency" className="text-white">Notification Frequency</Label>
              <Select
                value={settings.notificationFrequency}
                onValueChange={(value) => handleSettingChange('notificationFrequency', value)}
              >
                <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Digest</SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div variants={itemVariants}>
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Database className="w-5 h-5 mr-2 text-bigg-bee-orange" />
              Data Management
            </CardTitle>
            <CardDescription className="text-gray-400">
              Data retention, backup, and export settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention" className="text-white">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    min="30"
                    max="2555"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                    className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize" className="text-white">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto Backup</Label>
                    <p className="text-xs text-gray-400">Automatic system backups</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>

                {settings.autoBackup && (
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency" className="text-white">Backup Frequency</Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) => handleSettingChange('backupFrequency', value)}
                    >
                      <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Button
                  onClick={exportSystemData}
                  variant="outline"
                  className="w-full border-bigg-neon-green/20 hover:border-bigg-neon-green/40 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export System Data
                </Button>

                <div className="p-4 rounded-lg bg-bigg-neon-green/10 border border-bigg-neon-green/20">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-bigg-neon-green" />
                    <span className="text-white">Last backup: 2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-bigg-neon-green" />
              Performance Settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              System optimization and rate limiting configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Caching</Label>
                    <p className="text-xs text-gray-400">Cache responses for better performance</p>
                  </div>
                  <Switch
                    checked={settings.cacheEnabled}
                    onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Compression</Label>
                    <p className="text-xs text-gray-400">Compress API responses</p>
                  </div>
                  <Switch
                    checked={settings.compressionEnabled}
                    onCheckedChange={(checked) => handleSettingChange('compressionEnabled', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Rate Limiting</Label>
                    <p className="text-xs text-gray-400">Protect against API abuse</p>
                  </div>
                  <Switch
                    checked={settings.rateLimitEnabled}
                    onCheckedChange={(checked) => handleSettingChange('rateLimitEnabled', checked)}
                  />
                </div>

                {settings.rateLimitEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="rateLimitPerHour" className="text-white">Requests Per Hour</Label>
                    <Input
                      id="rateLimitPerHour"
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.rateLimitPerHour}
                      onChange={(e) => handleSettingChange('rateLimitPerHour', parseInt(e.target.value))}
                      className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-bigg-bee-orange" />
              System Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current system health and operational status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-bigg-dark/30">
                <span className="text-white text-sm">Database</span>
                <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-bigg-dark/30">
                <span className="text-white text-sm">API Services</span>
                <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-bigg-dark/30">
                <span className="text-white text-sm">Background Jobs</span>
                <Badge className="bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30">
                  Running
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <ConfirmationDialog
          {...confirmationDialog}
          loading={loading}
        />
      )}
    </motion.div>
  )
}