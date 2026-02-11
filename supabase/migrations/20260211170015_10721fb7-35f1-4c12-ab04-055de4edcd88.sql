
-- Add user_id column to orders table
ALTER TABLE public.orders ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create RLS policy for users to view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);
