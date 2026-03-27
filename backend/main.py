from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
import random
import math

from database import SessionLocal, engine, Base
from models import User, Goal, Investment, Transaction, AssetPrice, Simulation, Recommendation
from utils import hash_password, verify_password

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TransactionRequest(BaseModel):
    symbol: str
    asset_type: str
    units: float
    price_per_unit: float
    fees: float = 0
    goal_id: int | None = None # Optional goal link


class GoalRequest(BaseModel):
    title: str
    goal_type: str
    target_amount: float
    target_date: str  # YYYY-MM-DD
    monthly_contribution: float = 0


class RiskProfileRequest(BaseModel):
    answers: dict


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "your-access-token-secret"
REFRESH_SECRET_KEY = "your-refresh-token-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.post("/register")
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}


@app.post("/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@app.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access_token = create_access_token(data={"sub": user.email})
    return {"access_token": new_access_token, "token_type": "bearer"}


def calculate_months(start_date: datetime, end_date: datetime):
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)


def calculate_required_monthly(target_amount: float, months: int):
    return 0 if months <= 0 else round(target_amount / months, 2)


def calculate_completion(current_value: float, target_amount: float):
    return 0 if target_amount == 0 else round((current_value / target_amount) * 100, 2)


def calculate_risk_profile(answers: dict):
    # Mapping points based on RiskTest.js values
    points = 0
    mapping = {
        # Horizon
        "short": 1, "medium": 3, "long": 5,
        # Reaction
        "panic": 1, "hold": 3, "opportunistic": 5,
        # Goal
        "safety": 1, "balanced": 3, "growth": 5,
        # Income
        "low": 1, "stable": 3, "high": 5,
        # Experience
        "novice": 1, "informed": 3, "expert": 5
    }
    
    for val in answers.values():
        points += mapping.get(val, 3) # Default to moderate (3 points)
        
    if points <= 10:
        return "conservative"
    elif points <= 18:
        return "moderate"
    return "aggressive"


def generate_allocation_recommendation(risk_profile: str, portfolio_value: float):
    allocations = {
        "conservative": {"equities": 30, "bonds": 50, "gold": 10, "cash": 10},
        "moderate": {"equities": 60, "bonds": 30, "gold": 5, "cash": 5},
        "aggressive": {"equities": 80, "bonds": 10, "gold": 5, "cash": 5}
    }
    allocation = allocations.get(risk_profile, allocations["moderate"])
    returns = {
        "conservative": "5-7%",
        "moderate": "8-10%",
        "aggressive": "12-15%"
    }
    return {
        "type": "ALLOCATION",
        "allocation": allocation,
        "estimated_annual_return": returns.get(risk_profile, "8-10%")
    }


@app.get("/")
def home():
    return {"message": "Wealth Tracker Backend Running"}


@app.get("/me")
def get_logged_in_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "risk_profile": current_user.risk_profile,
        "kyc_status": current_user.kyc_status
    }


@app.put("/me")
def update_profile(
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = name
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "name": current_user.name}


