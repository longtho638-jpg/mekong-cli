from pathlib import Path
from typing import Optional, Dict, Any
import tomli
from pydantic import BaseModel, Field

class DatabaseConfig(BaseModel):
    driver: str
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: str
    url: Optional[str] = None  # Full URL override

    @property
    def connection_string(self) -> str:
        if self.url:
            return self.url

        if self.driver == "sqlite":
            return f"sqlite:///{self.database}"

        auth = ""
        if self.username:
            auth = f"{self.username}"
            if self.password:
                auth += f":{self.password}"
            auth += "@"

        host_part = self.host or "localhost"
        if self.port:
            host_part += f":{self.port}"

        driver_map = {
            "postgres": "postgresql+psycopg2",
            "mysql": "mysql+mysqldb"
        }
        driver_scheme = driver_map.get(self.driver, self.driver)

        return f"{driver_scheme}://{auth}{host_part}/{self.database}"

class Config(BaseModel):
    migrations_dir: str = "migrations"
    seeds_dir: str = "seeds"
    default_connection: str = "default"
    connections: Dict[str, DatabaseConfig]
    model_metadata: Optional[str] = None # e.g. "app.models:Base.metadata"

def load_config(path: Path = Path("dmk.toml")) -> Config:
    if not path.exists():
        # Return default config for 'init' command to work before config exists
        return Config(
            connections={
                "default": DatabaseConfig(driver="sqlite", database="db.sqlite")
            }
        )

    with open(path, "rb") as f:
        data = tomli.load(f)

    return Config(**data)
