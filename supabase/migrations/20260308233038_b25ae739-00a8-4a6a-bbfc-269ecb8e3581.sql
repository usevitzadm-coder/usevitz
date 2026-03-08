
-- Fix existing orders where payment is approved but status is still pending
UPDATE public.orders 
SET status = 'confirmed' 
WHERE payment_status = 'approved' AND status = 'pending';
