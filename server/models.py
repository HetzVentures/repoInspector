from datetime import datetime
import uuid as uuid_pkg
from typing import Optional
from pydantic import BaseModel, Field
from sqlmodel import Field, SQLModel
from enum import Enum
import json
class EnumValue(Enum):
    """
    Generic enumeration which will return a value and not an enumeration object 
    """
    def __str__(self):
        return '%s' % self.value


class INTERACTION_TYPE(int, EnumValue):
    FORK = 1
    STARGAZER = 2


class Repository(SQLModel, table=True):
    __tablename__ = "repository"
    id: Optional[int] = Field(nullable=False, primary_key=True)
    name: str = Field(index=True)
    settings: Optional[str]
    created: datetime = datetime.now()
    stargazers_count: int
    forks_count: int
    email_user_id: int = Field(foreign_key="email_user.id")


class RepositoryResponse(BaseModel):
    """Repository serializer exposed on the API"""
    id: int
    name: str
    settings: Optional[str]
    stargazers_count: int
    forks_count: int

    def __init__(self, *args, **kwargs):
        settings = kwargs.pop("settings", None)
        if isinstance(settings, str):
            kwargs["settings"] = json.loads(settings)
        super().__init__(*args, **kwargs)

    class Config:
        orm_mode = True
    

class RepositoryCreate(BaseModel):
    """Repository serializer for creating model"""
    name: str
    settings: Optional[str]
    stargazers_count: int
    forks_count: int

    def __init__(self, *args, **kwargs):
        settings = kwargs.pop("settings", None)
        if isinstance(settings, dict):
            kwargs["settings"] = json.dumps(settings)
        super().__init__(*args, **kwargs)


class RepositoryUser(SQLModel, table=True):
    __tablename__ = "repository_user"
    id: Optional[int] = Field(nullable=False, primary_key=True)
    repository_id: int = Field(foreign_key="repository.id")
    geo_hash: Optional[str]
    country: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    interaction_type: int
    login: Optional[str]
    type: Optional[str]
    site_admin: Optional[bool]
    name: Optional[str]
    company: Optional[str]
    blog: Optional[str]
    location: Optional[str]
    email: Optional[str]
    hireable: Optional[str]
    bio: Optional[str]
    twitter_username: Optional[str]
    public_repos: Optional[int]
    public_gists: Optional[int]
    followers: Optional[int]
    following: Optional[int]
    event_count: Optional[int]
    real_user: Optional[bool]
    active_user: Optional[bool]
    created_at: datetime
    updated_at: datetime


class RepositoryUserCreate(BaseModel):
    geo_hash: Optional[str]
    country: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    repository_id: Optional[int]
    interaction_type: Optional[int]
    login: Optional[str]
    type: Optional[str]
    site_admin: Optional[bool]
    name: Optional[str]
    company: Optional[str]
    blog: Optional[str]
    location: Optional[str]
    email: Optional[str]
    hireable: Optional[str]
    bio: Optional[str]
    twitter_username: Optional[str]
    public_repos: Optional[int]
    public_gists: Optional[int]
    followers: Optional[int]
    following: Optional[int]
    event_count: Optional[int]
    real_user: Optional[bool]
    active_user: Optional[bool]
    created_at: datetime
    updated_at: datetime


class EmailUser(SQLModel, table=True):
    __tablename__ = "email_user"
    """
    client side initializes email_user. After object is created it is updated with the email using
    google authentication. This allow for the authentication to happen outside the extension, and yet to allow the extension
    to find the email.
    """

    id: Optional[int] = Field(nullable=False, primary_key=True)
    uuid: uuid_pkg.UUID = Field(index=True)
    name: Optional[str]
    email: Optional[str]
    created: datetime = datetime.now()


class EmailUserResponse(BaseModel):
    """
    Email user serializer
    """
    uuid: uuid_pkg.UUID
    name: Optional[str]
    email: Optional[str]

    class Config:
        orm_mode = True