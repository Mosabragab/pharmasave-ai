'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import Header from '@/components/layout/Header'
import { 
  UserPlus, 
  Building2, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Crown
} from 'lucide-react'

type UserRole = 'primary_admin' | 'co_admin' | 'staff_pharmacist'
type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

interface InvitationData {
  id: string
  email: string
  role: UserRole
  status: InvitationStatus
  expires_at: string
  pharmacy: {
    name: string
  }
  invited_by: {
    fname: string
    lname: string
  }
}

export default function EmployeeRegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (token) {
      validateInvitation()
    }
  }, [token])

  const validateInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch invitation details
      const { data, error: invitationError } = await supabase
        .from('pharmacy_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          pharmacy:pharmacies!pharmacy_invitations_pharmacy_id_fkey(name),
          invited_by:pharmacists!pharmacy_invitations_invited_by_fkey(fname, lname)
        `)
        .eq('token', token)
        .single()

      if (invitationError || !data) {
        setError('Invalid or expired invitation link')
        return
      }

      // Check if invitation is still valid
      const now = new Date()
      const expiresAt = new Date(data.expires_at)
      
      if (now > expiresAt) {
        setError('This invitation has expired')
        return
      }

      if (data.status !== 'pending') {
        setError('This invitation is no longer available')
        return
      }

      // Check if user already exists with this email
      const { data: existingUser } = await supabase
        .from('pharmacists')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        setError('An account with this email already exists')
        return
      }

      setInvitation(data)

    } catch (error) {
      console.error('Error validating invitation:', error)
      setError('Unable to validate invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    setSubmitting(true)
    setFormErrors({})

    try {
      // Validate form
      const errors: Record<string, string> = {}
      if (!formData.firstName.trim()) errors.firstName = 'First name is required'
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setSubmitting(false)
        return
      }

      console.log('🔄 Starting employee registration...')

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: invitation.role
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      console.log('✅ Auth user created:', authData.user.id)

      // Get pharmacy information
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacy_invitations')
        .select('pharmacy_id')
        .eq('id', invitation.id)
        .single()

      if (pharmacyError || !pharmacyData) {
        throw new Error('Unable to get pharmacy information')
      }

      // Create pharmacist record
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .insert({
          auth_id: authData.user.id,
          pharmacy_id: pharmacyData.pharmacy_id,
          fname: formData.firstName.trim(),
          lname: formData.lastName.trim(),
          email: invitation.email,
          role: invitation.role,
          is_primary: false, // Invited employees are never primary
          can_manage_employees: invitation.role === 'co_admin',
          can_access_financials: invitation.role !== 'staff_pharmacist'
        })
        .select('id')
        .single()

      if (pharmacistError) {
        throw new Error(pharmacistError.message)
      }

      console.log('✅ Pharmacist created:', pharmacistData.id)

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('pharmacy_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (updateError) {
        console.warn('Failed to update invitation status:', updateError)
      }

      // Success!
      console.log('🎉 Employee registration completed!')
      alert('🎉 Account created successfully! Welcome to the team!')
      router.push('/dashboard')

    } catch (error: any) {
      console.error('Error during registration:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'primary_admin': return <Crown className="w-5 h-5 text-yellow-500" />
      case 'co_admin': return <Shield className="w-5 h-5 text-blue-500" />
      case 'staff_pharmacist': return <User className="w-5 h-5 text-gray-500" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'primary_admin': return 'Primary Admin'
      case 'co_admin': return 'Co-Admin'
      case 'staff_pharmacist': return 'Staff Pharmacist'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto text-pharmacy-green mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Validating Invitation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Invalid Invitation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <Link href="/">
              <Button variant="secondary">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Header */}
      <Header 
        variant="auth"
        showBackButton={true}
        backButtonText="Back to Home"
        backButtonHref="/"
      />

      <div className="max-w-md w-full mt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-pharmacy-green rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join the Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your registration to get started
          </p>
        </div>

        {/* Invitation Details */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  You've been invited!
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Join {invitation.pharmacy.name} as a team member
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pharmacy:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitation.pharmacy.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(invitation.role)}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getRoleLabel(invitation.role)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invited by:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitation.invited_by.fname} {invitation.invited_by.lname}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitation.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mb-6">
              Just a few details to get you started
            </CardDescription>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.firstName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your first name"
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.lastName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your last name"
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12 ${
                      formErrors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12 ${
                      formErrors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-pharmacy-green hover:bg-pharmacy-green/90 text-white py-3 flex items-center justify-center rounded font-medium"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Join the Team
                  </>
                )}
              </Button>
            </form>

            {/* Benefits */}
            <div className="mt-8 p-4 bg-pharmacy-green/10 dark:bg-pharmacy-green/20 rounded-lg">
              <h4 className="text-sm font-medium text-pharmacy-green dark:text-pharmacy-green mb-2">
                ✨ What happens next:
              </h4>
              <ul className="text-sm text-pharmacy-green/80 dark:text-pharmacy-green/90 space-y-1">
                <li>• Account created with {getRoleLabel(invitation.role)} access</li>
                <li>• Join {invitation.pharmacy.name} team</li>
                <li>• Access marketplace and team features</li>
                <li>• Complete profile at your own pace</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}