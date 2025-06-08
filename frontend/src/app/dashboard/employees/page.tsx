'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Plus, 
  Mail, 
  Crown, 
  Shield, 
  User,
  Settings,
  Trash2,
  UserCheck,
  UserX,
  Send
} from 'lucide-react'

type UserRole = 'primary_admin' | 'co_admin' | 'staff_pharmacist'
type EmployeeStatus = 'active' | 'inactive' | 'terminated'
type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

interface Pharmacist {
  id: string
  fname: string
  lname: string
  email: string
  role: UserRole
  status: EmployeeStatus
  is_primary: boolean
  created_at: string
  last_login?: string
}

interface Invitation {
  id: string
  email: string
  role: UserRole
  status: InvitationStatus
  created_at: string
  expires_at: string
  invited_by: {
    fname: string
    lname: string
  }
}

interface CurrentUser {
  id: string
  pharmacy_id: string
  role: UserRole
  fname: string
  lname: string
}

export default function EmployeesPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [employees, setEmployees] = useState<Pharmacist[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff_pharmacist' as UserRole
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user')
        return
      }

      // Get current pharmacist details
      const { data: pharmacist, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('id, pharmacy_id, role, fname, lname')
        .eq('auth_id', user.id)
        .single()

      if (pharmacistError) {
        console.error('Error fetching pharmacist:', pharmacistError)
        return
      }

      setCurrentUser(pharmacist)

      // Check if user has permission to manage employees
      if (!['primary_admin', 'co_admin'].includes(pharmacist.role)) {
        console.error('User does not have permission to manage employees')
        return
      }

      // Fetch all employees for the pharmacy
      const { data: employeesData, error: employeesError } = await supabase
        .from('pharmacists')
        .select('id, fname, lname, email, role, status, is_primary, created_at, last_login')
        .eq('pharmacy_id', pharmacist.pharmacy_id)
        .order('created_at', { ascending: false })

      if (employeesError) {
        console.error('Error fetching employees:', employeesError)
      } else {
        setEmployees(employeesData || [])
      }

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('pharmacy_invitations')
        .select(`
          id, 
          email, 
          role, 
          status, 
          created_at, 
          expires_at,
          invited_by:pharmacists!pharmacy_invitations_invited_by_fkey(fname, lname)
        `)
        .eq('pharmacy_id', pharmacist.pharmacy_id)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false })

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError)
      } else {
        setInvitations(invitationsData || [])
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!currentUser || !inviteForm.email.trim()) return

    try {
      setActionLoading('invite')

      // Generate secure token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

      // Insert invitation
      const { error } = await supabase
        .from('pharmacy_invitations')
        .insert({
          pharmacy_id: currentUser.pharmacy_id,
          invited_by: currentUser.id,
          email: inviteForm.email.trim().toLowerCase(),
          role: inviteForm.role,
          token,
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        throw error
      }

      // TODO: Send email with invitation link
      // For now, we'll show a success message
      alert(`Invitation sent to ${inviteForm.email}!\n\nInvitation Link:\n${window.location.origin}/register/employee/${token}`)

      // Reset form and refresh data
      setInviteForm({ email: '', role: 'staff_pharmacist' })
      setShowInviteForm(false)
      fetchData()

    } catch (error: any) {
      console.error('Error sending invitation:', error)
      alert(`Error sending invitation: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const updateEmployeeRole = async (employeeId: string, newRole: UserRole) => {
    if (!currentUser) return

    try {
      setActionLoading(employeeId)

      const { error } = await supabase
        .from('pharmacists')
        .update({ role: newRole })
        .eq('id', employeeId)
        .eq('pharmacy_id', currentUser.pharmacy_id)

      if (error) {
        throw error
      }

      fetchData()
    } catch (error: any) {
      console.error('Error updating employee role:', error)
      alert(`Error updating role: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const deactivateEmployee = async (employeeId: string) => {
    if (!currentUser) return
    
    if (!confirm('Are you sure you want to deactivate this employee?')) return

    try {
      setActionLoading(employeeId)

      const { error } = await supabase
        .from('pharmacists')
        .update({ status: 'inactive' })
        .eq('id', employeeId)
        .eq('pharmacy_id', currentUser.pharmacy_id)

      if (error) {
        throw error
      }

      fetchData()
    } catch (error: any) {
      console.error('Error deactivating employee:', error)
      alert(`Error deactivating employee: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)

      const { error } = await supabase
        .from('pharmacy_invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        throw error
      }

      fetchData()
    } catch (error: any) {
      console.error('Error deleting invitation:', error)
      alert(`Error deleting invitation: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'primary_admin': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'co_admin': return <Shield className="w-4 h-4 text-blue-500" />
      case 'staff_pharmacist': return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'primary_admin': return 'Primary Admin'
      case 'co_admin': return 'Co-Admin'
      case 'staff_pharmacist': return 'Staff Pharmacist'
    }
  }

  const canInviteRole = (role: UserRole) => {
    if (currentUser?.role === 'primary_admin') return true
    if (currentUser?.role === 'co_admin' && role === 'staff_pharmacist') return true
    return false
  }

  const canManageEmployee = (employee: Pharmacist) => {
    if (currentUser?.role === 'primary_admin' && !employee.is_primary) return true
    if (currentUser?.role === 'co_admin' && employee.role === 'staff_pharmacist') return true
    return false
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentUser || !['primary_admin', 'co_admin'].includes(currentUser.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <UserX className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to manage employees. Only Primary Admins and Co-Admins can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pharmacy team and invite new pharmacists
          </p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-pharmacy-green hover:bg-pharmacy-green/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Employee
        </Button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <Card>
          <CardContent className="p-6">
            <CardTitle className="text-lg mb-4">Invite New Employee</CardTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                  placeholder="pharmacist@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                >
                  {canInviteRole('co_admin') && (
                    <option value="co_admin">Co-Admin</option>
                  )}
                  <option value="staff_pharmacist">Staff Pharmacist</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={sendInvitation}
                  disabled={!inviteForm.email.trim() || actionLoading === 'invite'}
                  className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                >
                  {actionLoading === 'invite' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Employees */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-pharmacy-green" />
            <CardTitle>Current Employees ({employees.length})</CardTitle>
          </div>
          
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No employees yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-pharmacy-green/10 rounded-full flex items-center justify-center">
                      {getRoleIcon(employee.role)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {employee.fname} {employee.lname}
                        </span>
                        {employee.is_primary && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{employee.email}</span>
                        <span>•</span>
                        <span>{getRoleLabel(employee.role)}</span>
                        <span>•</span>
                        <span className={`capitalize ${
                          employee.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {employee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {canManageEmployee(employee) && (
                    <div className="flex items-center space-x-2">
                      {currentUser?.role === 'primary_admin' && employee.role === 'staff_pharmacist' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateEmployeeRole(employee.id, 'co_admin')}
                          disabled={actionLoading === employee.id}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Promote
                        </Button>
                      )}
                      {currentUser?.role === 'primary_admin' && employee.role === 'co_admin' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateEmployeeRole(employee.id, 'staff_pharmacist')}
                          disabled={actionLoading === employee.id}
                        >
                          <User className="w-4 h-4 mr-1" />
                          Demote
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deactivateEmployee(employee.id)}
                        disabled={actionLoading === employee.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 mr-2 text-blue-500" />
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            </div>
            
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{getRoleLabel(invitation.role)}</span>
                      <span>•</span>
                      <span>Invited by {invitation.invited_by.fname} {invitation.invited_by.lname}</span>
                      <span>•</span>
                      <span>
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => deleteInvitation(invitation.id)}
                    disabled={actionLoading === invitation.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}