@app.post("/risk-profile")
def submit_risk_profile(
    data: RiskProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    risk = calculate_risk_profile(data.answers)
    current_user.risk_profile = risk
    db.commit()
    return {"risk_profile": risk}


@app.post("/kyc/verify")
def verify_kyc(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.kyc_status = "verified"
    db.commit()
    return {"message": "KYC verified successfully"}


@app.post("/goals")
def create_goal(
    req: GoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = Goal(
        user_id=current_user.id,
        title=req.title,
        goal_type=req.goal_type,
        target_amount=req.target_amount,
        target_date=datetime.strptime(req.target_date, "%Y-%m-%d"),
        monthly_contribution=req.monthly_contribution
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"message": "Goal created successfully", "goal_id": goal.id}


@app.get("/goals")
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    results = []
    for goal in goals:
        investments = db.query(Investment).filter(
            Investment.user_id == current_user.id,
            Investment.goal_id == goal.id
        ).all()
        current_amount = sum(inv.units * inv.last_price for inv in investments)
        results.append({
            "id": goal.id,
            "title": goal.title,
            "goal_type": goal.goal_type.value if hasattr(goal.goal_type, 'value') else goal.goal_type,
            "target_amount": goal.target_amount,
            "current_amount": round(current_amount, 2),
            "target_date": goal.target_date.strftime("%Y-%m-%d") if goal.target_date else None,
            "monthly_contribution": goal.monthly_contribution,
            "status": goal.status.value if hasattr(goal.status, 'value') else goal.status
        })
    return results


@app.put("/goals/{goal_id}")
def update_goal(
    goal_id: int, 
    req: GoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.title = req.title
    goal.goal_type = req.goal_type
    goal.target_amount = req.target_amount
    goal.target_date = datetime.strptime(req.target_date, "%Y-%m-%d")
    goal.monthly_contribution = req.monthly_contribution
    db.commit()
    db.refresh(goal)
    return {"message": "Goal updated successfully", "goal_id": goal.id}


@app.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}


@app.get("/goals/{goal_id}/metrics")
def goal_metrics(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Calculate months from created_at to target_date
    months = calculate_months(goal.created_at, goal.target_date)
    required_monthly = calculate_required_monthly(goal.target_amount, months)
    
    # Calculate current value based on linked investments
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.goal_id == goal_id
    ).all()
    
    current_amount = sum(inv.units * inv.last_price for inv in investments)
    
    completion = calculate_completion(current_amount, goal.target_amount)
    return {
        "goal_id": goal.id,
        "title": goal.title,
        "duration_months": months,
        "required_monthly_investment": required_monthly,
        "current_amount": round(current_amount, 2),
        "target_amount": goal.target_amount,
        "completion_percentage": completion,
        "linked_assets": [inv.symbol for inv in investments]
    }


@app.post("/portfolio/buy")
def buy_investment(
    req: TransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symbol = req.symbol.upper()
    units = req.units
    price_per_unit = req.price_per_unit
    fees = req.fees
    amount = (units * price_per_unit) + fees
    
    investment = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.symbol == symbol
    ).first()
    
    if not investment:
        investment = Investment(
            user_id=current_user.id,
            symbol=symbol,
            goal_id=req.goal_id, # Link during creation
            asset_type=req.asset_type,
            units=0,
            cost_basis=0,
            avg_buy_price=0
        )
        db.add(investment)
        db.commit()
        db.refresh(investment)
    
    investment.units += units
    investment.cost_basis += amount
    investment.avg_buy_price = investment.cost_basis / investment.units if investment.units > 0 else 0
    investment.last_price = price_per_unit
    investment.last_price_at = datetime.utcnow()
    
    transaction = Transaction(
        user_id=current_user.id,
        symbol=symbol,
        type="buy",
        quantity=units,
        price=price_per_unit,
        fees=fees
    )
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Buy transaction successful",
        "symbol": symbol,
        "units_held": investment.units,
        "cost_basis": investment.cost_basis
    }


@app.post("/portfolio/sell")
def sell_investment(
    req: TransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symbol = req.symbol.upper()
    units = req.units
    price_per_unit = req.price_per_unit
    fees = req.fees
    
    investment = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.symbol == symbol
    ).first()
    
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    if units > investment.units:
        raise HTTPException(status_code=400, detail="Not enough units to sell")
    
    # Calculate proporitonal cost basis to remove
    cost_per_unit = investment.cost_basis / investment.units
    investment.units -= units
    investment.cost_basis -= (units * cost_per_unit)
    investment.last_price = price_per_unit
    investment.last_price_at = datetime.utcnow()
    
    transaction = Transaction(
        user_id=current_user.id,
        symbol=symbol,
        type="sell",
        quantity=units,
        price=price_per_unit,
        fees=fees
    )
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Sell transaction successful",
        "symbol": symbol,
        "units_remaining": investment.units,
        "cost_basis_remaining": investment.cost_basis
    }


@app.get("/portfolio")
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    portfolio = []
    for inv in investments:
        if inv.units <= 0:
            continue
        portfolio.append({
            "symbol": inv.symbol,
            "asset_type": inv.asset_type,
            "units": inv.units,
            "cost_basis": inv.cost_basis,
            "avg_buy_price": inv.avg_buy_price,
            "current_value": inv.current_value,
            "last_price": inv.last_price,
            "last_price_at": inv.last_price_at.isoformat() if inv.last_price_at else None
        })
    return portfolio


@app.get("/portfolio/transactions")
def get_all_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.executed_at.desc()).all()
    
    result = []
    for txn in transactions:
        result.append({
            "id": txn.id,
            "symbol": txn.symbol,
            "transaction_type": txn.type,
            "quantity": txn.quantity,
            "price": txn.price,
            "fees": txn.fees,
            "executed_at": txn.executed_at.isoformat() if txn.executed_at else None
        })
    return result


