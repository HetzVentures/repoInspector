from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(middleware=[
    Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
])

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")