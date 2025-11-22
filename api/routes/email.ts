import express from 'express'
import nodemailer from 'nodemailer'
import { supabase } from '../server'

const router = express.Router()

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Send email notification to candidate
router.post('/notify-candidate', async (req, res) => {
  try {
    const { candidate_id, status, custom_message } = req.body

    // Get candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        *,
        campaigns(title)
      `)
      .eq('id', candidate_id)
      .single()

    if (candidateError || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' })
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', getTemplateType(status))
      .single()

    if (templateError || !template) {
      return res.status(404).json({ error: 'Email template not found' })
    }

    // Replace template variables
    const subject = template.subject
      .replace('{{campaign_title}}', candidate.campaigns.title)
      .replace('{{candidate_name}}', candidate.name)

    let content = template.content
      .replace('{{campaign_title}}', candidate.campaigns.title)
      .replace('{{candidate_name}}', candidate.name)

    if (custom_message) {
      content += `\n\n${custom_message}`
    }

    // Send email
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@tfgrecruit.com',
      to: candidate.email,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br>'),
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Get email templates
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    res.status(500).json({ error: 'Failed to fetch email templates' })
  }
})

// Update email template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, subject, content } = req.body

    const { data, error } = await supabase
      .from('email_templates')
      .update({ name, subject, content })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Template not found' })

    res.json(data)
  } catch (error) {
    console.error('Error updating email template:', error)
    res.status(500).json({ error: 'Failed to update email template' })
  }
})

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@tfgrecruit.com',
      to: to || process.env.TEST_EMAIL,
      subject: 'TFG Recruit - Email Configuration Test',
      text: 'This is a test email from TFG Recruit. Your email configuration is working correctly!',
      html: '<p>This is a test email from <strong>TFG Recruit</strong>. Your email configuration is working correctly!</p>',
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ error: 'Failed to send test email' })
  }
})

function getTemplateType(status: string): string {
  switch (status) {
    case 'pending':
      return 'application_received'
    case 'reviewing':
      return 'under_review'
    case 'accepted':
      return 'accepted'
    case 'rejected':
      return 'rejected'
    default:
      return 'application_received'
  }
}

export default router