@app.get("/portfolio/{symbol}/transactions")
def get_asset_transactions(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.symbol == symbol.upper()
    ).order_by(Transaction.executed_at.desc()).all()
    
    result = []
    for txn in transactions:
        result.append({
            "id": txn.id,
            "transaction_type": txn.type,
            "quantity": txn.quantity,
            "price": txn.price,
            "fees": txn.fees,
            "executed_at": txn.executed_at.isoformat() if txn.executed_at else None
        })
    return result


@app.get("/portfolio/summary")
def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    total_cost_basis = 0
    total_current_value = 0
    holdings_count = 0
    for inv in investments:
        if inv.units > 0:
            holdings_count += 1
            total_cost_basis += inv.cost_basis
            total_current_value += (inv.units * inv.last_price) # Simplified
    return {
        "total_cost_basis": round(total_cost_basis, 2),
        "total_current_value": round(total_current_value, 2),
        "holdings_count": holdings_count,
        "total_assets": len(investments)
    }


@app.get("/prices")
def get_all_prices(db: Session = Depends(get_db)):
    prices = db.query(AssetPrice).all()
    return [
        {
            "asset_name": p.asset_name,
            "current_price": p.current_price,
            "price_change_percent": p.price_change_percent,
            "last_updated": p.last_updated.isoformat() if p.last_updated else None
        }
        for p in prices
    ]


@app.get("/prices/{asset_name}")
def get_asset_price(asset_name: str, db: Session = Depends(get_db)):
    price = db.query(AssetPrice).filter(
        AssetPrice.asset_name.ilike(asset_name)
    ).first()
    if not price:
        return {
            "asset_name": asset_name,
            "current_price": 0,
            "error": "Price not found"
        }
    return {
        "asset_name": price.asset_name,
        "current_price": price.current_price,
        "price_change_percent": price.price_change_percent,
        "last_updated": price.last_updated.isoformat() if price.last_updated else None
    }


