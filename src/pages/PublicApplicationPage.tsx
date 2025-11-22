import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Upload, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { Form, FormField, Campaign } from '@/types';
import { toast } from 'sonner';

const PublicApplicationPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [submitted, setSubmitted] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const fetchForm = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.is_published) {
          setForm(data);
          const campaignRes = await fetch(`/api/campaigns/by-form/${formId}`)
          if (campaignRes.ok) {
            const camp = await campaignRes.json()
            setCampaign(camp)
          }
        } else {
          toast.error('This form is no longer accepting applications');
        }
      } else {
        toast.error('Form not found');
      }
    } catch {
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, fetchForm]);

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileChange = (fieldId: string, file: File) => {
    setFiles(prev => ({
      ...prev,
      [fieldId]: file
    }));
  };

  const validateForm = () => {
    if (!form) return false;

    const requiredFields = form.fields?.filter(field => field.required) || [];
    
    for (const field of requiredFields) {
      if (!formData[field.id] || formData[field.id].toString().trim() === '') {
        toast.error(`Please fill in the required field: ${field.label}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Handle file uploads first
      const uploadedFileUrls: Record<string, string> = {};
      
      for (const [fieldId, file] of Object.entries(files)) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          uploadedFileUrls[fieldId] = url;
        }
      }

      // Submit application
      const nameField = form?.fields.find((f: FormField) => f.type === 'text')
      const emailField = form?.fields.find((f: FormField) => f.type === 'email')
      const name = nameField ? (formData[nameField.id] || '') : ''
      const email = emailField ? (formData[emailField.id] || '') : ''

      if (!name || !email) {
        toast.error('Please provide your name and email')
        setSubmitting(false)
        return
      }

      const submissionData = {
        form_id: formId,
        campaign_id: campaign?.id,
        data: {
          ...formData,
          ...uploadedFileUrls
        },
        email,
        name,
        status: 'pending'
      };

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success('Application submitted successfully!');
      } else {
        toast.error('Failed to submit application');
      }
    } catch {
      toast.error('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseInputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseInputClass}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={4}
            className={baseInputClass}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseInputClass}
            required={field.required}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4 text-blue-500"
                  required={field.required}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(formData[field.id]) ? (formData[field.id] as string[]).includes(option) : false}
                  onChange={(e) => {
                  const currentValues = Array.isArray(formData[field.id]) ? (formData[field.id] as string[]) : [];
                  if (e.target.checked) {
                    handleInputChange(field.id, [...currentValues, option]);
                  } else {
                      handleInputChange(field.id, currentValues.filter((v) => v !== option));
                  }
                  }}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {files[field.id] ? files[field.id].name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {field.file_types ? `Accepted: ${field.file_types.join(', ')}` : 'Any file type'}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={field.file_types?.join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(field.id, file);
                }}
                required={field.required}
              />
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600">This application form is no longer available.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your application. We'll review your submission and get back to you soon.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
            <p className="text-blue-100">{form.description}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {form.fields?.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.help_text && (
                  <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Powered by TFG Recruit • Your information is secure and will only be used for recruitment purposes</p>
        </div>
      </div>
    </div>
  );
};

export default PublicApplicationPage;
