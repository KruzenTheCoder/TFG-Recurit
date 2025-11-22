import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleData = {
  campaigns: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Software Engineer - Frontend',
      description: 'We are looking for an experienced Frontend Software Engineer to join our growing team. You will be responsible for building and maintaining our web applications using modern JavaScript frameworks.',
      status: 'active',
      form_id: '660e8400-e29b-41d4-a716-446655440001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Product Manager',
      description: 'Seeking a Product Manager to lead our product development initiatives. You will work closely with engineering, design, and business teams to deliver exceptional products.',
      status: 'active',
      form_id: '660e8400-e29b-41d4-a716-446655440002',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'UX Designer',
      description: 'Join our design team to create beautiful and intuitive user experiences. We need someone who can translate complex problems into simple, elegant solutions.',
      status: 'draft',
      form_id: null,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  forms: [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Software Engineer Application Form',
      description: 'Application form for Software Engineer position',
      fields: [
        {
          id: 'field_1',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'field_2',
          type: 'email',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          required: true
        },
        {
          id: 'field_3',
          type: 'tel',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
          required: true
        },
        {
          id: 'field_4',
          type: 'textarea',
          label: 'Tell us about your experience',
          placeholder: 'Describe your relevant experience and skills...',
          required: true
        },
        {
          id: 'field_5',
          type: 'select',
          label: 'Years of Experience',
          placeholder: 'Select your experience level',
          options: ['0-2 years', '3-5 years', '6-10 years', '10+ years'],
          required: true
        },
        {
          id: 'field_6',
          type: 'file',
          label: 'Upload Resume',
          placeholder: 'PDF, DOC, DOCX formats accepted',
          file_types: ['.pdf', '.doc', '.docx'],
          required: true
        }
      ],
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      title: 'Product Manager Application Form',
      description: 'Application form for Product Manager position',
      fields: [
        {
          id: 'field_7',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'field_8',
          type: 'email',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          required: true
        },
        {
          id: 'field_9',
          type: 'textarea',
          label: 'Product Management Experience',
          placeholder: 'Describe your product management experience...',
          required: true
        },
        {
          id: 'field_10',
          type: 'textarea',
          label: 'Favorite Product & Why',
          placeholder: 'Tell us about a product you love and why...',
          required: true
        }
      ],
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  candidates: [
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      status: 'pending',
      rating: 4,
      notes: 'Strong frontend development background with React and TypeScript experience.',
      campaign_id: '550e8400-e29b-41d4-a716-446655440001',
      form_id: '660e8400-e29b-41d4-a716-446655440001',
      resume_url: 'https://example.com/resumes/john-smith.pdf',
      data: {
        field_1: 'John Smith',
        field_2: 'john.smith@example.com',
        field_3: '+1 (555) 123-4567',
        field_4: 'I have 5 years of experience building web applications with React, TypeScript, and modern CSS. I\'ve worked on large-scale projects and have experience with state management, testing, and deployment.',
        field_5: '3-5 years',
        field_6: 'john_smith_resume.pdf'
      },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 987-6543',
      status: 'accepted',
      rating: 5,
      notes: 'Excellent candidate with strong product sense and leadership experience.',
      campaign_id: '550e8400-e29b-41d4-a716-446655440002',
      form_id: '660e8400-e29b-41d4-a716-446655440002',
      resume_url: 'https://example.com/resumes/sarah-johnson.pdf',
      data: {
        field_7: 'Sarah Johnson',
        field_8: 'sarah.johnson@example.com',
        field_9: 'I have 8 years of product management experience across B2B and B2C products. I\'ve led cross-functional teams and launched multiple successful products.',
        field_10: 'I love Slack because it transformed workplace communication and made remote collaboration seamless. The product design is intuitive and the integrations are powerful.'
      },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440003',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '+1 (555) 456-7890',
      status: 'rejected',
      rating: 2,
      notes: 'Not enough relevant experience for the role.',
      campaign_id: '550e8400-e29b-41d4-a716-446655440001',
      form_id: '660e8400-e29b-41d4-a716-446655440001',
      resume_url: 'https://example.com/resumes/michael-chen.pdf',
      data: {
        field_1: 'Michael Chen',
        field_2: 'michael.chen@example.com',
        field_3: '+1 (555) 456-7890',
        field_4: 'I am a recent computer science graduate looking for my first job in software development.',
        field_5: '0-2 years',
        field_6: 'michael_chen_resume.pdf'
      },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440004',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      phone: '+1 (555) 234-5678',
      status: 'reviewing',
      rating: 4,
      notes: 'Good background, needs further evaluation.',
      campaign_id: '550e8400-e29b-41d4-a716-446655440001',
      form_id: '660e8400-e29b-41d4-a716-446655440001',
      resume_url: 'https://example.com/resumes/emily-davis.pdf',
      data: {
        field_1: 'Emily Davis',
        field_2: 'emily.davis@example.com',
        field_3: '+1 (555) 234-5678',
        field_4: 'I have 6 years of full-stack development experience with a focus on React and Node.js. I\'ve worked at startups and large companies, building scalable web applications.',
        field_5: '6-10 years',
        field_6: 'emily_davis_resume.pdf'
      },
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...')

    // Insert forms first (campaigns reference forms)
    console.log('📝 Inserting forms...')
    const { error: formsError } = await supabase
      .from('forms')
      .upsert(sampleData.forms)

    if (formsError) {
      console.error('Error inserting forms:', formsError)
      return
    }

    // Insert campaigns (after forms)
    console.log('📊 Inserting campaigns...')
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .upsert(sampleData.campaigns)

    if (campaignsError) {
      console.error('Error inserting campaigns:', campaignsError)
      return
    }

    // Insert candidates (after campaigns and forms)
    console.log('👥 Inserting candidates...')
    const { error: candidatesError } = await supabase
      .from('candidates')
      .upsert(sampleData.candidates)

    if (candidatesError) {
      console.error('Error inserting candidates:', candidatesError)
      return
    }

    console.log('✅ Database seeding completed successfully!')
    console.log('📈 Summary:')
    console.log(`   - ${sampleData.campaigns.length} campaigns created`)
    console.log(`   - ${sampleData.forms.length} forms created`)
    console.log(`   - ${sampleData.candidates.length} candidates created`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    process.exit(0)
  }
}

seedData()