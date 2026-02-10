-- Add sentiment_label column to news_articles table
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS sentiment_label TEXT;