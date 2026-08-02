-- 1. Create seller_requests table
CREATE TABLE public.seller_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    store_name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can insert their own requests
CREATE POLICY "Users can insert their own seller requests"
ON public.seller_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own seller requests"
ON public.seller_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view and update all requests
CREATE POLICY "Admins can view all seller requests"
ON public.seller_requests
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'Admin'
    )
);

CREATE POLICY "Admins can update all seller requests"
ON public.seller_requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'Admin'
    )
);


-- 4. Update the handle_new_user trigger to handle Google OAuth explicitly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'Buyer') -- Defaults to Buyer for OAuth signups
  );
  RETURN new;
END;
$$;

