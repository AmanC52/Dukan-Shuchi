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
        <div class="card card-padding" style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge badge-blue">
                  📅 ${t.trip_date} (${dateFormatted})
                </span>
                <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 6px;">${t.title || 'खरीदारी'}</h3>
              </div>
              <span class="badge badge-slate">
                ${t.total_items} आइटम्स
              </span>
            </div>

            <div class="grid-cols-2" style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 12px;">
              <div style="background: #f8fafc; padding: 10px; border-radius: 10px;">
                <span style="color: #64748b; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700;">कुल खरीद</span>
                <strong style="font-size: 15px; color: #2563eb;">₹${t.total_purchase_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style="background: #ecfdf5; padding: 10px; border-radius: 10px;">
                <span style="color: #059669; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700;">शुद्ध मुनाफा</span>
                <strong style="font-size: 15px; color: #059669;">+₹${t.total_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px;">
            <span class="badge badge-green">
              ${t.margin_percent}% मार्जिन
            </span>
            <button onclick="HistoryModule.openDetailModal(${t.id})" class="btn btn-outline btn-sm">
              📄 पर्ची देखें
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
        <div style="background: #eff6ff; padding: 10px; border-radius: 10px;">
          <span style="font-size: 11px; color: #2563eb; display: block; font-weight: 700;">कुल खरीद लागत</span>
          <strong style="font-size: 16px; color: #1d4ed8;">₹${Store.activeTrip.total_purchase_cost.toLocaleString('en-IN')}</strong>
        </div>
        <div style="background: #f5f3ff; padding: 10px; border-radius: 10px;">
          <span style="font-size: 11px; color: #7c3aed; display: block; font-weight: 700;">संभावित बिक्री राशि</span>
          <strong style="font-size: 16px; color: #6d28d9;">₹${Store.activeTrip.total_selling_value.toLocaleString('en-IN')}</strong>
        </div>
        <div style="background: #ecfdf5; padding: 10px; border-radius: 10px;">
          <span style="font-size: 11px; color: #059669; display: block; font-weight: 700;">शुद्ध लाभ (${Store.activeTrip.margin_percent}%)</span>
          <strong style="font-size: 16px; color: #047857;">+₹${Store.activeTrip.total_profit.toLocaleString('en-IN')}</strong>
        </div>
      `;

      let rowsHtml = '';
      Store.activeTrip.items.forEach(it => {
        rowsHtml += `
          <tr>
            <td style="font-weight: 700; color: #0f172a;">${it.product_name}</td>
            <td style="text-align: center; font-weight: 700;">${it.quantity} ${it.unit || ''}</td>
            <td style="text-align: right;">₹${it.purchase_price.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 700; color: #2563eb;">₹${it.subtotal_purchase.toFixed(2)}</td>
            <td style="text-align: right;">₹${it.selling_price.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 700; color: #059669;">+₹${it.profit.toFixed(2)}</td>
          </tr>
        `;
      });
      document.getElementById('histDetailTableBody').innerHTML = rowsHtml;

      document.getElementById('historyDetailModal').classList.remove('hidden');
    } catch (err) {
      App.showToast('विवरण लोड नहीं हो सका: ' + err.message, 'error');
    }
  },

  closeDetailModal() {
    document.getElementById('historyDetailModal').classList.add('hidden');
  },

  reorderTrip() {
    if (!Store.activeTrip) return;
    Store.activeTrip.items.forEach(it => {
      Store.initPlannerItem(it.product_id);
      Store.plannerState[it.product_id].checked = true;
      Store.plannerState[it.product_id].qty = it.quantity;
    });

    document.getElementById('tripTitle').value = `${Store.activeTrip.title} (दोबारा)`;
    this.closeDetailModal();
    App.switchTab('planner');
    App.showToast('पिछली खरीदारी चेकलिस्ट में लोड कर दी गई है!', 'success');
  },

  async deleteTrip() {
    if (!Store.activeTrip) return;
    if (!confirm(`क्या आप ${Store.activeTrip.trip_date} का यह खरीदारी रिकॉर्ड हटाना चाहते हैं?`)) return;

    try {
      await API.deleteTrip(Store.activeTrip.id);
      App.showToast('रिकॉर्ड हटा दिया गया', 'success');
      this.closeDetailModal();
      await this.load();
      await ReportsModule.load();
    } catch (err) {
      App.showToast('त्रुटि: ' + err.message, 'error');
    }
  },

  getActiveTripBillData() {
    if (!Store.activeTrip) return null;
    const t = Store.activeTrip;
    const items = (t.items || []).map(it => ({
      name: it.product_name,
      unit: it.unit || 'पेटी',
      sub_info: '',
      quantity: it.quantity,
      purchase_price: it.purchase_price,
      selling_price: it.selling_price,
      subtotal_purchase: it.subtotal_purchase || (it.purchase_price * it.quantity),
      subtotal_selling: it.subtotal_selling || (it.selling_price * it.quantity),
      profit: it.profit || ((it.selling_price - it.purchase_price) * it.quantity)
    }));

    return {
      trip_date: t.trip_date,
      title: t.title || 'मंडी खरीदारी',
      items: items,
      total_items: t.total_items || items.length,
      total_purchase: t.total_purchase_cost,
      total_selling: t.total_selling_value,
      total_profit: t.total_profit,
      margin_percent: t.margin_percent
    };
  },

  printTrip() {
    const data = this.getActiveTripBillData();
    if (!data) return;
    const html = PrintHelper.generateReceiptHtml(data);
    PrintHelper.printHtml(html);
  },

  shareWhatsApp() {
    const data = this.getActiveTripBillData();
    if (!data) return;
    PrintHelper.shareWhatsApp(data);
  },

  copyTripText() {
    const data = this.getActiveTripBillData();
    if (!data) return;
    PrintHelper.copyText(data);
  },

  shareMobile() {
    const data = this.getActiveTripBillData();
    if (!data) return;
    PrintHelper.shareMobile(data);
  }
};

if (typeof window !== 'undefined') {
  window.HistoryModule = HistoryModule;
}

