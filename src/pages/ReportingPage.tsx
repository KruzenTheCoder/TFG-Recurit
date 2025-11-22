import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, FileText, Eye, Download } from 'lucide-react';
import { Campaign, Candidate } from '@/types';
import { toast } from 'sonner';

//

const ReportingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedCampaign]);

  const fetchData = async () => {
    try {
      const [campaignsRes, candidatesRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/candidates')
      ]);

      if (campaignsRes.ok && candidatesRes.ok) {
        const campaignsData = await campaignsRes.json();
        const candidatesData = await candidatesRes.json();
        
        setCampaigns(campaignsData);
        setCandidates(candidatesData);
      }
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let filteredCandidates = candidates.filter(candidate => {
      const candidateDate = new Date(candidate.created_at);
      return candidateDate >= cutoffDate;
    });

    if (selectedCampaign) {
      filteredCandidates = filteredCandidates.filter(candidate => 
        candidate.campaign_id === selectedCampaign
      );
    }

    return filteredCandidates;
  };

  const filteredCandidates = getFilteredData();

  // Analytics calculations
  const totalApplications = filteredCandidates.length;
  const acceptedApplications = filteredCandidates.filter(c => c.status === 'accepted').length;
  const rejectedApplications = filteredCandidates.filter(c => c.status === 'rejected').length;
  const pendingApplications = filteredCandidates.filter(c => c.status === 'pending').length;
  const acceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(1) : 0;
  const rejectionRate = totalApplications > 0 ? (rejectedApplications / totalApplications * 100).toFixed(1) : 0;

  // Campaign performance data
  const campaignPerformance = campaigns.map(campaign => {
    const campaignCandidates = filteredCandidates.filter(c => c.campaign_id === campaign.id);
    return {
      name: campaign.title,
      applications: campaignCandidates.length,
      accepted: campaignCandidates.filter(c => c.status === 'accepted').length,
      rejected: campaignCandidates.filter(c => c.status === 'rejected').length,
      pending: campaignCandidates.filter(c => c.status === 'pending').length,
    };
  }).filter(c => c.applications > 0);

  // Status distribution data
  const statusData = [
    { name: 'Accepted', value: acceptedApplications, color: '#10B981' },
    { name: 'Rejected', value: rejectedApplications, color: '#EF4444' },
    { name: 'Pending', value: pendingApplications, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  // Daily applications trend (last 30 days)
  const getDailyTrendData = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayCandidates = filteredCandidates.filter(candidate => 
        candidate.created_at.startsWith(dateStr)
      );
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications: dayCandidates.length,
        accepted: dayCandidates.filter(c => c.status === 'accepted').length,
        rejected: dayCandidates.filter(c => c.status === 'rejected').length,
      });
    }
    
    return data;
  };

  const dailyTrendData = getDailyTrendData();

  // Top performing campaigns
  const topCampaigns = campaignPerformance
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  // Average rating distribution
  const ratingDistribution = [
    { rating: '5★', count: filteredCandidates.filter(c => c.rating === 5).length },
    { rating: '4★', count: filteredCandidates.filter(c => c.rating === 4).length },
    { rating: '3★', count: filteredCandidates.filter(c => c.rating === 3).length },
    { rating: '2★', count: filteredCandidates.filter(c => c.rating === 2).length },
    { rating: '1★', count: filteredCandidates.filter(c => c.rating === 1).length },
  ];

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} days`,
      summary: {
        totalApplications,
        acceptedApplications,
        rejectedApplications,
        pendingApplications,
        acceptanceRate: `${acceptanceRate}%`,
        rejectionRate: `${rejectionRate}%`,
      },
      campaignPerformance,
      dailyTrend: dailyTrendData,
      ratingDistribution,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tfg-recruit-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
            <p className="text-gray-600">Track recruitment performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
              ))}
            </select>
            <button
              onClick={exportReport}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
              <p className="text-sm text-green-600 mt-1">+12% from last period</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
              <p className="text-2xl font-bold text-green-600">{acceptanceRate}%</p>
              <p className="text-sm text-green-600 mt-1">+5% from last period</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{pendingApplications}</p>
              <p className="text-sm text-orange-600 mt-1">Needs attention</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-purple-600">{campaigns.length}</p>
              <p className="text-sm text-purple-600 mt-1">{campaigns.filter(c => c.status === 'active').length} active</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="applications" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="accepted" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="applications" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="accepted" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Ratings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis type="category" dataKey="rating" stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCampaigns.map((campaign, index) => {
                const conversionRate = campaign.applications > 0 
                  ? (campaign.accepted / campaign.applications * 100).toFixed(1) 
                  : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.applications}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {campaign.accepted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {campaign.rejected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        Number(conversionRate) >= 50 
                          ? 'bg-green-100 text-green-800' 
                          : Number(conversionRate) >= 25 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {conversionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportingPage;
