import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, CheckCircle, XCircle, Clock, User, Mail, Phone, Star, Filter, Search } from 'lucide-react'
import { Candidate, Campaign } from '@/types'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
]

export default function CandidatesPage() {
  const [searchParams] = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')

  useEffect(() => {
    fetchCandidates()
    fetchCampaigns()
  }, [])

  useEffect(() => {
    const campaignParam = searchParams.get('campaign')
    if (campaignParam) {
      setCampaignFilter(campaignParam)
    }
  }, [searchParams])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/candidates')
      if (res.ok) {
        const data = await res.json()
        setCandidates(data)
      } else {
        toast.error('Failed to fetch candidates')
      }
    } catch {
      toast.error('Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      } else {
        toast.error('Failed to fetch campaigns')
      }
    } catch {
      toast.error('Failed to fetch campaigns')
    }
  }

  const updateCandidateStatus = async (candidateId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })
      if (res.ok) {
        const updated = await res.json()
        setCandidates(candidates.map(candidate =>
          candidate.id === candidateId ? updated : candidate
        ))
        toast.success('Candidate status updated')
      } else {
        toast.error('Failed to update candidate status')
      }
    } catch {
      toast.error('Failed to update candidate status')
    }
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    const matchesCampaign = campaignFilter === 'all' || candidate.campaign_id === campaignFilter
    
    return matchesSearch && matchesStatus && matchesCampaign
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'reviewing': return <Eye className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ios-text">Candidates</h1>
          <p className="text-ios-secondary">Manage job applications and candidates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ios-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ios-input pl-10"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ios-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="ios-select"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-ios-secondary">
              {filteredCandidates.length} candidates
            </span>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-secondary">Loading candidates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="ios-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-ios-blue rounded-ios flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ios-text">{candidate.name}</h3>
                    <p className="text-sm text-ios-secondary">
                      {campaigns.find(c => c.id === candidate.campaign_id)?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-ios-sm text-xs font-medium flex items-center space-x-1 ${getStatusColor(candidate.status)}`}>
                    {getStatusIcon(candidate.status)}
                    <span>{candidate.status}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-3 text-sm text-ios-secondary">
                  <Mail className="w-4 h-4" />
                  <span>{candidate.email}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center space-x-3 text-sm text-ios-secondary">
                    <Phone className="w-4 h-4" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.rating && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-ios-secondary">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(candidate.rating)}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-sm text-ios-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(candidate.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {candidate.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-ios-sm">
                  <p className="text-sm text-ios-secondary">
                    <strong>Notes:</strong> {candidate.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Link
                  to={`/candidates/${candidate.id}`}
                  className="ios-button-secondary flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </Link>

                <div className="flex items-center space-x-2">
                  {candidate.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateCandidateStatus(candidate.id, 'reviewing')}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-ios-sm hover:bg-blue-200 text-sm font-medium"
                      >
                        Start Review
                      </button>
                      <button
                        onClick={() => updateCandidateStatus(candidate.id, 'rejected', 'Not a good fit')}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-ios-sm hover:bg-red-200 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {candidate.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => updateCandidateStatus(candidate.id, 'accepted', 'Recommended for hire')}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-ios-sm hover:bg-green-200 text-sm font-medium flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateCandidateStatus(candidate.id, 'rejected', 'Not selected')}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-ios-sm hover:bg-red-200 text-sm font-medium flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCandidates.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ios-text mb-2">No candidates found</h3>
          <p className="text-ios-secondary">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  )
}
