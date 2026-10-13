import os

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models import Base

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