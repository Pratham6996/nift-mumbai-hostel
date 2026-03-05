import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send a 6-digit OTP to the given email address. Returns True on success."""
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        raise RuntimeError("SMTP credentials not configured. Set SMTP_EMAIL and SMTP_APP_PASSWORD in .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"NIFT Mumbai Hostel — Your verification code: {otp_code}"
    msg["From"] = f"NIFT Mumbai Hostel <{SMTP_EMAIL}>"
    msg["To"] = to_email

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; border-radius: 16px; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #ffffff;">NIFT Mumbai Hostel</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #888;">Email Verification</p>
        </div>
        <div style="background: #16213e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #aaa;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #a29bfe; margin: 8px 0;">
                {otp_code}
            </div>
            <p style="margin: 12px 0 0; font-size: 12px; color: #666;">This code expires in 10 minutes</p>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
        </p>
    </div>
    """

    text_body = f"Your NIFT Mumbai Hostel verification code is: {otp_code}\nThis code expires in 10 minutes."

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
        raise RuntimeError(f"Failed to send verification email: {str(e)}")
