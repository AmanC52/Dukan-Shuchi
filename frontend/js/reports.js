// Tab 4: Reports & Analytics Logic

const ReportsModule = {
  async load() {
    try {
      const data = await API.getAnalytics();

      document.getElementById('analyticsPurchase').innerText = `₹${data.all_time_purchase.toLocaleString('en-IN')}`;
      document.getElementById('analyticsSelling').innerText = `₹${data.all_time_selling.toLocaleString('en-IN')}`;
      document.getElementById('analyticsProfit').innerText = `₹${data.all_time_profit.toLocaleString('en-IN')}`;
      document.getElementById('analyticsMargin').innerText = `${data.overall_margin}%`;
      document.getElementById('analyticsTripsCount').innerText = data.total_trips;
      document.getElementById('analyticsProducts').innerText = data.total_products;

      const topContainer = document.getElementById('analyticsTopItems');
      if (topContainer) {
        if (data.top_items.length === 0) {
          topContainer.innerHTML = `<p class="text-xs text-slate-400 py-3">जब आप खरीदारी सुरक्षित करेंगे, तो सबसे ज्यादा खरीदा गया सामान यहाँ दिखेगा।</p>`;
        } else {
          let html = '';
          data.top_items.forEach((it, i) => {
            html += `
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center space-x-3">
                  <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">${i + 1}</span>
                  <div>
                    <p class="text-sm font-bold text-slate-800">${it.product_name}</p>
                    <p class="text-xs text-slate-500">कुल मात्रा: ${it.total_qty} ${it.unit || ''}</p>
                  </div>
                </div>
                <span class="text-sm font-extrabold text-blue-600">₹${it.total_spent.toLocaleString('en-IN')}</span>
              </div>
            `;
          });
          topContainer.innerHTML = html;
        }
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  }
};
