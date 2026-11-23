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
          topContainer.innerHTML = `<p style="font-size: 13px; color: #94a3b8; padding: 12px 0;">जब आप खरीदारी सुरक्षित करेंगे, तो सबसे ज्यादा खरीदा गया सामान यहाँ दिखेगा।</p>`;
        } else {
          let html = '';
          data.top_items.forEach((it, i) => {
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="width: 26px; height: 26px; border-radius: 50%; background: #fef3c7; color: #b45309; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                    ${i + 1}
                  </span>
                  <div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${it.product_name}</div>
                    <div style="font-size: 11px; color: #64748b;">कुल मात्रा: ${it.total_qty} ${it.unit || ''}</div>
                  </div>
                </div>
                <strong style="font-size: 15px; color: #2563eb;">₹${it.total_spent.toLocaleString('en-IN')}</strong>
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
