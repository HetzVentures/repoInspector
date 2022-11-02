from routes import repository_router
from routes import login_router
from app import app

app.include_router(repository_router, tags=["repositories"], prefix="/repository")
app.include_router(login_router, prefix="/login")
