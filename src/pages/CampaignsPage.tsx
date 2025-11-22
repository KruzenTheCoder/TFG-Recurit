import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Play, Pause, FileText, Users } from 'lucide-react'
import { Campaign, Form } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as Campaign['status'],
    form_id: ''
  })
  const [campaignStats, setCampaignStats] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchCampaigns()
    fetchForms()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
        const statsEntries = await Promise.all(
          data.map(async (c: Campaign) => {
            const sRes = await fetch(`/api/campaigns/${c.id}/stats`)
            if (sRes.ok) {
              const s = await sRes.json()
              return [c.id, s.total] as [string, number]
            }
            return [c.id, 0] as [string, number]
          })
        )
        const statsObj = Object.fromEntries(statsEntries)
        setCampaignStats(statsObj)
      } else {
        toast.error('Failed to fetch campaigns')
      }
    } catch {
      toast.error('Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        setForms(data)
      } else {
        toast.error('Failed to fetch forms')
      }
    } catch {
      toast.error('Failed to fetch forms')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.form_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingCampaign) {
        const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          const updated = await res.json()
          setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? updated : c))
          toast.success('Campaign updated successfully')
        } else {
          toast.error('Failed to update campaign')
        }
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          const created = await res.json()
          setCampaigns([created, ...campaigns])
          toast.success('Campaign created successfully')
        } else {
          toast.error('Failed to create campaign')
        }
      }

      setShowModal(false)
      setEditingCampaign(null)
      setFormData({ title: '', description: '', status: 'draft', form_id: '' })
    } catch {
      toast.error('Failed to save campaign')
    }
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      form_id: campaign.form_id
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id))
        toast.success('Campaign deleted successfully')
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const campaign = campaigns.find(c => c.id === id)
      if (!campaign) return
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, status: newStatus })
      })
      if (res.ok) {
        const updated = await res.json()
        setCampaigns(campaigns.map(c => c.id === id ? updated : c))
        toast.success('Campaign status updated')
      } else {
        toast.error('Failed to update campaign status')
      }
    } catch {
      toast.error('Failed to update campaign status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'closed': return <Trash2 className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ios-text">Campaigns</h1>
          <p className="text-ios-secondary">Manage your recruitment campaigns</p>
        </div>
        <button
          onClick={() => {
            setEditingCampaign(null)
            setFormData({ title: '', description: '', status: 'draft', form_id: '' })
            setShowModal(true)
          }}
          className="ios-button-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-secondary">Loading campaigns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="ios-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-ios-text mb-2">{campaign.title}</h3>
                  <p className="text-sm text-ios-secondary mb-3">{campaign.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStatusChange(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                    className={`p-2 rounded-ios-sm ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    } hover:opacity-80`}
                  >
                    {getStatusIcon(campaign.status)}
                  </button>
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="p-2 rounded-ios-sm bg-blue-100 text-blue-600 hover:bg-blue-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 rounded-ios-sm bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-ios-sm text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <span className="text-sm text-ios-secondary">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-4 text-sm text-ios-secondary">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>Form</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{campaignStats[campaign.id] ?? 0} applications</span>
                    </div>
                  </div>
                  <Link
                    to={`/candidates?campaign=${campaign.id}`}
                    className="text-ios-blue hover:underline text-sm font-medium"
                  >
                    View Applications
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-20" onClick={() => setShowModal(false)} />
          <div className="relative bg-ios-card rounded-ios shadow-ios-lg w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-ios-text">
                {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ios-text mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="ios-input"
                  placeholder="Enter campaign title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-text mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="ios-input h-24 resize-none"
                  placeholder="Enter campaign description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-text mb-2">
                  Application Form *
                </label>
                <select
                  value={formData.form_id}
                  onChange={(e) => setFormData({ ...formData, form_id: e.target.value })}
                  className="ios-select"
                  required
                >
                  <option value="">Select a form</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.title} {form.is_published ? '' : '(Draft)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-text mb-2">
                  Status
                </label>
                  <select
                    value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Campaign['status'] })}
                    className="ios-select"
                  >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 ios-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 ios-button-primary"
                >
                  {editingCampaign ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
