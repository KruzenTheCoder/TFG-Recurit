import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Share2, Copy, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Form, Campaign } from '@/types';
import { toast } from 'sonner';

const FormsPage: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
    fetchCampaigns();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch {
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch {
      toast.error('Failed to fetch campaigns');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setForms(forms.filter(form => form.id !== formId));
        toast.success('Form deleted successfully');
      } else {
        toast.error('Failed to delete form');
      }
    } catch {
      toast.error('Error deleting form');
    } finally {
      setShowDeleteModal(false);
      setFormToDelete(null);
    }
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/forms/${formId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus })
      });

      if (response.ok) {
        setForms(forms.map(form => 
          form.id === formId ? { ...form, is_published: !currentStatus } : form
        ));
        toast.success(`Form ${currentStatus ? 'unpublished' : 'published'} successfully`);
      } else {
        toast.error('Failed to update form status');
      }
    } catch {
      toast.error('Failed to update form status');
    }
  };

  const copyShareLink = (formId: string) => {
    const shareLink = `${window.location.origin}/apply/${formId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard');
  };

  const duplicateForm = async (form: Form) => {
    try {
      const response = await fetch(`/api/forms/${form.id}/duplicate`, {
        method: 'POST'
      });

      if (response.ok) {
        const newForm = await response.json();
        setForms([...forms, newForm]);
        toast.success('Form duplicated successfully');
      } else {
        toast.error('Failed to duplicate form');
      }
    } catch {
      toast.error('Failed to duplicate form');
    }
  };

  const getCampaignNameForForm = (formId: string) => {
    const campaign = campaigns.find(c => c.form_id === formId);
    return campaign?.title || 'No Campaign';
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = (form.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (form.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const campaignForForm = campaigns.find(c => c.form_id === form.id)?.id || '';
    const matchesCampaign = !selectedCampaign || campaignForForm === selectedCampaign;
    return matchesSearch && matchesCampaign;
  });

  const stats = {
    total: forms.length,
    published: forms.filter(f => f.is_published).length,
    drafts: forms.filter(f => !f.is_published).length,
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
            <h1 className="text-2xl font-bold text-gray-900">Application Forms</h1>
            <p className="text-gray-600">Create and manage job application forms</p>
          </div>
          <button
            onClick={() => navigate('/forms/builder')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-orange-600">{stats.drafts}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
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
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Forms</h2>
        </div>
        
        {filteredForms.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No forms found</p>
            <button
              onClick={() => navigate('/forms/builder')}
              className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
            >
              Create your first form
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredForms.map(form => (
              <div key={form.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        form.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {form.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{form.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Campaign: {getCampaignNameForForm(form.id)}</span>
                      <span>•</span>
                      <span>{form.fields?.length || 0} fields</span>
                      <span>•</span>
                      <span>Updated {new Date(form.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {form.is_published && (
                      <button
                        onClick={() => copyShareLink(form.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy share link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(`/forms/builder/${form.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit form"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => duplicateForm(form)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate form"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleFormStatus(form.id, form.is_published)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        form.is_published
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {form.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setFormToDelete(form.id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Form</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this form? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFormToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => formToDelete && handleDeleteForm(formToDelete)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
