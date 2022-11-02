import uuid
from fastapi import APIRouter, Request, Form
from typing import List
from db import ActiveSession
from sqlmodel import Session
from app import templates
from fastapi.responses import HTMLResponse
from google.oauth2 import id_token
from google.auth.transport import requests
from config import settings
from fastapi.exceptions import HTTPException
from utils.message import MessageCreator
from utils.sender import email_sender
import models

repository_router = APIRouter()

@repository_router.get("/test/{repo_id}")
def test(repo_id, user_id: uuid.UUID, session: Session = ActiveSession):
    email_user = session.query(models.EmailUser).where(models.EmailUser.uuid == user_id).first()

    msg_creator = MessageCreator(session, repo_id)
    message_text, archive_path = msg_creator.create_message()
    email_sender.send_message(
        subject=f"Repository summary for {repo_id}",
        message=message_text,
        recipients_emails=[email_user.email],
        file_path=archive_path,
    )
    return "success"


@repository_router.post("/", response_model=models.RepositoryResponse)
async def create_repository(*, 
 session: Session = ActiveSession,
 user_id: uuid.UUID,
 repository: models.RepositoryCreate,
 forks: List[models.RepositoryUserCreate],
 stargazers: List[models.RepositoryUserCreate]):
    db_repository = models.Repository.from_orm(repository)
    session.add(db_repository)
    session.commit()
    session.refresh(db_repository)
    for fork in forks:
        fork.repository_id = db_repository.id
        fork.interaction_type = models.INTERACTION_TYPE.FORK
        db_fork = models.RepositoryUser.from_orm(fork)
        session.add(db_fork)
    for stargazer in stargazers:
        stargazer.repository_id = db_repository.id
        stargazer.interaction_type = models.INTERACTION_TYPE.STARGAZER
        db_stargazers = models.RepositoryUser.from_orm(stargazer)
        session.add(db_stargazers)
    session.commit()
    
    email_user = session.query(models.EmailUser).where(models.EmailUser.uuid == user_id).first()

    msg_creator = MessageCreator(session, db_repository.id)
    message_text, archive_path = msg_creator.create_message()
    email_sender.send_message(
        subject=f"Repository summary for {repository.name}",
        message=message_text,
        recipients_emails=[email_user.email],
        file_path=archive_path,
    )

    return db_repository


login_router = APIRouter()


@login_router.post("/email_user/", response_model=models.EmailUserResponse)
async def create_email_user(session: Session = ActiveSession):
    email_user = models.EmailUser()
    email_user.uuid = uuid.uuid4()
    session.add(email_user)
    session.commit()

    return email_user


@login_router.get("/email_user/{email_user_uuid}", response_model=models.EmailUserResponse)
async def get_email_user(email_user_uuid, session: Session = ActiveSession):
    email_user = session.query(models.EmailUser).where(models.EmailUser.uuid == email_user_uuid).first()
    return email_user


@login_router.get("/{email_user_uuid}", response_class=HTMLResponse)
def login(request: Request, email_user_uuid):
     return templates.TemplateResponse("login.html", {
            "request": request, 
            "data_client_id": settings.google.data_client_id,
            "email_user_uuid": email_user_uuid
        })



@login_router.post("/verify/{email_user_uuid}", response_class=HTMLResponse)
async def login(email_user_uuid, request: Request, g_csrf_token: str = Form(), credential: str = Form(), session: Session = ActiveSession,):
    csrf_token_cookie = request.cookies.get('g_csrf_token')
    if not csrf_token_cookie:
        raise HTTPException(status_code=400, detail='No CSRF token in Cookie.')
    if not g_csrf_token:
        raise HTTPException(status_code=400, detail='No CSRF token in post body.')
    if csrf_token_cookie != g_csrf_token:
        raise HTTPException(status_code=400, detail='Failed to verify double submit cookie.')
     
    id_info = id_token.verify_oauth2_token(credential, requests.Request(), settings.google.data_client_id)
    
    email_user = session.query(models.EmailUser).where(models.EmailUser.uuid == email_user_uuid).first()
    email_user.email = id_info['email']
    email_user.name=id_info['name']    
    session.commit()
    return templates.TemplateResponse("redirect.html", {"request": request, "email": id_info['email']})
