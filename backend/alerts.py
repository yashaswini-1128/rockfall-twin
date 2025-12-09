import os, smtplib
from email.mime.text import MIMEText
from twilio.rest import Client

def send_email(to_email: str, subject: str, body: str):
    host=os.getenv("SMTP_HOST"); port=int(os.getenv("SMTP_PORT","587"))
    user=os.getenv("SMTP_USER"); pwd=os.getenv("SMTP_PASS")
    msg=MIMEText(body); msg["Subject"]=subject; msg["From"]=user; msg["To"]=to_email
    with smtplib.SMTP(host, port) as s:
        s.starttls(); s.login(user, pwd); s.send_message(msg)

def send_sms(to_number: str, body: str):
    sid=os.getenv("TWILIO_SID"); token=os.getenv("TWILIO_TOKEN"); from_ = os.getenv("TWILIO_FROM")
    if not (sid and token and from_): return
    Client(sid, token).messages.create(to=to_number, from_=from_, body=body)
