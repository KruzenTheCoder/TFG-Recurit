-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'recruiter')) DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'closed')) DEFAULT 'draft',
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')) DEFAULT 'pending',
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application status history
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('application_received', 'under_review', 'accepted', 'rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, type) VALUES
('Application Received', 'Application Received - {{campaign_title}}', 'Dear {{candidate_name}},\n\nThank you for applying for the {{campaign_title}} position. We have received your application and will review it shortly.\n\nBest regards,\nTFG Recruit Team', 'application_received'),
('Under Review', 'Application Under Review - {{campaign_title}}', 'Dear {{candidate_name}},\n\nYour application for the {{campaign_title}} position is currently under review. We will get back to you soon with an update.\n\nBest regards,\nTFG Recruit Team', 'under_review'),
('Application Accepted', 'Congratulations! Application Accepted - {{campaign_title}}', 'Dear {{candidate_name}},\n\nCongratulations! We are pleased to inform you that your application for the {{campaign_title}} position has been accepted. We will contact you shortly with the next steps.\n\nBest regards,\nTFG Recruit Team', 'accepted'),
('Application Rejected', 'Application Update - {{campaign_title}}', 'Dear {{candidate_name}},\n\nThank you for your interest in the {{campaign_title}} position. After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our requirements.\n\nWe appreciate your time and wish you the best in your job search.\n\nBest regards,\nTFG Recruit Team', 'rejected');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_form_id ON campaigns(form_id);
CREATE INDEX idx_candidates_campaign_id ON candidates(campaign_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_application_status_history_candidate_id ON application_status_history(candidate_id);
CREATE INDEX idx_forms_is_published ON forms(is_published);