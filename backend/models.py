from sqlalchemy import Column, Integer, String, Enum
from database import Base
import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship




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
    
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)

    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)

    user = relationship("User")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    asset_name = Column(String, nullable=False)   # e.g. Mutual Fund / Stock
    total_units = Column(Float, default=0)
    total_invested = Column(Float, default=0)

    user = relationship("User")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("investments.id"))

    transaction_type = Column(String, nullable=False)  # BUY / SELL
    units = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    investment = relationship("Investment")


