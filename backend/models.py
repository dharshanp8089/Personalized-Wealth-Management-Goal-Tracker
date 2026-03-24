from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, ForeignKey, Index, Boolean
from database import Base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime




class RiskProfile(enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class KYCStatus(enum.Enum):
    unverified = "unverified"
    verified = "verified"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    risk_profile = Column(Enum(RiskProfile), default=RiskProfile.moderate)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.unverified)
    created_at = Column(DateTime, default=datetime.utcnow)

class GoalType(enum.Enum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"

class GoalStatus(enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_type = Column(Enum(GoalType), default=GoalType.custom)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(DateTime, nullable=False)
    monthly_contribution = Column(Float, default=0)
    status = Column(Enum(GoalStatus), default=GoalStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class AssetType(enum.Enum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True) # Link to goal
    asset_type = Column(Enum(AssetType), default=AssetType.stock)
    symbol = Column(String, nullable=False)
    units = Column(Float, default=0)
    avg_buy_price = Column(Float, default=0)
    cost_basis = Column(Float, default=0)
    current_value = Column(Float, default=0)
    last_price = Column(Float, default=0)
    last_price_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    goal = relationship("Goal")

class TransactionType(enum.Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    fees = Column(Float, default=0)
    executed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class AssetPrice(Base):
    __tablename__ = "asset_prices"

    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String, index=True, nullable=False)
    current_price = Column(Float, nullable=False)
    price_change_percent = Column(Float, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Indexes for efficient queries
    __table_args__ = (
        Index('ix_asset_name_updated', 'asset_name', 'last_updated'),
    )


from sqlalchemy.dialects.postgresql import JSONB

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)

    scenario_name = Column(String, nullable=False)
    assumptions = Column(JSONB, nullable=False)
    results = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    goal = relationship("Goal")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String, nullable=False)
    recommendation_text = Column(String, nullable=False)
    suggested_allocation = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