@app.post("/prices/update/{asset_name}")
def update_asset_price(
    asset_name: str, price: float, price_change_percent: float = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset_name = asset_name.lower()
    existing = db.query(AssetPrice).filter(
        AssetPrice.asset_name.ilike(asset_name)
    ).first()
    if existing:
        existing.current_price = price
        existing.price_change_percent = price_change_percent
        existing.last_updated = datetime.utcnow()
    else:
        new_price = AssetPrice(
            asset_name=asset_name,
            current_price=price,
            price_change_percent=price_change_percent
        )
        db.add(new_price)
    db.commit()
    return {
        "message": "Price updated successfully",
        "asset_name": asset_name,
        "current_price": price
    }


@app.get("/portfolio/valuation")
def get_portfolio_valuation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    portfolio = []
    total_current_value = 0
    total_cost_basis = 0
    
    for inv in investments:
        if inv.units <= 0:
            continue
        # Use last_price as current price for now (should be updated by market sync in later milestones)
        current_price = inv.last_price
        current_value = inv.units * current_price
        gain_loss = current_value - inv.cost_basis
        gain_loss_percent = (gain_loss / inv.cost_basis * 100) if inv.cost_basis > 0 else 0
        
        portfolio.append({
            "symbol": inv.symbol,
            "asset_type": inv.asset_type,
            "units": round(inv.units, 2),
            "cost_basis": round(inv.cost_basis, 2),
            "avg_buy_price": round(inv.avg_buy_price, 2),
            "current_price": round(current_price, 2),
            "current_value": round(current_value, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_percent": round(gain_loss_percent, 2)
        })
        total_current_value += current_value
        total_cost_basis += inv.cost_basis
    
    return {
        "holdings": portfolio,
        "summary": {
            "total_cost_basis": round(total_cost_basis, 2),
            "total_current_value": round(total_current_value, 2),
            "total_gain_loss": round(total_current_value - total_cost_basis, 2),
            "total_return_percent": round((total_current_value - total_cost_basis) / total_cost_basis * 100, 2) if total_cost_basis > 0 else 0
        }
    }



@app.get("/portfolio/export/csv")
def export_portfolio_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from fastapi.responses import Response
    import io
    import csv
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["Symbol", "Asset Type", "Units", "Cost Basis", "Avg Buy Price", "Last Price", "Current Value"])
    for inv in investments:
        if inv.units > 0:
            writer.writerow([inv.symbol, inv.asset_type, inv.units, inv.cost_basis, inv.avg_buy_price, inv.last_price, (inv.units * inv.last_price)])
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=portfolio_{current_user.id}.csv"
    return response

@app.get("/portfolio/transactions/export/csv")
def export_transactions_csv(symbol: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from fastapi.responses import Response
    import io
    import csv
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if symbol:
        query = query.filter(Transaction.symbol == symbol.upper())
    transactions = query.order_by(Transaction.executed_at.desc()).all()
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["Symbol", "Type", "Quantity", "Price", "Fees", "Executed At"])
    for txn in transactions:
        writer.writerow([txn.symbol, txn.type, txn.quantity, txn.price, txn.fees, txn.executed_at.isoformat() if txn.executed_at else ""])
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=transactions_{current_user.id}.csv"
    return response


@app.get("/portfolio/export/pdf")
def export_portfolio_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from fastapi.responses import Response
    from fpdf import FPDF

    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    pdf.cell(0, 10, txt=f"Portfolio Report for {current_user.name}", ln=True, align="C")
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(30, 10, "Symbol", border=1)
    pdf.cell(30, 10, "Units", border=1)
    pdf.cell(40, 10, "Cost Basis", border=1)
    pdf.cell(40, 10, "Current Val", border=1)
    pdf.cell(40, 10, "Gain/Loss", border=1)
    pdf.ln()
    
    pdf.set_font("Arial", '', 10)
    total_cost = 0
    total_val = 0
    for inv in investments:
        if inv.units > 0:
            val = inv.units * inv.last_price
            gl = val - inv.cost_basis
            total_cost += inv.cost_basis
            total_val += val
            pdf.cell(30, 10, inv.symbol, border=1)
            pdf.cell(30, 10, f"{inv.units:.2f}", border=1)
            pdf.cell(40, 10, f"{inv.cost_basis:.2f}", border=1)
            pdf.cell(40, 10, f"{val:.2f}", border=1)
            pdf.cell(40, 10, f"{gl:.2f}", border=1)
            pdf.ln()
            
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(0, 10, f"Total Portfolio Value: {total_val:.2f}", ln=True)
    pdf.cell(0, 10, f"Total Cost Basis: {total_cost:.2f}", ln=True)
    
    pdf_bytes = bytes(pdf.output())
    
    response = Response(content=pdf_bytes, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=portfolio_{current_user.id}.pdf"
    return response


@app.post("/market/sync", tags=["Market Data"])
def sync_market_prices(db: Session = Depends(get_current_user)):
    """Triggers the real-time market data sync via the new yfinance task."""
    from tasks import sync_all_market_prices
    try:
        msg = sync_all_market_prices()
        return {"status": "success", "message": msg}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/goals/{goal_id}/simulate", tags=["Simulations"])
def run_goal_simulation(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Calculate current capital assigned to this goal (or total portfolio for simplicity)
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    current_portfolio_value = sum(inv.units * inv.last_price for inv in investments)
    
    # Risk Profile Parameters
    risk = current_user.risk_profile or "Moderate"
    # Convert Enum to string if needed
    if hasattr(risk, 'value'):
        risk = risk.value
    # Capitalize for the map
    risk_key = risk.capitalize() if isinstance(risk, str) else "Moderate"
    
    params = {
        "Aggressive": {"return": 0.12, "vol": 0.18},
        "Moderate":   {"return": 0.08, "vol": 0.12},
        "Conservative":{"return": 0.05, "vol": 0.07}
    }
    config = params.get(risk_key, params["Moderate"])
    
    target_date = goal.target_date
    if isinstance(target_date, str):
         target_date = datetime.strptime(target_date, "%Y-%m-%d")
         
    months_left = max(1, (target_date.year - datetime.utcnow().year) * 12 + (target_date.month - datetime.utcnow().month))
    years_left = months_left / 12.0
    
    num_simulations = 100
    all_trajectories = []
    success_count = 0
    
    for _ in range(num_simulations):
        current_val = current_portfolio_value
        for m in range(months_left):
            monthly_ret = config["return"] / 12
            monthly_vol = config["vol"] / (12**0.5)
            shock = random.gauss(0, 1)
            growth_factor = math.exp((monthly_ret - 0.5 * monthly_vol**2) + monthly_vol * shock)
            current_val = current_val * growth_factor + goal.monthly_contribution
                
        if current_val >= goal.target_amount:
            success_count += 1
        all_trajectories.append(current_val)

    success_rate = (success_count / num_simulations) * 100
    median_final = sorted(all_trajectories)[num_simulations // 2]
    
    # Generate chart data (deterministic median path)
    chart_data = []
    points = 12
    step_months = max(1, months_left // points)
    temp_val = current_portfolio_value
    for i in range(1, points + 1):
        # Monthly growth over the step
        duration = step_months / 12.0
        temp_val = temp_val * math.exp(config["return"] * duration) + (goal.monthly_contribution * step_months)
        chart_data.append({
            "period": f"M{i * step_months}",
            "value": round(temp_val, 2)
        })

    results_dict = {
        "success_rate": round(success_rate, 1),
        "median_projection": round(median_final, 2),
        "target_amount": goal.target_amount,
        "months_left": months_left,
        "chart_data": chart_data
    }
    
    assumptions_dict = {
        "expected_return": config["return"],
        "volatility": config["vol"],
        "years": round(years_left, 1)
    }
    
    simulation = Simulation(
        user_id=current_user.id,
        goal_id=goal_id,
        scenario_name=f"Monte Carlo for {goal.title}",
        assumptions=assumptions_dict,
        results=results_dict
    )
    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    
    return {
        "id": simulation.id,
        "success_rate": success_rate,
        "results": results_dict
    }


@app.get("/simulations")
def list_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    simulations = db.query(Simulation).filter(
        Simulation.user_id == current_user.id
    ).order_by(Simulation.created_at.desc()).all()
    
    return [
        {
            "id": s.id,
            "title": s.scenario_name,
            "goal_id": s.goal_id,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "results": s.results if s.results else {}
        }
        for s in simulations
    ]


@app.get("/simulations/{simulation_id}")
def get_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    simulation = db.query(Simulation).filter(
        Simulation.id == simulation_id,
        Simulation.user_id == current_user.id
    ).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return {
        "id": simulation.id,
        "title": simulation.scenario_name,
        "goal_id": simulation.goal_id,
        "assumptions": simulation.assumptions if simulation.assumptions else {},
        "results": simulation.results if simulation.results else {},
        "created_at": simulation.created_at.isoformat() if simulation.created_at else None
    }


@app.post("/recommendations/allocate")
def generate_allocation_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    
    total_value = sum(inv.units * inv.last_price for inv in investments if inv.units > 0)
    
    risk_profile_str = current_user.risk_profile.value if hasattr(current_user.risk_profile, 'value') else str(current_user.risk_profile)
    allocation = generate_allocation_recommendation(risk_profile_str, total_value)
    
    recommendation = Recommendation(
        user_id=current_user.id,
        title="Portfolio Allocation Recommendation",
        recommendation_text=f"Based on your {risk_profile_str} risk profile, we suggest the following allocation to optimize returns.",
        suggested_allocation=allocation
    )
    db.add(recommendation)
    db.commit()
    
    return {
        "recommendation_id": recommendation.id,
        "suggested_allocation": allocation,
        "message": "Allocation recommendation created"
    }


@app.post("/recommendations/rebalance")
def generate_rebalance_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    if not investments:
        raise HTTPException(status_code=400, detail="No investments to rebalance")
    
    total_value = sum(inv.units * inv.last_price for inv in investments if inv.units > 0)
    suggestions = []
    
    for inv in investments:
        if inv.units > 0:
            val = inv.units * inv.last_price
            allocation_percent = (val / total_value) * 100 if total_value > 0 else 0
            if allocation_percent > 40:
                suggestions.append({
                    "action": "REDUCE",
                    "symbol": inv.symbol,
                    "reason": f"Concentration risk: {allocation_percent:.1f}%"
                })
    
    recommendation = Recommendation(
        user_id=current_user.id,
        title="Portfolio Rebalancing Suggestion",
        recommendation_text="Review your portfolio for concentration risks.",
        suggested_allocation={"suggestions": suggestions}
    )
    db.add(recommendation)
    db.commit()
    
    return {
        "recommendation_id": recommendation.id,
        "suggestions": suggestions,
        "total_portfolio_value": round(total_value, 2)
    }


@app.get("/recommendations")
def list_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommendations = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id
    ).order_by(Recommendation.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "text": r.recommendation_text,
            "suggested_allocation": r.suggested_allocation,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in recommendations
    ]


@app.put("/recommendations/{recommendation_id}/mark-read")
def mark_recommendation_read(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == current_user.id
    ).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    recommendation.is_read = True
    db.commit()
    return {"message": "Recommendation marked as read"}
