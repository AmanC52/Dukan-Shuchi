from typing import Dict, Any
from backend.database import get_connection

def get_analytics_summary() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    trips_stats = cursor.execute("""
    SELECT 
        COUNT(*) as total_trips,
        COALESCE(SUM(total_purchase_cost), 0.0) as all_time_purchase,
        COALESCE(SUM(total_selling_value), 0.0) as all_time_selling,
        COALESCE(SUM(total_profit), 0.0) as all_time_profit
    FROM purchase_trips
    """).fetchone()

    prod_count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]

    top_items = cursor.execute("""
    SELECT product_name, SUM(quantity) as total_qty, unit, SUM(subtotal_purchase) as total_spent
    FROM trip_items
    GROUP BY product_name
    ORDER BY total_spent DESC
    LIMIT 5
    """).fetchall()

    conn.close()

    all_time_purchase = round(float(trips_stats["all_time_purchase"]), 2)
    all_time_selling = round(float(trips_stats["all_time_selling"]), 2)
    all_time_profit = round(float(trips_stats["all_time_profit"]), 2)
    overall_margin = round((all_time_profit / all_time_selling * 100), 1) if all_time_selling > 0 else 0.0

    return {
        "total_trips": trips_stats["total_trips"],
        "total_products": prod_count,
        "all_time_purchase": all_time_purchase,
        "all_time_selling": all_time_selling,
        "all_time_profit": all_time_profit,
        "overall_margin": overall_margin,
        "top_items": [dict(r) for r in top_items]
    }
