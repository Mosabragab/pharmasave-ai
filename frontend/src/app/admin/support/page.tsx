'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Search,
  Filter,
  Send,
  Building2,
  Mail,
  Phone
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface SupportTicket {
  id: string
  ticket_number: string
  pharmacy_name: string
  pharmacist_name: string
  category: string
  priority: string
  status: string
  subject: string
  description: string
  created_at: string
  due_date: string
  assigned_to?: string
  assigned_admin_name?: string
  messages_count: number
  is_overdue: boolean
  last_activity: string
}

interface SupportMessage {
  id: string
  message_type: string
  sender_name: string
  message: string
  is_internal: boolean
  attachments: any[]
  created_at: string
  read_by_admin: boolean
}

interface SupportStats {
  total_open: number
  assigned_to_me: number
  overdue: number
  resolved_today: number
  average_response_time: number
  satisfaction_score: number
}

const AdminSupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')
  const [filterPriority, setFilterPriority] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [responding, setResponding] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchSupportData()
  }, [filterStatus, filterPriority])

  const fetchSupportData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration - replace with actual Supabase queries
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          ticket_number: 'ST-2025-000001',
          pharmacy_name: 'Cairo Medical Pharmacy',
          pharmacist_name: 'Dr. Ahmed Hassan',
          category: 'technical',
          priority: 'high',
          status: 'open',
          subject: 'Unable to upload verification documents',
          description: 'Getting error when trying to upload pharmacy license document. The upload fails with "File too large" error even though file is only 2MB.',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          messages_count: 3,
          is_overdue: false,
          last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          ticket_number: 'ST-2025-000002',
          pharmacy_name: 'Alexandria Health Center',
          pharmacist_name: 'Dr. Fatima Said',
          category: 'billing',
          priority: 'medium',
          status: 'assigned',
          subject: 'Subscription payment not processed',
          description: 'Monthly subscription payment was deducted from bank account but system still shows account as unpaid.',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
          assigned_admin_name: 'Current Admin',
          messages_count: 2,
          is_overdue: false,
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          ticket_number: 'ST-2025-000003',
          pharmacy_name: 'Giza Pharmacy',
          pharmacist_name: 'Dr. Omar Khaled',
          category: 'account',
          priority: 'urgent',
          status: 'escalated',
          subject: 'Cannot access marketplace features',
          description: 'All marketplace features are disabled. Cannot create listings or browse medications from other pharmacies.',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          messages_count: 8,
          is_overdue: true,
          last_activity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters
      let filteredTickets = mockTickets
      if (filterStatus !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => 
          filterStatus === 'open' 
            ? ['open', 'assigned', 'in_progress'].includes(ticket.status)
            : ticket.status === filterStatus
        )
      }
      if (filterPriority !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === filterPriority)
      }

      setTickets(filteredTickets)

      // Calculate stats
      const statsData: SupportStats = {
        total_open: mockTickets.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length,
        assigned_to_me: mockTickets.filter(t => t.assigned_admin_name === 'Current Admin').length,
        overdue: mockTickets.filter(t => t.is_overdue).length,
        resolved_today: 5, // Mock data
        average_response_time: 2.5, // Hours
        satisfaction_score: 4.2 // Out of 5
      }

      setStats(statsData)

    } catch (error) {
      console.error('Error fetching support data:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      // Mock messages for demonstration
      const mockMessages: SupportMessage[] = [
        {
          id: '1',
          message_type: 'user_message',
          sender_name: 'Dr. Ahmed Hassan',
          message: 'I\'m having trouble uploading my pharmacy license document. Every time I try to upload it, I get an error saying "File too large" even though the file is only 2MB.',
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read_by_admin: true
        },
        {
          id: '2',
          message_type: 'admin_response',
          sender_name: 'Support Admin',
          message: 'Thank you for reaching out. I can see the issue you\'re experiencing. The file size limit should be 10MB, so 2MB should work fine. Can you please try uploading the document in JPG or PNG format instead of PDF?',
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          read_by_admin: true
        },
        {
          id: '3',
          message_type: 'user_message',
          sender_name: 'Dr. Ahmed Hassan',
          message: 'I tried JPG format as you suggested but still getting the same error. The file is 1.8MB JPG image. Could you please check if there\'s a system issue?',
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read_by_admin: false
        }
      ]
      
      setMessages(mockMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load ticket messages')
    }
  }

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    fetchTicketMessages(ticket.id)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setResponding(true)
    try {
      // Mock sending message
      const newMsg: SupportMessage = {
        id: Date.now().toString(),
        message_type: 'admin_response',
        sender_name: 'Admin Name',
        message: newMessage,
        is_internal: isInternal,
        attachments: [],
        created_at: new Date().toISOString(),
        read_by_admin: true
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
      setIsInternal(false)
      
      toast.success('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setResponding(false)
    }
  }

  const handleTicketAction = async (action: string, ticketId: string) => {
    try {
      let actionText = ''
      switch (action) {
        case 'assign_to_me':
          actionText = 'assigned to you'
          break
        case 'resolve':
          actionText = 'resolved'
          break
        case 'close':
          actionText = 'closed'
          break
        case 'escalate':
          actionText = 'escalated'
          break
      }

      toast.success(`Ticket ${actionText} successfully`)
      await fetchSupportData()
    } catch (error) {
      console.error(`Error ${action}:`, error)
      toast.error(`Failed to ${action.replace('_', ' ')} ticket`)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-600 text-white'
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'waiting_user': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.pharmacist_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout title="Support Management" description="Handle pharmacy support requests and communications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Support Management" description="Handle pharmacy support requests and communications">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total_open}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to Me</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.assigned_to_me}</p>
                  </div>
                  <User className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved_today}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.average_response_time}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</p>
                    <p className="text-2xl font-bold text-green-600">{stats.satisfaction_score}/5</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Ticket List */}
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Priorities</option>
                      <option value="emergency">Emergency</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket List */}
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketSelect(ticket)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{ticket.ticket_number}</span>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          {ticket.is_overdue && (
                            <Badge className="bg-red-500 text-white">OVERDUE</Badge>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1 line-clamp-1 text-gray-900 dark:text-white">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{ticket.pharmacy_name}</span>
                        </div>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{ticket.pharmacist_name}</span>
                        <span>{ticket.messages_count} messages</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Ticket Details */}
          <div className="space-y-4">
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedTicket.subject}
                          <Badge className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedTicket.ticket_number} • {selectedTicket.pharmacy_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleTicketAction('assign_to_me', selectedTicket.id)}
                        >
                          Assign to Me
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTicketAction('resolve', selectedTicket.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> {selectedTicket.category}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {selectedTicket.status}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(selectedTicket.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Due:</span> {new Date(selectedTicket.due_date).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.message_type === 'admin_response'
                              ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                              : 'bg-gray-50 dark:bg-gray-800 mr-8'
                          } ${message.is_internal ? 'border-l-4 border-l-yellow-500' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {message.sender_name}
                              {message.is_internal && (
                                <Badge className="ml-2 bg-yellow-500 text-white">Internal</Badge>
                              )}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="space-y-3">
                      <textarea
                        placeholder="Type your response..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="internal"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="internal" className="text-sm text-gray-600 dark:text-gray-400">
                            Internal note (not visible to user)
                          </label>
                        </div>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || responding}
                          className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                        >
                          {responding ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Reply
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Select a ticket to view details and respond</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSupportDashboard
