'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  FileText,
  TrendingUp,
  Eye
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface VerificationQueueItem {
  id: string;
  pharmacy_name: string;
  pharmacy_display_id: string;
  documents_count: number;
  submission_date: string;
  priority: number;
  status: 'pending' | 'in_review' | 'escalated' | 'completed' | 'rejected';
  assigned_admin?: string;
  due_date: string;
  days_pending: number;
}

interface AdminStats {
  total_pending: number;
  in_review: number;
  overdue: number;
  completed_today: number;
  my_workload: number;
  average_processing_time: number;
}

const AdminVerificationDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queueItems, setQueueItems] = useState<VerificationQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch verification queue with pharmacy details
      const { data: queueData, error: queueError } = await supabase
        .from('verification_queue')
        .select(`
          id,
          pharmacy_id,
          priority,
          status,
          assigned_at,
          due_date,
          created_at,
          pharmacies (
            name,
            display_id,
            created_at
          ),
          admin_users (
            name
          )
        `)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (queueError) throw queueError;

      // Transform data for UI
      const transformedQueue: VerificationQueueItem[] = queueData?.map(item => ({
        id: item.id,
        pharmacy_name: item.pharmacies?.name || 'Unknown Pharmacy',
        pharmacy_display_id: item.pharmacies?.display_id || 'N/A',
        documents_count: 0, // Will be fetched separately if needed
        submission_date: item.created_at,
        priority: item.priority,
        status: item.status,
        assigned_admin: item.admin_users?.name,
        due_date: item.due_date,
        days_pending: Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })) || [];

      setQueueItems(transformedQueue);

      // Calculate stats
      const stats: AdminStats = {
        total_pending: transformedQueue.filter(item => item.status === 'pending').length,
        in_review: transformedQueue.filter(item => item.status === 'in_review').length,
        overdue: transformedQueue.filter(item => new Date(item.due_date) < new Date()).length,
        completed_today: 0, // Would need separate query
        my_workload: transformedQueue.filter(item => item.assigned_admin === 'Current Admin').length, // Replace with actual admin name
        average_processing_time: 24 // Would calculate from historical data
      };

      setStats(stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'destructive';
      case 2: return 'orange';
      case 3: return 'yellow';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_review': return 'primary';
      case 'escalated': return 'destructive';
      case 'completed': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesSearch = item.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.pharmacy_display_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = selectedPriority === 'all' || item.priority.toString() === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleReviewPharmacy = (pharmacyId: string) => {
    // Navigate to detailed review page
    window.location.href = `/admin/verification/review/${pharmacyId}`;
  };

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
            Verification Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage pharmacy verification requests and maintain quality standards
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Templates
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.total_pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Review</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.in_review}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed_today}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">My Workload</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.my_workload}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time (hrs)</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.average_processing_time}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by pharmacy name or ID..."
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
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="escalated">Escalated</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pharmacy-green"
              >
                <option value="all">All Priorities</option>
                <option value="1">High (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">Low (3)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verification Queue ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Pharmacy</th>
                  <th className="text-left p-3 font-semibold">Priority</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Days Pending</th>
                  <th className="text-left p-3 font-semibold">Assigned To</th>
                  <th className="text-left p-3 font-semibold">Due Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div>
                        <div className="font-semibold">{item.pharmacy_name}</div>
                        <div className="text-sm text-gray-600">{item.pharmacy_display_id}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={getPriorityColor(item.priority)}>
                        Priority {item.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className={item.days_pending > 2 ? 'text-red-600 font-semibold' : ''}>
                        {item.days_pending} days
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {item.assigned_admin || 'Unassigned'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={new Date(item.due_date) < new Date() ? 'text-red-600 font-semibold' : ''}>
                        {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReviewPharmacy(item.id)}
                          className="bg-pharmacy-green hover:bg-pharmacy-green/90"
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No verification requests found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVerificationDashboard;