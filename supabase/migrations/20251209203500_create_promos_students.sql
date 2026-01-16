-- Create Promos table
CREATE TABLE IF NOT EXISTS public.promos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    year INTEGER,
    start_date DATE,
    end_date DATE,
    pedagogical_referent TEXT,
    administrative_referent TEXT,
    status TEXT CHECK (status IN ('active', 'archived', 'planned')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Students (Apprenants) table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    promo_id UUID REFERENCES public.promos(id) ON DELETE SET NULL,
    profile_picture_url TEXT,
    status TEXT CHECK (status IN ('active', 'alumni', 'dropout')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Policies
-- Promos: Visible to all, Editable by Admins
CREATE POLICY "Promos are viewable by everyone" 
ON public.promos FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert promos" 
ON public.promos FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update promos" 
ON public.promos FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete promos" 
ON public.promos FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Students: Visible to all, Editable by Admins
CREATE POLICY "Students are viewable by everyone" 
ON public.students FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert students" 
ON public.students FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update students" 
ON public.students FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete students" 
ON public.students FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promos_year ON public.promos(year);
CREATE INDEX IF NOT EXISTS idx_students_promo_id ON public.students(promo_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- Triggers for updated_at
CREATE TRIGGER update_promos_updated_at
  BEFORE UPDATE ON public.promos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
