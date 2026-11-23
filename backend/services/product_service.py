import re
from typing import List, Optional, Dict, Any
from backend.database import get_connection
from backend.models.product import ProductCreate, ProductUpdate

def calculate_metrics(p_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate wholesale and retail metrics, unit rates, profits, and margins."""
    sub_qty = float(p_dict.get("sub_quantity") or 1.0)
    p_price = float(p_dict.get("purchase_price") or 0.0)
    r_price = float(p_dict.get("retail_selling_price") or 0.0)
    s_price = float(p_dict.get("selling_price") or 0.0)

    # If total selling price not explicitly set, calculate from sub_qty * r_price
    if (s_price == 0.0 or s_price < p_price) and r_price > 0.0:
        s_price = round(sub_qty * r_price, 2)
        p_dict["selling_price"] = s_price

    # Wholesale rate per individual piece/pouch
    unit_p_price = round(p_price / sub_qty, 2) if sub_qty > 0 else p_price
    # Retail profit per individual piece/pouch
    unit_profit = round(r_price - unit_p_price, 2) if r_price > 0 else 0.0
    # Total pack profit
    total_profit = round(s_price - p_price, 2)
    # Profit margin %
    margin = round((total_profit / s_price * 100), 1) if s_price > 0 else 0.0

    p_dict["sub_quantity"] = sub_qty
    p_dict["sub_unit"] = p_dict.get("sub_unit") or "पीस"
    p_dict["unit_purchase_price"] = unit_p_price
    p_dict["unit_profit"] = unit_profit
    p_dict["total_profit_per_pack"] = total_profit
    p_dict["profit_per_unit"] = unit_profit if r_price > 0 else total_profit
    p_dict["margin_percent"] = margin
    return p_dict

def get_all_products(search: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR category LIKE ? OR notes LIKE ? OR unit LIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s, s])

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY id DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return [calculate_metrics(dict(r)) for r in rows]

def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    if row:
        return calculate_metrics(dict(row))
    return None

def create_product(product: ProductCreate) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    sub_qty = float(product.sub_quantity or 1.0)
    p_price = float(product.purchase_price or 0.0)
    r_price = float(product.retail_selling_price or 0.0)
    s_price = float(product.selling_price or 0.0)

    if s_price <= 0 and r_price > 0:
        s_price = round(sub_qty * r_price, 2)

    cursor.execute("""
    INSERT INTO products (
        name, category, unit, sub_quantity, sub_unit, purchase_price, retail_selling_price, selling_price, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product.name.strip(),
        (product.category or "किराना / सामान्य").strip(),
        (product.unit or "पेटी").strip(),
        sub_qty,
        (product.sub_unit or "पीस").strip(),
        p_price,
        r_price,
        s_price,
        (product.notes or "").strip()
    ))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return calculate_metrics(dict(row))

def update_product(product_id: int, product: ProductUpdate) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    sub_qty = float(product.sub_quantity or 1.0)
    p_price = float(product.purchase_price or 0.0)
    r_price = float(product.retail_selling_price or 0.0)
    s_price = float(product.selling_price or 0.0)

    if s_price <= 0 and r_price > 0:
        s_price = round(sub_qty * r_price, 2)

    cursor.execute("""
    UPDATE products 
    SET name = ?, category = ?, unit = ?, sub_quantity = ?, sub_unit = ?, purchase_price = ?, retail_selling_price = ?, selling_price = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (
        product.name.strip(),
        (product.category or "किराना / सामान्य").strip(),
        (product.unit or "पेटी").strip(),
        sub_qty,
        (product.sub_unit or "पीस").strip(),
        p_price,
        r_price,
        s_price,
        (product.notes or "").strip(),
        product_id
    ))
    if cursor.rowcount == 0:
        conn.close()
        return None
    conn.commit()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    return calculate_metrics(dict(row))

def delete_product(product_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_all_categories() -> List[str]:
    conn = get_connection()
    rows = conn.execute("""
    SELECT DISTINCT category FROM products 
    WHERE category IS NOT NULL AND category != '' 
    ORDER BY category
    """).fetchall()
    conn.close()
    return [r[0] for r in rows]

def bulk_import_raw(raw_text: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    count = 0

    lines = raw_text.strip().splitlines()
    for line in lines:
        line = line.strip()
        if not line or line.startswith(("#", "---", "===")):
            continue

        if "|" in line:
            parts = [p.strip() for p in line.split("|") if p.strip()]
        elif "\t" in line:
            parts = [p.strip() for p in line.split("\t") if p.strip()]
        elif "," in line and len(line.split(",")) >= 3:
            parts = [p.strip() for p in line.split(",") if p.strip()]
        else:
            parts = []

        if len(parts) >= 2:
            header_words = ["name", "item", "product", "purchase", "selling", "rate", "price", "saman", "khareed"]
            if any(hw in parts[0].lower() or hw in parts[1].lower() for hw in header_words):
                continue

            name = parts[0]
            category = "सामान्य"
            unit = "पैकेट"

            numbers = []
            for p in parts[1:]:
                nums = re.findall(r"[-+]?(?:\d*\.\d+|\d+)", p.replace(",", ""))
                if nums:
                    try:
                        numbers.append(float(nums[0]))
                    except:
                        pass

            if len(numbers) >= 2:
                p_price = numbers[0]
                s_price = numbers[1]
            elif len(numbers) == 1:
                p_price = numbers[0]
                s_price = round(p_price * 1.15, 2)
            else:
                continue

            cursor.execute("""
            INSERT INTO products (
                name, category, unit, sub_quantity, sub_unit, purchase_price, retail_selling_price, selling_price, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, category, unit, 1.0, "पीस", p_price, s_price, s_price, "Bulk Imported"))
            count += 1

    conn.commit()
    conn.close()
    return count
