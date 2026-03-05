import os
import httpx
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "niftmumbainosh@gmail.com")  # used as reply-to


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send a 6-digit OTP to the given email address using Resend. Returns True on success."""
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY not configured in environment variables")

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; border-radius: 16px; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #ffffff;">NIFT Mumbai Hostel</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #888;">Email Verification</p>
        </div>
        <div style="background: #16213e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #aaa;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ee5a6f; margin: 8px 0;">
                {otp_code}
            </div>
            <p style="margin: 12px 0 0; font-size: 12px; color: #666;">This code expires in 10 minutes</p>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
        </p>
    </div>
    """

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"NIFT Mumbai Hostel <onboarding@resend.dev>",
                "to": [to_email],
                "reply_to": SMTP_EMAIL,
                "subject": f"NIFT Mumbai Hostel — Your verification code: {otp_code}",
                "html": html_body,
            },
            timeout=10,
        )
        if response.status_code == 200:
            return True
        else:
            print(f"[EMAIL ERROR] Resend returned {response.status_code}: {response.text}")
            raise RuntimeError(f"Failed to send verification email: {response.text}")
    except httpx.TimeoutException:
        raise RuntimeError("Email service timed out. Please try again.")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
        raise RuntimeError(f"Failed to send verification email: {str(e)}")
