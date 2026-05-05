from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://sondagem:sondagem123@localhost:5432/sondagem_db"
    SECRET_KEY: str = "mude-esta-chave-em-producao-32chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8

    class Config:
        env_file = ".env"


settings = Settings()
