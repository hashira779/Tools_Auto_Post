import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import os
import shutil

from app.database import Base, get_db
from app.main import app

# Use a local SQLite database for testing
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

@pytest.fixture
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def setup_storage():
    # Setup mock storage directory
    os.makedirs("/tmp/mock_storage", exist_ok=True)
    yield
    # Cleanup mock storage directory
    shutil.rmtree("/tmp/mock_storage", ignore_errors=True)

# Mock authenticated user
from app.auth import get_verified_user, User
import uuid

@pytest.fixture(autouse=True)
def mock_auth():
    def override_get_verified_user():
        return User(id=uuid.uuid4(), email="test@example.com", role="USER")
    
    app.dependency_overrides[get_verified_user] = override_get_verified_user
    yield
    app.dependency_overrides.pop(get_verified_user, None)
