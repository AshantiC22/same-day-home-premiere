from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from pydantic import BaseModel, Field

PREMIERE_WINDOW_DAYS = 7

class Base(DeclarativeBase):
    pass


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    movie_length: Mapped[int]
    synopsis: Mapped[str | None] = mapped_column(Text)


class Premiere(Base):
    __tablename__ = "premieres"
    __table_args__ = (
        CheckConstraint("window_ends_at > starts_at", name="premieres_window_check"),
        CheckConstraint("price_cents >= 0", name="premieres_price_check"),
        Index("premieres_movie_starts_idx", "movie_id", "starts_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    window_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    display_time_zone: Mapped[str] = mapped_column(Text)
    price_cents: Mapped[int]
    currency: Mapped[str] = mapped_column(Text, server_default="usd")
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="users_email_lowercase_check"),
        CheckConstraint("role IN ('user', 'admin')", name="users_role_check"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text, server_default="user")
    failed_attempts: Mapped[int] = mapped_column(server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class StripeEvent(Base):
    __tablename__ = "stripe_events"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    type: Mapped[str] = mapped_column(Text)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class LoginSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class Purchase(Base):
    __tablename__ = "purchases"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'paid', 'expired', 'refunded', 'disputed')",
            name="purchases_status_check",
        ),
        Index(
            "purchases_one_active_per_user_premiere",
            "user_id",
            "premiere_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'paid')"),
        ),
        Index("purchases_user_id_idx", "user_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    premiere_id: Mapped[int] = mapped_column(ForeignKey("premieres.id"))
    status: Mapped[str] = mapped_column(Text, server_default="pending")
    amount_cents: Mapped[int]
    currency: Mapped[str] = mapped_column(Text, server_default="usd")
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(Text, unique=True)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(Text)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(Text)
    target_id: Mapped[int | None]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )