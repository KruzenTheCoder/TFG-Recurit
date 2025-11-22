import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, FileText, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardStats, Campaign, Candidate } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_campaigns: 0,
    active_campaigns: 0,
    total_applications: 0,
    pending_reviews: 0,
    accepted_candidates: 0,
    rejected_candidates: 0
  })
  
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [campRes, candRes] = await Promise.all([
          fetch('/api/campaigns'),
          fetch('/api/candidates')
        ])
        if (campRes.ok && candRes.ok) {
          const camps: Campaign[] = await campRes.json()
          const cands: Candidate[] = await candRes.json()

          setStats({
            total_campaigns: camps.length,
            active_campaigns: camps.filter(c => c.status === 'active').length,
            total_applications: cands.length,
            pending_reviews: cands.filter(c => c.status === 'pending').length,
            accepted_candidates: cands.filter(c => c.status === 'accepted').length,
            rejected_candidates: cands.filter(c => c.status === 'rejected').length
          })

          const recentCamps = [...camps]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
            .map(c => ({
              ...c,
              application_count: cands.filter(cd => cd.campaign_id === c.id).length
            }))
          setRecentCampaigns(recentCamps)

          const recentCands = [...cands]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
          setRecentCandidates(recentCands)
        }
      } catch {
        toast.error('Failed to load dashboard')
      }
    }
    load()
  }, [])

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats.total_campaigns,
      icon: Megaphone,
      color: 'blue',
      link: '/campaigns'
    },
    {
      title: 'Active Campaigns',
      value: stats.active_campaigns,
      icon: TrendingUp,
      color: 'green',
      link: '/campaigns'
    },
    {
      title: 'Total Applications',
      value: stats.total_applications,
      icon: FileText,
      color: 'purple',
      link: '/candidates'
    },
    {
      title: 'Pending Reviews',
      value: stats.pending_reviews,
      icon: Clock,
      color: 'orange',
      link: '/candidates'
    },
    {
      title: 'Accepted',
      value: stats.accepted_candidates,
      icon: CheckCircle,
      color: 'green',
      link: '/candidates'
    },
    {
      title: 'Rejected',
      value: stats.rejected_candidates,
      icon: XCircle,
      color: 'red',
      link: '/candidates'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              to={card.link}
              className="ios-card p-6 hover:shadow-ios-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ios-secondary">{card.title}</p>
                  <p className="text-2xl font-bold text-ios-text mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-ios-sm bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="ios-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Campaigns</h3>
              <Link to="/campaigns" className="text-ios-blue hover:underline text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-ios-sm">
                  <div className="flex-1">
                    <h4 className="font-medium text-ios-text">{campaign.title}</h4>
                    <p className="text-sm text-ios-secondary mt-1">{campaign.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-ios-sm text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <p className="text-sm text-ios-secondary mt-1">
                      {campaign.application_count} applications
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Candidates */}
        <div className="ios-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Applications</h3>
              <Link to="/candidates" className="text-ios-blue hover:underline text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-ios-sm">
                  <div className="flex-1">
                    <h4 className="font-medium text-ios-text">{candidate.name}</h4>
                    <p className="text-sm text-ios-secondary">{candidate.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-ios-sm text-xs font-medium ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                    <p className="text-sm text-ios-secondary mt-1">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
