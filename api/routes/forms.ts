import express from 'express'
import { supabase } from '../server'

const router = express.Router()

// Get all forms
router.get('/', async (req, res) => {
  try {
    const { is_published } = req.query
    
    let query = supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (is_published !== undefined) {
      query = query.eq('is_published', is_published === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching forms:', error)
    res.status(500).json({ error: 'Failed to fetch forms' })
  }
})

// Get form by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Form not found' })

    res.json(data)
  } catch (error) {
    console.error('Error fetching form:', error)
    res.status(500).json({ error: 'Failed to fetch form' })
  }
})

// Create new form
router.post('/', async (req, res) => {
  try {
    const { title, description, fields, is_published } = req.body

    const { data, error } = await supabase
      .from('forms')
      .insert([{
        title,
        description,
        fields: fields || [],
        is_published: is_published || false
      }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating form:', error)
    res.status(500).json({ error: 'Failed to create form' })
  }
})

// Update form
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, fields, is_published } = req.body

    const { data, error } = await supabase
      .from('forms')
      .update({
        title,
        description,
        fields,
        is_published
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Form not found' })

    res.json(data)
  } catch (error) {
    console.error('Error updating form:', error)
    res.status(500).json({ error: 'Failed to update form' })
  }
})

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting form:', error)
    res.status(500).json({ error: 'Failed to delete form' })
  }
})

// Publish/unpublish form
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params
    const { is_published } = req.body

    const { data, error } = await supabase
      .from('forms')
      .update({ is_published })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Form not found' })

    res.json(data)
  } catch (error) {
    console.error('Error updating form publish status:', error)
    res.status(500).json({ error: 'Failed to update form publish status' })
  }
})

// Duplicate form
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params

    // Get original form
    const { data: originalForm, error: fetchError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!originalForm) return res.status(404).json({ error: 'Form not found' })

    // Create duplicate
    const { data: duplicatedForm, error: duplicateError } = await supabase
      .from('forms')
      .insert([{
        title: `${originalForm.title} (Copy)`,
        description: originalForm.description,
        fields: originalForm.fields,
        is_published: false
      }])
      .select()
      .single()

    if (duplicateError) throw duplicateError

    res.status(201).json(duplicatedForm)
  } catch (error) {
    console.error('Error duplicating form:', error)
    res.status(500).json({ error: 'Failed to duplicate form' })
  }
})

// Get form fields (for public form)
router.get('/:id/fields', async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('forms')
      .select('id, title, description, fields, is_published')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Form not found or not published' })

    res.json(data)
  } catch (error) {
    console.error('Error fetching form fields:', error)
    res.status(500).json({ error: 'Failed to fetch form fields' })
  }
})

export default router