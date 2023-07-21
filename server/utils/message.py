
from datetime import datetime
from sqlmodel import Session
from models import RepositoryUser, Repository
from sqlalchemy import func, desc, inspect
import os
import csv
import json
import logging
import zipfile
from os.path import basename
import urllib.parse

class MessageCreator:

    def __init__(self, session: Session, repo_id: int):
        self.session = session
        self.repo_id = repo_id
        self.logger = logging.getLogger('MESSAGE CREATION')
        self.repo = session.query(Repository).where(Repository.id == repo_id).first()
        self.temp_path = f'temp/repo_{self.repo_id}'

    def create_message(self) -> tuple:

        rows = self.session.query(RepositoryUser).where(RepositoryUser.repository_id == self.repo_id).all()

        if rows:
            file_path = f'{self.temp_path}.csv'
            json_file_path = f'{self.temp_path}.json'
            self.create_csv(
                file_path=file_path,
                rows=rows,
                repo_name=self.repo.name
            )
            self.create_json(
                file_path=json_file_path,
                rows=rows,
            )
            message_text = self.create_message_text()
        else:
            file_path = None
            json_file_path = None
            message_text = 'Nothing was found by session'

        archive_path = self.create_archive(
            file_path=file_path,
            json_file_path=json_file_path,
        )

        return message_text, archive_path

    def create_archive(
            self,
            file_path: str,
            json_file_path: str,
    ) -> str:
        try:
            archive_path = f'{self.temp_path}.zip'

            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
                archive.write(file_path, basename(file_path))
                archive.write(json_file_path, basename(json_file_path))

            return archive_path
        except BaseException:
            return self.create_archive(
                file_path=file_path,
                json_file_path=json_file_path,
            )

    def clear_temp(self):
        os.remove(f'{self.temp_path}.csv')
        os.remove(f'{self.temp_path}.json')
        os.remove(f'{self.temp_path}.zip')

    @staticmethod
    def create_csv(
            file_path: str,
            rows: list,
            repo_name: str
    ) -> None:
        today = datetime.today().strftime('%Y-%m-%d')
        with open(file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            inst = inspect(RepositoryUser)
            keys = [c_attr.key for c_attr in inst.mapper.column_attrs]
            headers = [c_attr.key for c_attr in inst.mapper.column_attrs]
            headers.insert(0, 'scan_date')
            headers.insert(0, 'repository_name')
            headers_to_remove = []

            for header_to_remove in headers_to_remove:
                if header_to_remove in headers:
                    headers.remove(header_to_remove)

            writer.writerow(headers)

            for row in rows:
                row_to_write = list()

                for key in keys:
                    row_to_write.append(getattr(row, key))

                row_to_write.insert(0, today)
                row_to_write.insert(0, repo_name)
                writer.writerow(row_to_write)

    @staticmethod
    def create_json(
            file_path: str,
            rows: list,
    ) -> None:
        json_data = json.dumps([r.dict() for r in rows], ensure_ascii=False, indent=4, default=str)

        with open(file_path, 'w', newline='', encoding='utf-8') as file:
            file.write(json_data)

    def create_message_text(self) -> str:
        session = self.session
        repo_id = self.repo_id

        total_users = session.query(RepositoryUser.id).where(RepositoryUser.repository_id == repo_id).count()
        
        organizations_total = session.query(RepositoryUser.id).where(RepositoryUser.repository_id == repo_id, 
                                            RepositoryUser.company.is_not(None)).count()
        
        organizations_percent = "{:.2f}".format(organizations_total / total_users * 100)
        
        users_with_email = session.query(RepositoryUser.id).where(RepositoryUser.repository_id == repo_id, 
                                        RepositoryUser.email.is_not(None)).count()
        
        users_with_email_percent = "{:.2f}".format(users_with_email / total_users * 100)
        
        company_summary = session.query(RepositoryUser.company, func.count(RepositoryUser.company).label("count"))\
            .where(RepositoryUser.repository_id == repo_id).group_by(RepositoryUser.company).order_by(desc('count')).all()
        
        country_summary = session.query(RepositoryUser.country, func.count(RepositoryUser.country).label("count"))\
            .where(RepositoryUser.repository_id == repo_id).group_by(RepositoryUser.country).order_by(desc('count')).all()

        real_users = session.query(RepositoryUser.id).where(RepositoryUser.repository_id == repo_id, 
                                            RepositoryUser.real_user.is_(True)).count()

        active_users = session.query(RepositoryUser.id).where(RepositoryUser.repository_id == repo_id, 
                                    RepositoryUser.active_user.is_(True)).count()

        message_text = '<img src="https://www.hetzventures.org/static/email-header.gif">'
        message_text = message_text + f'<br><br>Hi,<br><br>Below (and attached) is your report for repository https://github.com/{self.repo.name}<br><br>'
        message_text = message_text + "<i>Thanks for using repoInspector! Give us a <a href='https://github.com/HetzVentures/repoInspector'>Star</a></i><br><br>"

        settings = json.loads(self.repo.settings)
        def setting_status(v):
            return '✓' if v else '✗'
            
        message_text = message_text + f"<b>Settings:</b> \
            {setting_status(settings['stars'])} Stars \
            {setting_status(settings['forks'])} Forks \
            {setting_status(settings['sample'])} Sample<br><br>"
        if settings.get('sample'):
            message_text = message_text + f"<b>Sample percent:</b> {settings['samplePercent']}%<br><br>"

        message_text = message_text + f'<b>Total number of profiles inspected:</b> {total_users}<br><br>'

        message_text = message_text + f'<b>Repository Stars:</b> {self.repo.stargazers_count}<br>'
        message_text = message_text + f'<b>Repository Forks:</b> {self.repo.forks_count}<br><br>'


        message_text = message_text + f'<b>Issues:</b> {self.repo.issues_count}<br>'
        message_text = message_text + f'<b>Pull requests:</b> {self.repo.pull_requests_count}<br>'
        message_text = message_text + f'<b>Contributors:</b> {self.repo.contributors_count}<br>'
        message_text = message_text + f'<b>Watchers:</b> {self.repo.watchers_count}<br>'

        stars_per_month = 0
        if "last_month_stars" in self.repo:
            stars_per_month = round((self.repo.last_month_stars / self.repo.stargazers_count) * 100, 2)

        message_text = message_text + f'<b>Stars added per month:</b> {stars_per_month}%<br>'
        message_text = message_text + f'<b>Total forks / total stars:</b> {round(self.repo.forks_count / self.repo.stargazers_count, 2)}<br>'
        message_text = message_text + f'<b>Issues created in last 12 month:</b> {self.repo.issues_opened_ltm}<br>'
        message_text = message_text + f'<b>Health (% issues closed in LTM):</b> {self.repo.health}<br>'
        message_text = message_text + f'<b>Pull requests merged LTM:</b> {self.repo.pull_requests_merged_ltm}<br>'

        in_organizations_text = f'<b>Organization:</b> {organizations_percent} % ' \
                                f'({organizations_total} profile(s))<br>'
        message_text = message_text + in_organizations_text
        email_text = f'<b>Email users:</b> {users_with_email_percent} % ({users_with_email}profile(s)) <br>'
        message_text = message_text + email_text

        org_message_text = ""

        for organization in company_summary:
            if organization.count > 3:
                organization_percent = "%.2f" % (organization.count / (total_users) * 100)
                org_message_text = org_message_text + f'     {organization.company}: {organization_percent} % ' \
                                              f'({organization.count} profile(s))<br>'

        if org_message_text:
            message_text += f'<br><b>Org breakdown:</b><br>' + org_message_text

        active_users_text = f'<b>Active users:</b> {"%.2f" % (active_users / (total_users) * 100)} % ({active_users} ' \
                            f'profile(s))<br>'
        message_text = message_text + '<br>' + active_users_text
        real_users_text = f'<b>Real users:</b> {"%.2f" % (real_users / (total_users) * 100)} % ({real_users} ' \
                          f'profile(s))<br>'
        message_text = message_text + '<br>' + real_users_text
        message_text += f'<br><b>Geo breakdown:</b><br>'

        for location in country_summary:
            if location.country:
                location_percent = "%.2f" % (location.count / total_users * 100)
                message_text = message_text + f'     {location.country}: {location_percent} % ({location.count} profile(s))<br>'

        # common limit for shown data in charts
        data_limit = 12

        # stargazers chart
        stars_history_dict = json.loads(self.repo.stars_history)
        stars_chart_labels = sorted(stars_history_dict.keys())
        stars_chart_dataset = [stars_history_dict[key]["count"] for key in stars_chart_labels]
        stars_chart_data = {
            "type": "line",
            "data": {
                "labels": stars_chart_labels[:data_limit],
                "datasets": [
                    {
                        "label": "Stargazers history",
                        "data": stars_chart_dataset[:data_limit]
                    }
                ]
            }
        }
        stars_chart_data_str = json.dumps(stars_chart_data)
        stars_chart_encoded_data = urllib.parse.quote(stars_chart_data_str)
        stars_chart_data_url = f"https://quickchart.io/chart?width=800&height=350&devicePixelRatio=1&c={stars_chart_encoded_data}"
        
        stars_chart_data_string = json.dumps(stars_chart_data)

        message_text = message_text + f'<img src="{stars_chart_data_url}" alt="Stargazers history"><br>'

        # issues chart
        issues_history_dict = json.loads(self.repo.issues_history)
        issues_chart_labels = sorted(issues_history_dict.keys())
        issues_chart_dataset_opened = [issues_history_dict[key]["opened"] for key in issues_chart_labels]
        issues_chart_dataset_closed = [issues_history_dict[key]["closed"] for key in issues_chart_labels]
        issues_chart_data = {
            "type": "bar",
            "data": {
                "labels": issues_chart_labels[:data_limit],
                "datasets": [
                    {
                        "label": "Opened issues",
                        "data": issues_chart_dataset_opened[:data_limit]
                    },
                    {
                        "label": "Closed issues",
                        "data": issues_chart_dataset_closed[:data_limit]
                    }
                ]
            }
        }
        issues_chart_data_str = json.dumps(issues_chart_data)
        issues_chart_encoded_data = urllib.parse.quote(issues_chart_data_str)
        issues_chart_data_url = f"https://quickchart.io/chart?width=800&height=350&devicePixelRatio=1&c={issues_chart_encoded_data}"
        
        issues_chart_data_string = json.dumps(issues_chart_data)

        message_text = message_text + f'<img src="{issues_chart_data_url}" alt="Issues history"><br>'

        return message_text
