import databases
import sqlalchemy
from app.core.config import settings

database = databases.Database(settings.DATABASE_URL)

metadata = sqlalchemy.MetaData()

engine = sqlalchemy.create_engine(
    settings.DATABASE_URL
)