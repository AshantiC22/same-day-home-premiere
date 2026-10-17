import os

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models import Base
from fastapi.testclient import TestClient

from database import get_db
from main import app
from models import Base, User
from security import hash_password

load_dotenv()
TEST_DATABASE_URL = os.environ["TEST_DATABASE_URL"]
assert TEST_DATABASE_URL.endswith("/premiere_test")  # safety: never touch the real database
test_engine = create_engine(TEST_DATABASE_URL)


@pytest.fixture
def session():
    Base.metadata.create_all(test_engine)  # build empty tables
    with Session(test_engine) as session:
        yield session  # the test runs here
    Base.metadata.drop_all(test_engine)  # throw the tables away

@pytest.fixture
def client(session):
    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def user(session):
    u = User(email="fan@example.com", password_hash=hash_password("devpass1"))
    session.add(u)
    session.commit()
    return u