ALTER TABLE ai_messages
ADD COLUMN IF NOT EXISTS redaction_hits integer NOT NULL DEFAULT 0;
