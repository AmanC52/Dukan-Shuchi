// Offline-First Hybrid API Client for Dukan Tool
// Operates seamlessly with backend REST API on PC Desktop,
// and 100% offline via LocalStorage on Mobile APK / Android devices!

const STORAGE_KEYS = {
  PRODUCTS: 'dukan_products_v2',
  TRIPS: 'dukan_trips_v2',
  SYNC_PENDING: 'dukan_sync_pending'
};

// Helper: Normalize product with all calculated wholesale/retail metrics
function normalizeProduct(p) {
  const subQty = parseFloat(p.sub_quantity) || 1;
  const pPrice = parseFloat(p.purchase_price) || 0;
  const rPrice = parseFloat(p.retail_selling_price) || 0;
  const sPrice = parseFloat(p.selling_price) || (subQty * rPrice);
  const unitBuy = subQty > 0 ? (pPrice / subQty) : pPrice;
  const unitProfit = rPrice - unitBuy;
  const totalProfit = sPrice - pPrice;
  const margin = sPrice > 0 ? parseFloat(((totalProfit / sPrice) * 100).toFixed(1)) : 0;

  return {
    id: Number(p.id),
    name: (p.name || '').trim(),
    category: (p.category || 'सामान्य').trim(),
    unit: (p.unit || 'पेटी').trim(),
    sub_quantity: subQty,
    sub_unit: (p.sub_unit || 'पीस').trim(),
    purchase_price: Math.round(pPrice * 100) / 100,
    retail_selling_price: Math.round(rPrice * 100) / 100,
    selling_price: Math.round(sPrice * 100) / 100,
    unit_purchase_price: p.unit_purchase_price != null ? Number(p.unit_purchase_price) : Math.round(unitBuy * 100) / 100,
    unit_profit: p.unit_profit != null ? Number(p.unit_profit) : Math.round(unitProfit * 100) / 100,
    total_profit_per_pack: p.total_profit_per_pack != null ? Number(p.total_profit_per_pack) : Math.round(totalProfit * 100) / 100,
    margin_percent: p.margin_percent != null ? Number(p.margin_percent) : margin,
    notes: (p.notes || '').trim(),
    created_at: p.created_at || new Date().toISOString()
  };
}

// LocalStorage Product Store Helpers
function getStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeProduct);
      }
    }
  } catch (e) {
    console.warn('Error reading stored products:', e);
  }

  // Fallback to pre-bundled seed products
  const seed = (typeof window !== 'undefined' && window.INITIAL_SEED_PRODUCTS) ||
               (typeof INITIAL_SEED_PRODUCTS !== 'undefined' ? INITIAL_SEED_PRODUCTS : null);
  if (Array.isArray(seed) && seed.length > 0) {
    const seeded = seed.map(normalizeProduct);
    saveStoredProducts(seeded);
    return seeded;
  }
  return [];
}

function saveStoredProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

// LocalStorage Trips Helpers
function getStoredTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored trips:', e);
  }
  return [];
}

function saveStoredTrips(trips) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  } catch (e) {
    console.error('Error saving trips to localStorage:', e);
  }
}

// Network fetch wrapper with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

