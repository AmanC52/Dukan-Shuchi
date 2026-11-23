// API Client Module for Dukan Tool
const API = {
  // Products
  async getProducts(search = '', category = 'all') {
    let url = '/api/products?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category && category !== 'all') url += `category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async addProduct(productData) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  async updateProduct(id, productData) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) return [];
    return res.json();
  },

  async bulkImport(rawText) {
    const res = await fetch('/api/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText })
    });
    if (!res.ok) throw new Error('Bulk import failed');
    return res.json();
  },

  // Purchase Trips
  async getTrips() {
    const res = await fetch('/api/trips');
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  async getTripDetail(id) {
    const res = await fetch(`/api/trips/${id}`);
    if (!res.ok) throw new Error('Failed to fetch trip details');
    return res.json();
  },

  async saveTrip(tripData) {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to save trip');
    return data;
  },

  async deleteTrip(id) {
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete trip');
    return res.json();
  },

  // Analytics & Backups
  async getAnalytics() {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async createBackup() {
    const res = await fetch('/api/backup', { method: 'POST' });
    return res.json();
  }
};
