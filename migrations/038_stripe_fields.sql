-- Migration: Add Stripe fields to tenants table
-- Run in Supabase SQL Editor

-- 1. Add stripe_customer_id column
ALTER TABLE IF EXISTS tenants 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Add stripe_subscription_id column
ALTER TABLE IF EXISTS tenants 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer 
ON tenants(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe Customer ID for subscription management';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe Subscription ID for tracking active subscription';

-- 4. Add RLS policy for updating stripe fields (owner, atollom_admin)
-- Note: This assumes existing RLS policies are in place
-- The service_role will have full access, but we can add a policy if needed