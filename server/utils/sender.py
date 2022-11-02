import smtplib
import ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Union, List
from config import settings

class EmailNotifier:
    _message_template = 'Subject: {subject}\n\n{message}'

    def __init__(self):
        self.sender_email = settings.email.username
        self.sender_pwd = settings.email.password
        self.smtp_server = settings.email.smtp_server
        self.port = settings.email.port

    def send_message(
            self,
            subject: str,
            message: str,
            recipients_emails: Union[str, List[str]],
            file_path: str = None,
    ):
        recipients_emails = list(recipients_emails)
        context = ssl.create_default_context()

        with(smtplib.SMTP(self.smtp_server, self.port)) as server:
            server.starttls(context=context)
            server.login(self.sender_email, self.sender_pwd)

            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = ', '.join(recipients_emails)
            msg['Subject'] = subject
            msg.attach(MIMEText(message))

            part = MIMEBase('application', "octet-stream")

            if file_path:
                part.set_payload(open(file_path, "rb").read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment', filename=file_path)
                msg.attach(part)

            server.sendmail(self.sender_email, recipients_emails, msg.as_string())


email_sender = EmailNotifier()