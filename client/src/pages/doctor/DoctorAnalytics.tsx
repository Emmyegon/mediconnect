import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalPatients: number;
  appointmentsByStatus: Array<{ _id: string; count: number }>;
  appointmentsThisMonth: number;
  commonConditions: Array<{ _id: string; count: number }>;
  urgencyDistribution: Array<{ _id: string; count: number }>;
  appointmentsPerDay: Array<{ _id: string; count: number }>;
}

const DoctorAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    return analytics?.appointmentsByStatus.find(s => s._id === status)?.count || 0;
  };

  const getTotalAppointments = () => {
    return analytics?.appointmentsByStatus.reduce((sum, item) => sum + item.count, 0) || 0;
  };

  const getUrgencyColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'high':
        return 'bg-yellow-500';
      case 'medium':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">View your practice statistics and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Patients</p>
              <p className="text-3xl font-bold mt-2">{analytics?.totalPatients || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-100">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            <span>Lifetime patients treated</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-2">{analytics?.appointmentsThisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-100">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            <span>Appointments booked</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Appointments</p>
              <p className="text-3xl font-bold mt-2">{getTotalAppointments()}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-100">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            <span>All time</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold mt-2">{getStatusCount('completed')}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-100">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            <span>Successfully completed</span>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Appointments by Status</h2>
          <div className="space-y-4">
            {analytics?.appointmentsByStatus.map((item) => {
              const total = getTotalAppointments();
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              
              return (
                <div key={item._id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item._id === 'completed'
                          ? 'bg-green-500'
                          : item._id === 'in-progress'
                          ? 'bg-blue-500'
                          : item._id === 'confirmed'
                          ? 'bg-purple-500'
                          : item._id === 'cancelled'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Conditions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top 5 Common Conditions</h2>
          {analytics?.commonConditions && analytics.commonConditions.length > 0 ? (
            <div className="space-y-4">
              {analytics.commonConditions.slice(0, 5).map((condition, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{condition._id}</p>
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {condition.count} cases
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No diagnosis data available yet</p>
            </div>
          )}
        </div>

        {/* Urgency Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Case Urgency Distribution</h2>
          {analytics?.urgencyDistribution && analytics.urgencyDistribution.length > 0 ? (
            <div className="space-y-4">
              {analytics.urgencyDistribution.map((item, index) => {
                const total = analytics.urgencyDistribution.reduce((sum, i) => sum + i.count, 0);
                const percentage = (item.count / total) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full ${getUrgencyColor(item._id)} mr-2`} />
                        <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUrgencyColor(item._id)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No urgency data available yet</p>
            </div>
          )}
        </div>

        {/* Appointments Per Day (Last 7 Days) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Appointments (Last 7 Days)</h2>
          {analytics?.appointmentsPerDay && analytics.appointmentsPerDay.length > 0 ? (
            <div className="space-y-3">
              {analytics.appointmentsPerDay.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3"
                          style={{
                            width: `${Math.min(
                              (day.count / Math.max(...analytics.appointmentsPerDay.map(d => d.count))) * 100,
                              100
                            )}%`,
                          }}
                        >
                          <span className="text-white text-xs font-semibold">{day.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointment data for the last 7 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm text-indigo-100">Average Daily Appointments</p>
            <p className="text-2xl font-bold mt-2">
              {analytics?.appointmentsPerDay && analytics.appointmentsPerDay.length > 0
                ? (
                    analytics.appointmentsPerDay.reduce((sum, day) => sum + day.count, 0) /
                    analytics.appointmentsPerDay.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm text-indigo-100">Completion Rate</p>
            <p className="text-2xl font-bold mt-2">
              {getTotalAppointments() > 0
                ? ((getStatusCount('completed') / getTotalAppointments()) * 100).toFixed(1)
                : '0'}
              %
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm text-indigo-100">Active Patients</p>
            <p className="text-2xl font-bold mt-2">{analytics?.totalPatients || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalytics;
