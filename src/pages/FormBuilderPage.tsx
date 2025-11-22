import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Save, Eye, Trash2, GripVertical, Settings } from 'lucide-react'
import { Form, FormField } from '@/types'

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'textarea', label: 'Text Area', icon: '📄' },
  { type: 'select', label: 'Dropdown', icon: '📋' },
  { type: 'radio', label: 'Radio Buttons', icon: '⭕' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'date', label: 'Date', icon: '📅' }
]

export default function FormBuilderPage() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchForm = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/forms/${id}`)
      if (res.ok) {
        const data: Form = await res.json()
        setForm(data)
        setFields(data.fields || [])
      } else {
        toast.error('Failed to fetch form')
        navigate('/forms')
      }
    } catch {
      toast.error('Failed to fetch form')
      navigate('/forms')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (formId && formId !== 'new') {
      fetchForm(formId)
    } else {
      setForm({
        id: 'new',
        title: 'New Application Form',
        description: '',
        fields: [],
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setFields([])
      setLoading(false)
    }
  }, [formId, fetchForm])

  const addField = (type: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: type as FormField['type'],
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    }
    setFields([...fields, newField])
    setSelectedField(newField)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId))
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const saveForm = async () => {
    if (!form) return

    try {
      setSaving(true)
      
      if (form.title.trim() === '') {
        toast.error('Please enter a form title')
        return
      }

      const updatedForm = {
        ...form,
        fields,
        updated_at: new Date().toISOString()
      }

      if (form.id === 'new') {
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedForm.title,
            description: updatedForm.description,
            fields: updatedForm.fields,
            is_published: updatedForm.is_published
          })
        })
        if (res.ok) {
          toast.success('Form created successfully')
          navigate('/forms')
        } else {
          toast.error('Failed to create form')
        }
      } else {
        const res = await fetch(`/api/forms/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedForm.title,
            description: updatedForm.description,
            fields: updatedForm.fields,
            is_published: updatedForm.is_published
          })
        })
        if (res.ok) {
          toast.success('Form saved successfully')
        } else {
          toast.error('Failed to save form')
        }
      }
    } catch {
      toast.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const previewForm = () => {
    if (!form) return
    
    const previewData = {
      title: form.title,
      description: form.description,
      fields
    }
    
    localStorage.setItem('formPreview', JSON.stringify(previewData))
    window.open('/preview', '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue"></div>
      </div>
    )
  }

  if (!form) {
    return <div>Form not found</div>
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left Panel - Form Fields */}
      <div className="w-80 bg-ios-card rounded-ios shadow-ios p-6 mr-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ios-text mb-4">Form Fields</h2>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => (
              <button
                key={fieldType.type}
                onClick={() => addField(fieldType.type)}
                className="w-full flex items-center space-x-3 p-3 rounded-ios-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">{fieldType.icon}</span>
                <span className="text-sm font-medium">{fieldType.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ios-text mb-3">Form Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ios-text mb-2">
                Form Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="ios-input"
                placeholder="Enter form title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ios-text mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="ios-input h-20 resize-none"
                placeholder="Enter form description"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Form Preview */}
      <div className="flex-1 bg-ios-card rounded-ios shadow-ios p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ios-text">{form.title}</h1>
            {form.description && (
              <p className="text-ios-secondary mt-1">{form.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={previewForm}
              className="ios-button-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={saveForm}
              disabled={saving}
              className="ios-button-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Form'}</span>
            </button>
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-ios flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-ios-text mb-2">No fields added yet</h3>
            <p className="text-ios-secondary">Click on a field type from the left panel to add it to your form</p>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field) => (
              <div
                key={field.id}
                className={`p-4 rounded-ios-sm border-2 transition-all ${
                  selectedField?.id === field.id
                    ? 'border-ios-blue bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-ios-text">{field.label}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedField(field)}
                          className="p-1 rounded-ios-sm hover:bg-gray-100"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="p-1 rounded-ios-sm hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {renderFieldPreview(field)}
                    
                    {field.required && (
                      <p className="text-xs text-red-500 mt-1">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Field Settings */}
      {selectedField && (
        <div className="w-80 bg-ios-card rounded-ios shadow-ios p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ios-text">Field Settings</h3>
            <button
              onClick={() => setSelectedField(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ios-text mb-2">
                Field Label
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="ios-input"
                placeholder="Enter field label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ios-text mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                className="ios-input"
                placeholder="Enter placeholder text"
              />
            </div>

            {['select', 'radio', 'checkbox'].includes(selectedField.type) && (
              <div>
                <label className="block text-sm font-medium text-ios-text mb-2">
                  Options (one per line)
                </label>
                <textarea
                  value={selectedField.options?.join('\n') || ''}
                  onChange={(e) => updateField(selectedField.id, { 
                    options: e.target.value.split('\n').filter(opt => opt.trim()) 
                  })}
                  className="ios-input h-24 resize-none"
                  placeholder="Option 1\nOption 2\nOption 3"
                />
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="required"
                checked={selectedField.required}
                onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                className="rounded border-gray-300 text-ios-blue focus:ring-ios-blue"
              />
              <label htmlFor="required" className="text-sm font-medium text-ios-text">
                Required field
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function renderFieldPreview(field: FormField) {
  const commonProps = {
    placeholder: field.placeholder,
    required: field.required,
    className: "ios-input bg-white"
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'date':
      return <input type={field.type} {...commonProps} />
    
    case 'textarea':
      return <textarea {...commonProps} rows={4} className="ios-input bg-white h-24 resize-none" />
    
    case 'select':
      return (
        <select {...commonProps} className="ios-select bg-white">
          <option value="">Select an option</option>
          {field.options?.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      )
    
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <label key={index} className="flex items-center space-x-2">
              <input type="radio" name={field.id} value={option} className="rounded-full border-gray-300 text-ios-blue focus:ring-ios-blue" />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <label key={index} className="flex items-center space-x-2">
              <input type="checkbox" value={option} className="rounded border-gray-300 text-ios-blue focus:ring-ios-blue" />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )
    
    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-ios-sm p-6 text-center">
          <input type="file" className="hidden" id={`file-${field.id}`} />
          <label htmlFor={`file-${field.id}`} className="cursor-pointer">
            <div className="text-gray-500">
              <p className="text-sm">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX (MAX. 10MB)</p>
            </div>
          </label>
        </div>
      )
    
    default:
      return <input type="text" {...commonProps} />
  }
}
