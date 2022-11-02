import os
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
from dynaconf import Dynaconf

def load_settings():
    return Dynaconf(
        envvar_prefix="API",
        preload=[os.path.join(BASE_PATH, "default.toml")],
        settings_files=["settings.toml", ".secrets.toml"],
        environments=["development", "production", "testing"],
        env_switcher="API_env",
        load_dotenv=False,
    )

settings = load_settings()