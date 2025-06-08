'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Calendar,
  Send,
  Paperclip,
  Eye,
  Filter,
  Search,
  Bell,
  BarChart
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface SupportTicket {
  id: string;
  ticket_number: string;
  pharmacy_name: string;
  pharmacist_name: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  created_at: string;
  due_date: string;
  assigned_to?: string;
  assigned_admin_name?: string;
  messages_count: number;
  is_overdue: boolean;
  satisfaction_rating?: number;
}

interface SupportMessage {
  id: string;
  message_type: string;
  sender_name: string;
  message: string;
  is_internal: boolean;
  attachments: any[];
  created_at: string;
  read_by_admin: boolean;
}

interface SupportStats {
  total_open: number;
  assigned_to_me: number;
  overdue: number;
  resolved_today: number;
  average_response_time: number;
  satisfaction_score: number;
}

const AdminSupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [responding, setResponding] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSupportData();
  }, [filterStatus, filterPriority]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      
      // Build query filters
      let query = supabase
        .from('support_tickets')
        .select(`
          id,
          ticket_number,
          category,
          priority,
          status,
          subject,
          description,
          created_at,
          due_date,
          assigned_to,
          satisfaction_rating,
          pharmacies (name),
          pharmacists (fname, lname),
          admin_users (name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }

      const { data: ticketsData, error: ticketsError } = await query;
      if (ticketsError) throw ticketsError;

      // Transform data
      const transformedTickets: SupportTicket[] = ticketsData?.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        pharmacy_name: ticket.pharmacies?.name || 'Unknown Pharmacy',
        pharmacist_name: `${ticket.pharmacists?.fname || ''} ${ticket.pharmacists?.lname || ''}`.trim(),
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        subject: ticket.subject,
        description: ticket.description,
        created_at: ticket.created_at,
        due_date: ticket.due_date,
        assigned_admin_name: ticket.admin_users?.name,
        messages_count: 0, // Would need separate query
        is_overdue: new Date(ticket.due_date) < new Date(),
        satisfaction_rating: ticket.satisfaction_rating
      })) || [];

      setTickets(transformedTickets);

      // Calculate stats
      const statsData: SupportStats = {
        total_open: transformedTickets.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length,
        assigned_to_me: transformedTickets.filter(t => t.assigned_admin_name === 'Current Admin').length, // Replace with actual
        overdue: transformedTickets.filter(t => t.is_overdue).length,
        resolved_today: 0, // Would calculate from resolved tickets today
        average_response_time: 2.5, // Hours - would calculate from historical data
        satisfaction_score: 4.2 // Would calculate from ratings
      };

      setStats(statsData);

    } catch (error) {
      console.error('Error fetching support data:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load ticket messages');
    }
  };

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchTicketMessages(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setResponding(true);
    try {
      // Insert new message
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message_type: 'admin_response',
          sender_type: 'admin',
          sender_name: 'Admin Name', // Get from current admin
          message: newMessage,
          is_internal: isInternal
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update ticket status if first response
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({
            status: 'in_progress',
            first_response_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id);
      }

      // Refresh messages
      await fetchTicketMessages(selectedTicket.id);
      setNewMessage('');
      setIsInternal(false);
      
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setResponding(false);
    }
  };

  const handleTicketAction = async (action: string, ticketId: string) => {
    try {
      let updateData: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'assign_to_me':
          updateData.assigned_to = 'current_admin_id'; // Replace with actual admin ID
          updateData.assigned_at = new Date().toISOString();
          updateData.status = 'assigned';
          break;
        case 'resolve':
          updateData.status = 'resolved';
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = 'current_admin_id';
          break;
        case 'close':
          updateData.status = 'closed';
          updateData.closed_at = new Date().toISOString();
          break;
        case 'escalate':
          updateData.status = 'escalated';
          updateData.priority = 'urgent';
          break;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      await fetchSupportData();
      toast.success(`Ticket ${action.replace('_', ' ')} successfully`);
    } catch (error) {
      console.error(`Error ${action}:`, error);
      toast.error(`Failed to ${action.replace('_', ' ')} ticket`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'destructive';
      case 'urgent': return 'destructive';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'assigned': return 'primary';
      case 'in_progress': return 'primary';
      case 'waiting_user': return 'yellow';
      case 'escalated': return 'destructive';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'secondary';
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Support Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage pharmacy support requests and customer communications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BarChart className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

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
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
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
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
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
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ticket.ticket_number}</span>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        {ticket.is_overdue && (
                          <Badge variant="destructive">OVERDUE</Badge>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">{ticket.subject}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{ticket.pharmacy_name} • {ticket.pharmacist_name}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
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
                        <Badge variant={getPriorityColor(selectedTicket.priority)}>
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
                          message.sender_type === 'admin'
                            ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                            : 'bg-gray-50 dark:bg-gray-800 mr-8'
                        } ${message.is_internal ? 'border-l-4 border-l-yellow-500' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">
                            {message.sender_name}
                            {message.is_internal && (
                              <Badge variant="yellow" className="ml-2">Internal</Badge>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your response..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                        />
                        <label htmlFor="internal" className="text-sm">Internal note (not visible to user)</label>
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
                <p className="text-gray-500">Select a ticket to view details and respond</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDashboard;