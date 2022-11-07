from app.routes import repository_router, login_router
from app.app import app

app.include_router(repository_router, tags=["repositories"], prefix="/repository")
app.include_router(login_router, prefix="/login")
