import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings
from email.utils import formataddr

from models import EmailUser

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
            recipient: EmailUser,
            file_path: str = None,
    ):

        with(smtplib.SMTP_SSL(self.smtp_server, self.port)) as server:
            server.login(self.sender_email, self.sender_pwd)

            msg = MIMEMultipart()
            msg['From'] = formataddr(('Repo Inspector', self.sender_email))
            msg['To'] = formataddr((recipient.name, recipient.email))
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'html'))

            part = MIMEBase('application', "octet-stream")

            if file_path:
                part.set_payload(open(file_path, "rb").read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment', filename=file_path)
                msg.attach(part)

            server.sendmail(self.sender_email, [recipient.email], msg.as_string())


email_sender = EmailNotifier()