# Titan Intelligence Workflow Setup

## Overview
This workflow generates daily AI-powered portfolio analysis using Gemini and stores results in Supabase.

## Prerequisites
1. **Supabase account** with `portfolio_insights` table created (run migration first)
2. **Gemini API key** configured in n8n
3. **n8n v2.6.3+** installed and running

## Setup Steps

### 1. Run Database Migration
Execute `supabase/migrations/20260206_create_portfolio_insights.sql` in Supabase SQL Editor.

### 2. Import Workflow
1. Open n8n at http://localhost:5678
2. Click "..." menu → Import from File
3. Select `titan_intelligence_workflow.json`

### 3. Configure Credentials
- **Supabase Connection**: Add your Supabase URL and Service Role Key
- **Gemini API Key**: Add your Google AI API key

### 4. Activate
Toggle the workflow to Active. It will run daily at 5pm EST.

## Manual Execution
Click "Execute Workflow" to run immediately for testing.

## Troubleshooting
- If Gemini node fails, check API key permissions
- If Supabase node fails, verify RLS policies allow service role inserts
