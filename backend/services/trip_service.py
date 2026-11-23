from typing import List, Optional, Dict, Any
from backend.database import get_connection
from backend.models.trip import TripCreate

def get_all_trips() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("""
    SELECT * FROM purchase_trips 
    ORDER BY trip_date DESC, id DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_trip_detail(trip_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    trip_row = conn.execute("SELECT * FROM purchase_trips WHERE id = ?", (trip_id,)).fetchone()
    if not trip_row:
        conn.close()
        return None

    items_rows = conn.execute("""
    SELECT * FROM trip_items WHERE trip_id = ? ORDER BY id ASC
    """, (trip_id,)).fetchall()
    conn.close()

    res = dict(trip_row)
    res["items"] = [dict(it) for it in items_rows]
    return res

def create_purchase_trip(trip: TripCreate) -> Dict[str, Any]:
    total_purchase_cost = 0.0
    total_selling_value = 0.0
    calculated_items = []

    for it in trip.items:
        qty = float(it.quantity)
        p_price = float(it.purchase_price)
        s_price = float(it.selling_price)
        sub_p = round(qty * p_price, 2)
        sub_s = round(qty * s_price, 2)
        profit = round(sub_s - sub_p, 2)

        total_purchase_cost += sub_p
        total_selling_value += sub_s

        calculated_items.append((
            it.product_id,
            it.product_name,
            it.category or "",
            it.unit or "पीस",
            qty,
            p_price,
            s_price,
            sub_p,
            sub_s,
            profit
        ))

    total_purchase_cost = round(total_purchase_cost, 2)
    total_selling_value = round(total_selling_value, 2)
    total_profit = round(total_selling_value - total_purchase_cost, 2)
    margin_percent = round((total_profit / total_selling_value * 100), 1) if total_selling_value > 0 else 0.0

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO purchase_trips (
        trip_date, title, total_items, total_purchase_cost, total_selling_value, total_profit, margin_percent, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        trip.trip_date,
        trip.title or f"खरीदारी - {trip.trip_date}",
        len(calculated_items),
        total_purchase_cost,
        total_selling_value,
        total_profit,
        margin_percent,
        trip.notes or ""
    ))
    trip_id = cursor.lastrowid

    items_with_trip_id = [(trip_id, *c) for c in calculated_items]
    cursor.executemany("""
    INSERT INTO trip_items (
        trip_id, product_id, product_name, category, unit, quantity, purchase_price, selling_price, subtotal_purchase, subtotal_selling, profit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, items_with_trip_id)

    conn.commit()
    conn.close()

    return {
        "id": trip_id,
        "trip_date": trip.trip_date,
        "title": trip.title or f"खरीदारी - {trip.trip_date}",
        "total_items": len(calculated_items),
        "total_purchase_cost": total_purchase_cost,
        "total_selling_value": total_selling_value,
        "total_profit": total_profit,
        "margin_percent": margin_percent,
        "notes": trip.notes or ""
    }

def delete_purchase_trip(trip_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM purchase_trips WHERE id = ?", (trip_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
