-- OTP verification table for email verification during registration
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  password_temp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- Auto-delete expired OTPs (runs on every insert/update)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM email_otps WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_cleanup_expired_otps
AFTER INSERT ON email_otps
EXECUTE FUNCTION cleanup_expired_otps();
