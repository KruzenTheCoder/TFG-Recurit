import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import campaignsRouter from './routes/campaigns'
import candidatesRouter from './routes/candidates'
import formsRouter from './routes/forms'
import emailRouter from './routes/email'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3333

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// Initialize Supabase client with fallback
let supabase: SupabaseClient | null = null

try {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Not found')
  console.log('Supabase Service Key:', supabaseServiceKey ? 'Found' : 'Not found')
  
  if (supabaseUrl && supabaseServiceKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client initialized successfully')
  } else {
    console.warn('⚠️  Supabase not configured. Using mock data mode.')
  }
} catch (error) {
  console.warn('⚠️  Failed to initialize Supabase:', error.message)
  supabase = null
}

export { supabase }

// Routes
app.use('/api/campaigns', campaignsRouter)
app.use('/api/candidates', candidatesRouter)
app.use('/api/forms', formsRouter)
app.use('/api/email', emailRouter)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req: express.Request & { file?: Express.Multer.File }, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = req.file
    
    // If Supabase is not configured, return mock URL
    if (!supabase) {
      console.log('📁 Mock upload:', file.originalname)
      return res.json({ 
        url: `https://example.com/mock-uploads/${Date.now()}-${file.originalname}`,
        fileName: file.originalname,
        size: file.size
      })
    }

    const fileName = `${Date.now()}-${file.originalname}`
    
    const { error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      })

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName)

    res.json({ 
      url: publicUrl,
      fileName: fileName,
      size: file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// Error handling middleware
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next
  console.error(err)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Local development server
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export default app
