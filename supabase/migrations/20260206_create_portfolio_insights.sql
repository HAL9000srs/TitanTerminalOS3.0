-- Create portfolio_insights table for Titan Intelligence
CREATE TABLE IF NOT EXISTS public.portfolio_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    summary TEXT NOT NULL,
    risk_score INT CHECK (
        risk_score >= 0
        AND risk_score <= 100
    ),
    diversification_status TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    type TEXT DEFAULT 'DAILY_BRIEF' CHECK (
        type IN ('DAILY_BRIEF', 'DEEP_DIVE', 'NEWS_ALERT')
    )
);
-- Add RLS policies
ALTER TABLE public.portfolio_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own insights" ON public.portfolio_insights FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert insights" ON public.portfolio_insights FOR
INSERT WITH CHECK (true);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_insights_user_id ON public.portfolio_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_insights_created_at ON public.portfolio_insights(created_at DESC);
COMMENT ON TABLE public.portfolio_insights IS 'Stores AI-generated portfolio analysis from Titan Intelligence n8n workflow';