const API = {
  // 1. Products List
  async getProducts(search = '', category = 'all') {
    let serverProducts = null;
    try {
      let url = '/api/products?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (category && category !== 'all') url += `category=${encodeURIComponent(category)}`;
      const res = await fetchWithTimeout(url, {}, 1200);
      if (res.ok) {
        serverProducts = await res.json();
      }
    } catch (_) {
      // Server not reachable (Mobile APK or offline)
    }

    if (serverProducts && Array.isArray(serverProducts)) {
      const normalized = serverProducts.map(normalizeProduct);
      saveStoredProducts(normalized);
      return normalized;
    }

    // Offline / Mobile Fallback
    let list = getStoredProducts();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    return list;
  },

  // 2. Add New Product
  async addProduct(productData) {
    let serverProduct = null;
    try {
      const res = await fetchWithTimeout('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      }, 1500);
      if (res.ok) {
        serverProduct = await res.json();
      }
    } catch (_) {
      // Server not reachable (Mobile APK offline mode)
    }

    const products = getStoredProducts();
    let newProduct;

    if (serverProduct) {
      newProduct = normalizeProduct(serverProduct);
    } else {
      // Generate unique ID locally
      const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const newId = maxId > 0 ? maxId + 1 : Date.now();
      newProduct = normalizeProduct({ ...productData, id: newId });
    }

    const idx = products.findIndex(p => p.id === newProduct.id);
    if (idx >= 0) {
      products[idx] = newProduct;
    } else {
      products.push(newProduct);
    }
    saveStoredProducts(products);
    return newProduct;
  },

  // 3. Update Existing Product
  async updateProduct(id, productData) {
    let serverProduct = null;
    try {
      const res = await fetchWithTimeout(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      }, 1500);
      if (res.ok) {
        serverProduct = await res.json();
      }
    } catch (_) {
      // Offline fallback
    }

    const products = getStoredProducts();
    const updated = normalizeProduct(serverProduct || { ...productData, id: Number(id) });
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx >= 0) {
      products[idx] = updated;
    } else {
      products.push(updated);
    }
    saveStoredProducts(products);
    return updated;
  },

  // 4. Delete Product
  async deleteProduct(id) {
    try {
      await fetchWithTimeout(`/api/products/${id}`, { method: 'DELETE' }, 1200);
    } catch (_) {
      // Offline fallback
    }

    const products = getStoredProducts().filter(p => p.id !== Number(id));
    saveStoredProducts(products);
    return { status: 'success', id };
  },

  // 5. Get Categories
  async getCategories() {
    let serverCats = null;
    try {
      const res = await fetchWithTimeout('/api/categories', {}, 1000);
      if (res.ok) {
        serverCats = await res.json();
      }
    } catch (_) {
      // Offline fallback
    }

    if (Array.isArray(serverCats) && serverCats.length > 0) {
      return serverCats;
    }

    // Extract categories from local products
    const products = getStoredProducts();
    const catSet = new Set();
    products.forEach(p => {
      if (p.category) catSet.add(p.category.trim());
    });
    return Array.from(catSet).sort();
  },

  // 6. Bulk Import
  async bulkImport(rawText) {
    try {
      const res = await fetchWithTimeout('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText })
      }, 2500);
      if (res.ok) {
        const data = await res.json();
        await this.getProducts();
        return data;
      }
    } catch (_) {}
    return { count: 0, items: [] };
  },

  // 7. Get All Purchase Trips
  async getTrips() {
    let serverTrips = null;
    try {
      const res = await fetchWithTimeout('/api/trips', {}, 1200);
      if (res.ok) {
        serverTrips = await res.json();
        saveStoredTrips(serverTrips);
        return serverTrips;
      }
    } catch (_) {}

    return getStoredTrips();
  },

  // 8. Get Single Trip Details
  async getTripDetail(id) {
    try {
      const res = await fetchWithTimeout(`/api/trips/${id}`, {}, 1200);
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    const trips = getStoredTrips();
    const found = trips.find(t => t.id === Number(id));
    if (found) return found;
    throw new Error('Trip not found');
  },

  // 9. Save New Purchase Trip
  async saveTrip(tripData) {
    let serverTrip = null;
    try {
      const res = await fetchWithTimeout('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      }, 2000);
      if (res.ok) {
        serverTrip = await res.json();
      }
    } catch (_) {}

    const trips = getStoredTrips();
    let newTrip;

    if (serverTrip) {
      newTrip = serverTrip;
    } else {
      // Calculate totals for offline storage
      const tripId = Date.now();
      let totalPurchase = 0;
      let totalSelling = 0;
      const processedItems = (tripData.items || []).map(it => {
        const qty = parseFloat(it.quantity) || 1;
        const pPrice = parseFloat(it.purchase_price) || 0;
        const sPrice = parseFloat(it.selling_price) || 0;
        const subP = Math.round(qty * pPrice * 100) / 100;
        const subS = Math.round(qty * sPrice * 100) / 100;
        const prof = Math.round((subS - subP) * 100) / 100;
        totalPurchase += subP;
        totalSelling += subS;
        return {
          product_id: Number(it.product_id),
          product_name: it.product_name,
          category: it.category || 'किराना',
          quantity: qty,
          unit: it.unit || 'पेटी',
          purchase_price: pPrice,
          selling_price: sPrice,
          subtotal_purchase: subP,
          subtotal_selling: subS,
          profit: prof
        };
      });

      const totalProfit = Math.round((totalSelling - totalPurchase) * 100) / 100;
      const margin = totalSelling > 0 ? parseFloat(((totalProfit / totalSelling) * 100).toFixed(1)) : 0;

      newTrip = {
        id: tripId,
        trip_date: tripData.trip_date || new Date().toISOString().split('T')[0],
        title: tripData.title || 'मंडी खरीदारी',
        total_items: processedItems.length,
        total_purchase_cost: Math.round(totalPurchase * 100) / 100,
        total_selling_value: Math.round(totalSelling * 100) / 100,
        total_profit: totalProfit,
        margin_percent: margin,
        created_at: new Date().toISOString(),
        items: processedItems
      };
    }

    trips.unshift(newTrip);
    saveStoredTrips(trips);
    return newTrip;
  },

  // 10. Delete Purchase Trip
  async deleteTrip(id) {
    try {
      await fetchWithTimeout(`/api/trips/${id}`, { method: 'DELETE' }, 1200);
    } catch (_) {}

    const trips = getStoredTrips().filter(t => t.id !== Number(id));
    saveStoredTrips(trips);
    return { status: 'success', id };
  },

  // 11. Reports & Analytics Summary
  async getAnalytics() {
    try {
      const res = await fetchWithTimeout('/api/analytics', {}, 1200);
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    // Offline Calculation from local trips and products
    const trips = getStoredTrips();
    const products = getStoredProducts();

    let allTimeP = 0;
    let allTimeS = 0;
    let allTimeProfit = 0;
    const itemCounts = {};

    trips.forEach(t => {
      allTimeP += (t.total_purchase_cost || 0);
      allTimeS += (t.total_selling_value || 0);
      allTimeProfit += (t.total_profit || 0);

      if (Array.isArray(t.items)) {
        t.items.forEach(it => {
          const name = it.product_name;
          if (!itemCounts[name]) {
            itemCounts[name] = { product_name: name, total_qty: 0, total_spent: 0, unit: it.unit };
          }
          itemCounts[name].total_qty += (it.quantity || 0);
          itemCounts[name].total_spent += (it.subtotal_purchase || 0);
        });
      }
    });

    const overallMargin = allTimeS > 0 ? parseFloat(((allTimeProfit / allTimeS) * 100).toFixed(1)) : 0;
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 5);

    return {
      all_time_purchase: Math.round(allTimeP * 100) / 100,
      all_time_selling: Math.round(allTimeS * 100) / 100,
      all_time_profit: Math.round(allTimeProfit * 100) / 100,
      overall_margin: overallMargin,
      total_trips: trips.length,
      total_products: products.length,
      top_items: topItems
    };
  },

  // 12. Backup
  async createBackup() {
    try {
      const res = await fetchWithTimeout('/api/backup', { method: 'POST' }, 1500);
      if (res.ok) return await res.json();
    } catch (_) {}
    return { status: 'success', message: 'Offline local data persisted safely' };
  }
};

if (typeof window !== 'undefined') {
  window.API = API;
}

