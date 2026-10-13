from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateIndex, CreateTable

from models import Base

for table in Base.metadata.sorted_tables:
    print(CreateTable(table).compile(dialect=postgresql.dialect()))
    for index in table.indexes:
        print(CreateIndex(index).compile(dialect=postgresql.dialect()))