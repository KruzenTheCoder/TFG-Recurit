import express from 'express'
import { supabase } from '../server'

const router = express.Router()

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        forms(title),
        candidates(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
})

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        forms(*),
        candidates(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Campaign not found' })

    res.json(data)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    res.status(500).json({ error: 'Failed to fetch campaign' })
  }
})

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const { title, description, status, form_id } = req.body

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        title,
        description,
        status: status || 'draft',
        form_id
      }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating campaign:', error)
    res.status(500).json({ error: 'Failed to create campaign' })
  }
})

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, form_id } = req.body

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        title,
        description,
        status,
        form_id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Campaign not found' })

    res.json(data)
  } catch (error) {
    console.error('Error updating campaign:', error)
    res.status(500).json({ error: 'Failed to update campaign' })
  }
})

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting campaign:', error)
    res.status(500).json({ error: 'Failed to delete campaign' })
  }
})

// Get campaign statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params

    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('status')
      .eq('campaign_id', id)

    if (error) throw error

    const stats = {
      total: candidates.length,
      pending: candidates.filter(c => c.status === 'pending').length,
      reviewing: candidates.filter(c => c.status === 'reviewing').length,
      accepted: candidates.filter(c => c.status === 'accepted').length,
      rejected: candidates.filter(c => c.status === 'rejected').length
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    res.status(500).json({ error: 'Failed to fetch campaign stats' })
  }
})

// Get campaign by form id
router.get('/by-form/:formId', async (req, res) => {
  try {
    const { formId } = req.params
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'No campaign found for form' })

    res.json(data[0])
  } catch (error) {
    console.error('Error fetching campaign by form:', error)
    res.status(500).json({ error: 'Failed to fetch campaign by form' })
  }
})

export default router
