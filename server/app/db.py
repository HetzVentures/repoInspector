from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from app.models import SQLModel
from app.config import settings

engine = create_engine(
    settings.db.sql_url,
    echo=settings.db.echo,
    connect_args={'options': '-csearch_path={}'.format('repo_inspector')}
)

def update_engine(new_engine):
    global_vars = globals()
    global_vars['engine'] = new_engine


def create_db_and_tables(engine):   
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()


ActiveSession = Depends(get_session)

create_db_and_tables(engine)