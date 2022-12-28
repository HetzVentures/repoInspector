from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import rollbar
from rollbar.contrib.fastapi import ReporterMiddleware as RollbarMiddleware
import os
        
def init_rollbar(app):
    # Initialize Rollbar SDK with your server-side access token
    rollbar_api = os.environ.get('ROLLBAR_API')
    if rollbar_api:
        rollbar.init(
            access_token=rollbar_api,
            environment=os.environ.get('ROLLBAR_ENV', 'local')
            )

        app.add_middleware(RollbarMiddleware)


# Integrate Rollbar with FastAPI application before adding routes to the app
app = FastAPI(middleware=[
    Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
])
init_rollbar(app)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")