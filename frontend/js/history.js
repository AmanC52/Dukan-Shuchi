// Tab 3: Purchase Trip History by Date

const HistoryModule = {
  async load() {
    try {
      Store.trips = await API.getTrips();
      this.render();
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  },

  filter() {
    this.render();
  },

  render() {
    const container = document.getElementById('historyListContainer');
    const emptyState = document.getElementById('historyEmptyState');
    const search = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();

    if (!container) return;

    const filtered = Store.trips.filter(t => {
      return !search ||
        t.trip_date.includes(search) ||
        (t.title && t.title.toLowerCase().includes(search));
    });

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }
    emptyState?.classList.add('hidden');

    let html = '';
    filtered.forEach(t => {
      const d = new Date(t.trip_date);
      const dateFormatted = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      html += `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex justify-between items-start">
              <div>
                <span class="inline-flex items-center text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                  <i class="fa-regular fa-calendar-check mr-1.5"></i> ${t.trip_date} (${dateFormatted})
                </span>
                <h3 class="text-base font-bold text-slate-900 mt-2">${t.title || 'खरीदारी'}</h3>
              </div>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                ${t.total_items} आइटम्स
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div class="bg-slate-50 p-2.5 rounded-xl">
                <span class="text-slate-500 block">कुल खरीद (Invested)</span>
                <span class="text-sm font-extrabold text-blue-600">₹${t.total_purchase_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="bg-emerald-50/60 p-2.5 rounded-xl">
                <span class="text-emerald-700 block font-medium">अनुमानित मुनाफा</span>
                <span class="text-sm font-extrabold text-emerald-600">+₹${t.total_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              ${t.margin_percent}% मार्जिन
            </span>
            <button onclick="HistoryModule.openDetailModal(${t.id})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1">
              <i class="fa-solid fa-file-invoice"></i>
              <span>पूरी पर्ची देखें</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  async openDetailModal(tripId) {
    try {
      Store.activeTrip = await API.getTripDetail(tripId);

      document.getElementById('histDetailTitle').innerText = `${Store.activeTrip.title} (${Store.activeTrip.trip_date})`;
      document.getElementById('histDetailSubtitle').innerText = `कुल ${Store.activeTrip.total_items} प्रकार का सामान लाया गया`;

      document.getElementById('histDetailMetrics').innerHTML = `
        <div class="bg-blue-50 p-3 rounded-xl">
          <span class="text-xs text-blue-600 block font-medium">कुल खरीद लागत</span>
          <span class="text-base font-extrabold text-blue-700">₹${Store.activeTrip.total_purchase_cost.toLocaleString('en-IN')}</span>
        </div>
        <div class="bg-purple-50 p-3 rounded-xl">
          <span class="text-xs text-purple-600 block font-medium">संभावित बिक्री राशि</span>
          <span class="text-base font-extrabold text-purple-700">₹${Store.activeTrip.total_selling_value.toLocaleString('en-IN')}</span>
        </div>
        <div class="bg-emerald-50 p-3 rounded-xl">
          <span class="text-xs text-emerald-600 block font-medium">कुल शुद्ध लाभ (${Store.activeTrip.margin_percent}%)</span>
          <span class="text-base font-extrabold text-emerald-700">+₹${Store.activeTrip.total_profit.toLocaleString('en-IN')}</span>
        </div>
      `;

      let rowsHtml = '';
      Store.activeTrip.items.forEach(it => {
        rowsHtml += `
          <tr class="hover:bg-slate-50">
            <td class="py-2 px-3 font-semibold text-slate-800">${it.product_name}</td>
            <td class="py-2 px-3 text-center font-bold text-slate-700">${it.quantity} ${it.unit || ''}</td>
            <td class="py-2 px-3 text-right">₹${it.purchase_price.toFixed(2)}</td>
            <td class="py-2 px-3 text-right font-extrabold text-blue-600">₹${it.subtotal_purchase.toFixed(2)}</td>
            <td class="py-2 px-3 text-right">₹${it.selling_price.toFixed(2)}</td>
            <td class="py-2 px-3 text-right font-bold text-emerald-600">+₹${it.profit.toFixed(2)}</td>
          </tr>
        `;
      });
      document.getElementById('histDetailTableBody').innerHTML = rowsHtml;
      document.getElementById('historyDetailModal').classList.remove('hidden');
    } catch (err) {
      App.showToast('विवरण लोड करने में समस्या: ' + err.message, 'error');
    }
  },

  closeDetailModal() {
    document.getElementById('historyDetailModal').classList.add('hidden');
  },

  reorderTrip() {
    if (!Store.activeTrip || !Store.activeTrip.items) return;

    PlannerModule.selectAll(false);

    Store.activeTrip.items.forEach(it => {
      const prod = Store.products.find(p => p.id === it.product_id || p.name === it.product_name);
      if (prod) {
        Store.plannerState[prod.id] = { checked: true, qty: it.quantity };
      }
    });

    this.closeDetailModal();
    App.switchTab('planner');
    PlannerModule.renderTable();
    PlannerModule.updateSummary();
    App.showToast('पिछली खरीदारी का सामान लिस्ट में लोड कर दिया गया है!', 'success');
  },

  async deleteTrip() {
    if (!Store.activeTrip) return;
    if (!confirm(`क्या आप ${Store.activeTrip.trip_date} का यह खरीदारी रिकॉर्ड हटाना चाहते हैं?`)) return;

    try {
      await API.deleteTrip(Store.activeTrip.id);
      App.showToast('रिकॉर्ड हटा दिया गया', 'success');
      this.closeDetailModal();
      await this.load();
    } catch (err) {
      App.showToast('डिलीट नहीं हुआ: ' + err.message, 'error');
    }
  }
};
