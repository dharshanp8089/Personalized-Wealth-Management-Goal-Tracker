import os
from celery import Celery
from celery.schedules import crontab
from database import SessionLocal
from models import Investment, AssetPrice
import yfinance as yf
from datetime import datetime

# Initialize Celery app
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery(
    "wealth_tracker_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.timezone = "UTC"

# Schedule the task to run nightly at midnight UTC
celery_app.conf.beat_schedule = {
    "sync-market-prices-nightly": {
        "task": "tasks.sync_all_market_prices",
        "schedule": crontab(hour=0, minute=0),
    }
}

@celery_app.task(name="tasks.sync_all_market_prices")
def sync_all_market_prices():
    """
    Fetches real-time or latest closing prices for all unique investment symbols
    in the database using Yahoo Finance, and updates the Investment records.
    """
    db = SessionLocal()
    try:
        # Get all unique symbols from active investments
        investments = db.query(Investment).filter(Investment.units > 0).all()
        symbols = list(set([inv.symbol.upper() for inv in investments]))
        
        if not symbols:
            return "No active investments to sync."
            
        updated_count = 0
        
        # Batch download for efficiency using yfinance
        # yf.download returns a DataFrame. If multiple symbols, columns are MultiIndex.
        tickers_data = yf.download(" ".join(symbols), period="1d", group_by="ticker")
        
        prices_map = {}
        for symbol in symbols:
            try:
                if len(symbols) == 1:
                    # Single symbol case
                    last_price = tickers_data['Close'].iloc[-1]
                else:
                    # Multi symbol case
                    last_price = tickers_data[symbol]['Close'].iloc[-1]
                
                # Convert to float (handle numpy/pandas primitives)
                prices_map[symbol] = float(last_price)
            except Exception as e:
                print(f"Failed to fetch price for {symbol}: {e}")
                
        # Update the database records
        for inv in investments:
            sym = inv.symbol.upper()
            if sym in prices_map and not isinstance(prices_map[sym], type(None)):
                inv.last_price = prices_map[sym]
                inv.current_value = round(inv.units * inv.last_price, 2)
                inv.last_price_at = datetime.utcnow()
                updated_count += 1
                
        db.commit()
        return f"Successfully synced prices for {updated_count} investment holdings."
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
