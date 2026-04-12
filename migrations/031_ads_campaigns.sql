-- migrations/031_ads_campaigns.sql
CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','draft')),
  daily_budget DECIMAL(10,2),
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(8,4) DEFAULT 0,
  last_optimized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform, campaign_id)
);

ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON ads_campaigns
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ads_campaigns_tenant_platform ON ads_campaigns(tenant_id, platform, status);
CREATE INDEX idx_ads_campaigns_roas ON ads_campaigns(roas);
CREATE INDEX idx_ads_campaigns_created_at ON ads_campaigns(created_at DESC);
