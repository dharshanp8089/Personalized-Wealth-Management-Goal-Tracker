import os
import random
from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
from models import User, Goal, Investment, Transaction, AssetPrice, Simulation, Recommendation
from utils import hash_password

def seed_data():
    db = SessionLocal()
    
    # 1. Create User
    existing_user = db.query(User).filter(User.email == "demo@wealth.local").first()
    if existing_user:
        print("Demo user already exists.")
        return

    demo_user = User(
        name="Demo Strategist",
        email="demo@wealth.local",
        password=hash_password("password123"),
        risk_profile="moderate",
        kyc_status="verified"
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    print("Created Demo User: demo@wealth.local / password123")

    # 2. Create Goal
    demo_goal = Goal(
        user_id=demo_user.id,
        goal_type="home",
        title="Luxury Villa Fund",
        target_amount=15000000,
        target_date=datetime.utcnow() + timedelta(days=5*365),
        monthly_contribution=50000,
        status="active"
    )
    db.add(demo_goal)
    db.commit()
    db.refresh(demo_goal)

    # 3. Add Market Prices
    prices = [
        AssetPrice(asset_name="aapl", current_price=175.50, price_change_percent=1.2),
        AssetPrice(asset_name="spy", current_price=510.20, price_change_percent=-0.3),
        AssetPrice(asset_name="tcs", current_price=4100.00, price_change_percent=2.1),
    ]
    db.add_all(prices)
    db.commit()

    # 4. Add Investments
    inv1 = Investment(user_id=demo_user.id, goal_id=demo_goal.id, asset_type="stock", symbol="AAPL", units=150, avg_buy_price=150.0, cost_basis=22500, current_value=26325, last_price=175.50)
    inv2 = Investment(user_id=demo_user.id, goal_id=demo_goal.id, asset_type="etf", symbol="SPY", units=50, avg_buy_price=480.0, cost_basis=24000, current_value=25510, last_price=510.20)
    db.add_all([inv1, inv2])
    db.commit()

    # 5. Add Transactions
    tx1 = Transaction(user_id=demo_user.id, symbol="AAPL", type="buy", quantity=150, price=150.0, fees=5)
    tx2 = Transaction(user_id=demo_user.id, symbol="SPY", type="buy", quantity=50, price=480.0, fees=10)
    db.add_all([tx1, tx2])
    db.commit()

    # 6. Add AI Recommendation
    rec = Recommendation(
        user_id=demo_user.id,
        title="Portfolio Diversification Alert",
        recommendation_text="Your portfolio is heavily skewed towards US Equities. We recommend diversifying into emerging markets or bonds to match your moderate risk profile.",
        suggested_allocation={"allocation": {"us_equities": 40, "emerging_markets": 20, "bonds": 30, "cash": 10}}
    )
    db.add(rec)
    db.commit()

    print("Successfully seeded the database with live data!")
    db.close()

if __name__ == "__main__":
    seed_data()
