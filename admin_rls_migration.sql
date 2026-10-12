-- Migration: Add admin RLS policies for orders, order_items, restaurants
-- Run this in your Supabase SQL editor to complete the feature extension

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders." ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items." ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to view all restaurants (already covered by public policy, but explicit is safe)
-- No additional policy needed since restaurants are publicly viewable

-- Allow admins to view all menu items (already publicly viewable)
-- No additional policy needed

-- Add prediction_range and reliability columns to predictions if not already present
-- (These were added by the upadatefeature.md work - only run if they don't exist)
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS prediction_range_lower numeric;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS prediction_range_upper numeric;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS reliability text;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS explanation jsonb;
