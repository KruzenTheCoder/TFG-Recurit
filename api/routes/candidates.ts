import express from 'express'
import { supabase } from '../server'

const router = express.Router()

// Get all candidates with filtering
router.get('/', async (req, res) => {
  try {
    const { campaign_id, status, limit = 50, offset = 0 } = req.query
    
    let query = supabase
      .from('candidates')
      .select(`
        *,
        campaigns(title)
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({ error: 'Failed to fetch candidates' })
  }
})

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        campaigns(*),
        application_status_history(
          *,
          users(email)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Candidate not found' })

    res.json(data)
  } catch (error) {
    console.error('Error fetching candidate:', error)
    res.status(500).json({ error: 'Failed to fetch candidate' })
  }
})

// Create new candidate (from public form)
router.post('/', async (req, res) => {
  try {
    const { campaign_id, form_id, data, email, name, phone, resume_url, cover_letter } = req.body

    // Validate required fields
    if (!campaign_id || !form_id || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if campaign exists and is active
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'Campaign is not active' })
    }

    // Create candidate
    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert([{
        campaign_id,
        form_id,
        data,
        email,
        name,
        phone,
        resume_url,
        cover_letter,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    // Create initial status history entry
    await supabase
      .from('application_status_history')
      .insert([{
        candidate_id: candidate.id,
        status: 'pending',
        notes: 'Application submitted'
      }])

    res.status(201).json(candidate)
  } catch (error) {
    console.error('Error creating candidate:', error)
    res.status(500).json({ error: 'Failed to create candidate' })
  }
})

// Update candidate status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes, reviewed_by } = req.body

    // Update candidate status
    const { data: candidate, error: updateError } = await supabase
      .from('candidates')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' })

    // Create status history entry
    const { error: historyError } = await supabase
      .from('application_status_history')
      .insert([{
        candidate_id: id,
        status,
        notes: notes || '',
        reviewed_by
      }])

    if (historyError) throw historyError

    res.json(candidate)
  } catch (error) {
    console.error('Error updating candidate status:', error)
    res.status(500).json({ error: 'Failed to update candidate status' })
  }
})

// Update candidate details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rating, notes } = req.body

    const { data, error } = await supabase
      .from('candidates')
      .update({ rating, notes })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Candidate not found' })

    res.json(data)
  } catch (error) {
    console.error('Error updating candidate:', error)
    res.status(500).json({ error: 'Failed to update candidate' })
  }
})

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting candidate:', error)
    res.status(500).json({ error: 'Failed to delete candidate' })
  }
})

// Get candidates by campaign
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const { status } = req.query

    let query = supabase
      .from('candidates')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching campaign candidates:', error)
    res.status(500).json({ error: 'Failed to fetch campaign candidates' })
  }
})

// Get candidate statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { campaign_id } = req.query

    let query = supabase
      .from('candidates')
      .select('status')

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      reviewing: data.filter(c => c.status === 'reviewing').length,
      accepted: data.filter(c => c.status === 'accepted').length,
      rejected: data.filter(c => c.status === 'rejected').length
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching candidate stats:', error)
    res.status(500).json({ error: 'Failed to fetch candidate stats' })
  }
})

export default router