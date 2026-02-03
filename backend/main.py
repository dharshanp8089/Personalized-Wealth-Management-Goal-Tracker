from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import SessionLocal
from models import User
from utils import hash_password, verify_password
from models import Goal
from datetime import datetime
from models import Investment, Transaction
from fastapi.middleware.cors import CORSMiddleware

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str





# ---------------- APP ----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],   # VERY IMPORTANT
    allow_headers=["*"],   # VERY IMPORTANT
)


# ---------------- JWT CONFIG ----------------
SECRET_KEY = "secret123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

security = HTTPBearer()

# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- SCHEMAS ----------------
class LoginRequest(BaseModel):
    email: str
    password: str

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"message": "Wealth Tracker Backend Running"}

# ---------------- REGISTER ----------------
@app.post("/register")
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
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
@app.post("/register")
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
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

# ---------------- LOGIN ----------------
@app.post("/login")
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    expire = datetime.utcnow() + timedelta(hours=24)

    token = jwt.encode(
        {"sub": user.email, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {"access_token": token}


# ---------------- AUTH HELPER ----------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
# -------- GOAL FINANCIAL HELPERS --------

def calculate_months(start_date: str, end_date: str):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    return (end.year - start.year) * 12 + (end.month - start.month)


def calculate_required_monthly(target_amount: float, months: int):
    if months <= 0:
        return 0
    return round(target_amount / months, 2)


def calculate_completion(current_amount: float, target_amount: float):
    if target_amount == 0:
        return 0
    return round((current_amount / target_amount) * 100, 2)


# ---------------- GET PROFILE ----------------
@app.get("/me")
def get_logged_in_user(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "risk_profile": current_user.risk_profile,
        "kyc_status": current_user.kyc_status
    }


# ---------------- UPDATE PROFILE ----------------
@app.put("/me")
def update_profile(
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = name
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "name": current_user.name
    }

# ---------------- RISK LOGIC ----------------
def calculate_risk_profile(score: int):
    if score <= 10:
        return "conservative"
    elif score <= 18:
        return "moderate"
    else:
        return "aggressive"

# ---------------- RISK PROFILING ----------------
@app.post("/risk-profile")
def submit_risk_profile(
    q1: int,
    q2: int,
    q3: int,
    q4: int,
    q5: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_score = q1 + q2 + q3 + q4 + q5
    risk = calculate_risk_profile(total_score)

    current_user.risk_profile = risk
    db.commit()

    return {
        "total_score": total_score,
        "risk_profile": risk
    }

# ---------------- KYC VERIFY ----------------
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
    title: str,
    target_amount: float,
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = Goal(
        user_id=current_user.id,
        title=title,
        target_amount=target_amount,
        start_date=start_date,
        end_date=end_date
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return {
        "message": "Goal created successfully",
        "goal_id": goal.id
    }
@app.get("/goals")
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id
    ).all()

    return goals

@app.put("/goals/{goal_id}")
def update_goal(
    goal_id: int,
    title: str,
    target_amount: float,
    end_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.title = title
    goal.target_amount = target_amount
    goal.end_date = end_date

    db.commit()
    db.refresh(goal)

    return {
        "message": "Goal updated successfully",
        "goal_id": goal.id
    }
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

    return {
        "message": "Goal deleted successfully"
    }
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

    months = calculate_months(goal.start_date, goal.end_date)
    required_monthly = calculate_required_monthly(goal.target_amount, months)
    completion = calculate_completion(goal.current_amount, goal.target_amount)

    return {
        "goal_id": goal.id,
        "duration_months": months,
        "required_monthly_investment": required_monthly,
        "current_amount": goal.current_amount,
        "target_amount": goal.target_amount,
        "completion_percentage": completion
    }
@app.post("/portfolio/buy")
def buy_investment(
    asset_name: str,
    units: float,
    price_per_unit: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    amount = units * price_per_unit

    # Check if investment already exists
    investment = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.asset_name == asset_name
    ).first()

    # If not, create new investment
    if not investment:
        investment = Investment(
            user_id=current_user.id,
            asset_name=asset_name,
            total_units=0,
            total_invested=0
        )
        db.add(investment)
        db.commit()
        db.refresh(investment)

    # Update holdings
    investment.total_units += units
    investment.total_invested += amount

    # Create transaction (immutable)
    transaction = Transaction(
        investment_id=investment.id,
        transaction_type="BUY",
        units=units,
        price_per_unit=price_per_unit,
        amount=amount
    )

    db.add(transaction)
    db.commit()

    return {
        "message": "Buy transaction successful",
        "asset_name": investment.asset_name,
        "units_held": investment.total_units,
        "total_invested": investment.total_invested
    }
@app.post("/portfolio/sell")
def sell_investment(
    asset_name: str,
    units: float,
    price_per_unit: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.asset_name == asset_name
    ).first()

    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    if units > investment.total_units:
        raise HTTPException(
            status_code=400,
            detail="Not enough units to sell"
        )

    amount = units * price_per_unit

    # Update holdings
    investment.total_units -= units
    investment.total_invested -= amount

    # Create transaction (immutable)
    transaction = Transaction(
        investment_id=investment.id,
        transaction_type="SELL",
        units=units,
        price_per_unit=price_per_unit,
        amount=amount
    )

    db.add(transaction)
    db.commit()

    return {
        "message": "Sell transaction successful",
        "asset_name": investment.asset_name,
        "units_remaining": investment.total_units,
        "total_invested": investment.total_invested
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
        if inv.total_units > 0:
            avg_price = round(inv.total_invested / inv.total_units, 2)
        else:
            avg_price = 0

        portfolio.append({
            "asset_name": inv.asset_name,
            "units_held": inv.total_units,
            "cost_basis": inv.total_invested,
            "average_buy_price": avg_price
        })

    return portfolio
