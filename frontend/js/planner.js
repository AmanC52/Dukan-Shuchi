// Tab 1: Purchasing Planner & Checklist Logic

const PlannerModule = {
  init() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('tripDate');
    if (dateInput) dateInput.value = today;
  },

  renderCategories() {
    const container = document.getElementById('plannerCategoryPills');
    if (!container) return;

    let html = `
      <button onclick="PlannerModule.setCategory('all')" class="cat-pill ${Store.selectedPlannerCategory === 'all' ? 'active' : ''}">
        सभी (All)
      </button>
    `;

    Store.categories.forEach(cat => {
      const isSel = Store.selectedPlannerCategory === cat;
      html += `
        <button onclick="PlannerModule.setCategory('${cat}')" class="cat-pill ${isSel ? 'active' : ''}">
          ${cat}
        </button>
      `;
    });
    container.innerHTML = html;
  },

  setCategory(cat) {
    Store.selectedPlannerCategory = cat;
    this.renderCategories();
    this.renderTable();
  },

  clearSearch() {
    const input = document.getElementById('plannerSearch');
    if (input) {
      input.value = '';
      document.getElementById('clearPlannerSearchBtn')?.classList.add('hidden');
      this.renderTable();
    }
  },

  filterSearch() {
    const input = document.getElementById('plannerSearch');
    const clearBtn = document.getElementById('clearPlannerSearchBtn');
    if (input.value.trim().length > 0) {
      clearBtn?.classList.remove('hidden');
    } else {
      clearBtn?.classList.add('hidden');
    }
    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('plannerTableBody');
    const cardsContainer = document.getElementById('plannerMobileCards');
    const emptyState = document.getElementById('plannerEmptyState');
    const searchTxt = (document.getElementById('plannerSearch')?.value || '').toLowerCase().trim();

    if (!tbody) return;

    const filtered = Store.products.filter(p => {
      const matchesSearch = !searchTxt ||
        p.name.toLowerCase().includes(searchTxt) ||
        (p.category && p.category.toLowerCase().includes(searchTxt)) ||
        (p.notes && p.notes.toLowerCase().includes(searchTxt));

      const matchesCat = Store.selectedPlannerCategory === 'all' || p.category === Store.selectedPlannerCategory;
      return matchesSearch && matchesCat;
    });

    const countBadge = document.getElementById('plannerTotalCountBadge');
    if (countBadge) countBadge.innerText = `${filtered.length} सामान`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (cardsContainer) cardsContainer.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }
    emptyState?.classList.add('hidden');

    let rowsHtml = '';
    let cardsHtml = '';

    filtered.forEach(p => {
      Store.initPlannerItem(p.id);
      const state = Store.plannerState[p.id];
      const isChecked = state.checked;
      const qty = state.qty || 1;
      const subtotalP = (p.purchase_price * qty).toFixed(2);
      const subtotalS = (p.selling_price * qty).toFixed(2);
      const profit = (subtotalS - subtotalP).toFixed(2);
      const margin = p.selling_price > 0 ? ((p.profit_per_unit / p.selling_price) * 100).toFixed(1) : 0;
      const subQty = p.sub_quantity || 1;
      const subUnit = p.sub_unit || 'पीस';
      const unitBuy = (p.unit_purchase_price || (p.purchase_price / subQty)).toFixed(2);

      // 1. Desktop Table Row
      rowsHtml += `
        <tr class="${isChecked ? 'row-checked' : ''}">
          <td style="text-align: center;">
            <input type="checkbox" 
              onchange="PlannerModule.toggleCheck(${p.id}, this.checked)" 
              ${isChecked ? 'checked' : ''} 
              style="width: 18px; height: 18px; cursor: pointer; accent-color: #2563eb;">
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">
              ${p.name}
              <span class="badge badge-blue" style="margin-left: 6px;">${p.unit || 'पेटी'}</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              1 पैक = <strong>${subQty} ${subUnit}</strong>
              ${p.retail_selling_price ? ` | फुटकर बिक्री: <strong style="color: #059669;">₹${p.retail_selling_price.toFixed(2)} /${subUnit}</strong>` : ''}
            </div>
          </td>
          <td>
            <span class="badge badge-slate">${p.category || 'सामान्य'}</span>
          </td>
          <td style="text-align: right;">
            <div style="font-weight: 700; color: #2563eb;">₹${p.purchase_price.toFixed(2)}</div>
            <div style="font-size: 10px; color: #94a3b8;">₹${unitBuy} /${subUnit}</div>
          </td>
          <td style="text-align: right;">
            <div style="font-weight: 700; color: #0f172a;">₹${p.selling_price.toFixed(2)}</div>
            <div style="font-size: 10px; color: #059669; font-weight: 600;">₹${(p.retail_selling_price || 0).toFixed(2)} /${subUnit}</div>
          </td>
          <td style="text-align: center;">
            <div class="qty-stepper">
              <button class="stepper-btn" onclick="PlannerModule.adjustQty(${p.id}, -1)">−</button>
              <input type="number" min="0.1" step="any" value="${qty}" onchange="PlannerModule.setQty(${p.id}, this.value)" class="stepper-input">
              <button class="stepper-btn" onclick="PlannerModule.adjustQty(${p.id}, 1)">+</button>
            </div>
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; color: ${isChecked ? '#1d4ed8' : '#64748b'};">
            ₹${subtotalP}
          </td>
          <td style="text-align: right;">
            <span style="font-weight: 800; color: #059669;">+₹${profit}</span>
            <span class="badge badge-green" style="font-size: 10px; margin-left: 4px;">${margin}%</span>
          </td>
        </tr>
      `;

      // 2. Dedicated Mobile Card View
      cardsHtml += `
        <div class="mobile-item-card ${isChecked ? 'is-selected' : ''}">
          <div class="mobile-card-top">
            <label class="mobile-card-title-group">
              <input type="checkbox" onchange="PlannerModule.toggleCheck(${p.id}, this.checked)" ${isChecked ? 'checked' : ''} class="mobile-check-box">
              <div>
                <span class="mobile-prod-name">${p.name}</span>
                <span class="badge badge-blue" style="margin-left: 4px;">${p.unit || 'पेटी'}</span>
              </div>
            </label>
            <span class="badge badge-slate">${p.category || 'सामान्य'}</span>
          </div>

          <div class="mobile-pack-info">
            <span>📦 1 पैक = <strong>${subQty} ${subUnit}</strong></span>
            ${p.retail_selling_price ? `<span style="color: #059669; font-weight: 700;">फुटकर: ₹${p.retail_selling_price.toFixed(2)}/${subUnit}</span>` : ''}
          </div>

          <div class="mobile-rates-grid">
            <div class="rate-cell">
              <span class="rate-lbl">थोक खरीद</span>
              <span class="rate-val buy">₹${p.purchase_price.toFixed(2)}</span>
            </div>
            <div class="rate-cell">
              <span class="rate-lbl">संभावित बिक्री</span>
              <span class="rate-val sell">₹${p.selling_price.toFixed(2)}</span>
            </div>
            <div class="rate-cell">
              <span class="rate-lbl">मुनाफा</span>
              <span class="rate-val profit">+₹${profit} (${margin}%)</span>
            </div>
          </div>

          <div class="mobile-card-bottom">
            <div class="qty-stepper">
              <button class="stepper-btn" onclick="PlannerModule.adjustQty(${p.id}, -1)">−</button>
              <input type="number" min="0.1" step="any" value="${qty}" onchange="PlannerModule.setQty(${p.id}, this.value)" class="stepper-input">
              <button class="stepper-btn" onclick="PlannerModule.adjustQty(${p.id}, 1)">+</button>
            </div>
            <div class="mobile-subtotal">
              <div class="mobile-subtotal-lbl">कुल खरीद</div>
              <div class="mobile-subtotal-val">₹${subtotalP}</div>
            </div>
          </div>
        </div>
      `;
    });

    tbody.innerHTML = rowsHtml;
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
  },

  toggleCheck(id, checked) {
    Store.initPlannerItem(id);
    Store.plannerState[id].checked = checked;
    this.updateSummary();
    this.renderTable();
  },

  adjustQty(id, delta) {
    Store.initPlannerItem(id);
    let newQty = Math.max(1, (Store.plannerState[id].qty || 1) + delta);
    Store.plannerState[id].qty = newQty;
    Store.plannerState[id].checked = true;
    this.updateSummary();
    this.renderTable();
  },

  setQty(id, val) {
    let num = parseFloat(val);
    if (isNaN(num) || num <= 0) num = 1;
    Store.initPlannerItem(id);
    Store.plannerState[id].qty = num;
    Store.plannerState[id].checked = true;
    this.updateSummary();
    this.renderTable();
  },

  selectAll(checked) {
    Store.products.forEach(p => {
      Store.initPlannerItem(p.id);
      Store.plannerState[p.id].checked = checked;
    });
    this.renderTable();
    this.updateSummary();
  },

  updateSummary() {
    let selectedCount = 0;
    let totalPurchase = 0;
    let totalSelling = 0;

    Store.products.forEach(p => {
      const state = Store.plannerState[p.id];
      if (state && state.checked) {
        selectedCount++;
        const qty = state.qty || 1;
        totalPurchase += (p.purchase_price * qty);
        totalSelling += (p.selling_price * qty);
      }
    });

    const totalProfit = totalSelling - totalPurchase;

    const countEl = document.getElementById('barSelectedCount');
    const costEl = document.getElementById('barPurchaseCost');
    const profitEl = document.getElementById('barProfit');

    if (countEl) countEl.innerText = `${selectedCount} सामान`;
    if (costEl) costEl.innerText = `₹${totalPurchase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (profitEl) profitEl.innerText = `₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const saveBtn = document.getElementById('saveTripBtn');
    if (saveBtn) {
      saveBtn.disabled = selectedCount === 0;
      saveBtn.style.opacity = selectedCount === 0 ? '0.6' : '1';
    }
  },

  openBillModal() {
    const today = document.getElementById('tripDate')?.value || new Date().toISOString().split('T')[0];
    const mandi = document.getElementById('tripTitle')?.value || 'सदर मंडी खरीदारी';

    const slipDate = document.getElementById('billSlipDate');
    const slipTitle = document.getElementById('billSlipTitle');
    if (slipDate) slipDate.innerText = today;
    if (slipTitle) slipTitle.innerText = mandi;

    const tbody = document.getElementById('billModalTableBody');
    if (!tbody) return;

    let html = '';
    let itemsCount = 0;
    let totalPurchase = 0;
    let totalSelling = 0;

    Store.products.forEach(p => {
      const state = Store.plannerState[p.id];
      if (state && state.checked) {
        itemsCount++;
        const qty = parseFloat(state.qty) || 1;
        const subtotalP = p.purchase_price * qty;
        const subtotalS = p.selling_price * qty;
        const profit = subtotalS - subtotalP;

        totalPurchase += subtotalP;
        totalSelling += subtotalS;

        html += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; text-align: left;">
              <strong style="color: #0f172a; font-size: 13px;">${p.name}</strong>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${p.unit || 'पेटी'} (${p.sub_quantity || 1} ${p.sub_unit || 'पीस'})
              </div>
            </td>
            <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: #0f172a;">
              ${qty}
            </td>
            <td style="padding: 10px 8px; text-align: right; color: #64748b;">
              ₹${p.purchase_price.toFixed(2)}
            </td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #2563eb;">
              ₹${subtotalP.toFixed(2)}
            </td>
            <td style="padding: 10px 8px; text-align: right; color: #334155;">
              ₹${subtotalS.toFixed(2)}
            </td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #059669;">
              +₹${profit.toFixed(2)}
            </td>
          </tr>
        `;
      }
    });

    if (itemsCount === 0) {
      html = `
        <tr>
          <td colspan="6" style="padding: 30px 12px; text-align: center; color: #64748b;">
            <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
            <strong style="font-size: 15px; color: #0f172a; display: block; margin-bottom: 4px;">कोई सामान चुना नहीं गया है</strong>
            <span style="font-size: 12px; color: #94a3b8;">
              कृपया पहले चेकलिस्ट में सामान के आगे दिए टिक (Checkbox) पर क्लिक करके सामान चुनें।
            </span>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = html;

    const totalProfit = totalSelling - totalPurchase;
    const marginPercent = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : 0;

    const itemsCountEl = document.getElementById('billTotalItemsCount');
    const pCostEl = document.getElementById('billTotalPurchaseCost');
    const sValueEl = document.getElementById('billTotalSellingValue');
    const profitEl = document.getElementById('billTotalProfit');
    const marginEl = document.getElementById('billMarginPercent');

    if (itemsCountEl) itemsCountEl.innerText = `${itemsCount} प्रकार का सामान`;
    if (pCostEl) pCostEl.innerText = `₹${totalPurchase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (sValueEl) sValueEl.innerText = `₹${totalSelling.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (profitEl) profitEl.innerText = `+₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (marginEl) marginEl.innerText = `${marginPercent}% मार्जिन`;

    const modal = document.getElementById('billModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeBillModal() {
    document.getElementById('billModal').classList.add('hidden');
  },

  async saveTrip() {
    const tripDate = document.getElementById('tripDate').value;
    const title = document.getElementById('tripTitle').value.trim() || 'मंडी खरीदारी';

    const selectedItems = [];
    Store.products.forEach(p => {
      const state = Store.plannerState[p.id];
      if (state && state.checked) {
        selectedItems.push({
          product_id: p.id,
          product_name: p.name,
          category: p.category || 'किराना',
          quantity: state.qty || 1,
          unit: p.unit || 'पेटी',
          purchase_price: p.purchase_price,
          selling_price: p.selling_price
        });
      }
    });

    if (selectedItems.length === 0) {
      App.showToast('कृपया पहले सामान चेकलिस्ट में चुनें', 'warning');
      return;
    }

    try {
      const payload = {
        trip_date: tripDate,
        title: title,
        items: selectedItems
      };
      await API.saveTrip(payload);
      App.showToast('खरीदारी का रिकॉर्ड सफलतापूर्वक सुरक्षित हो गया!', 'success');
      await HistoryModule.load();
      await App.refreshProducts();
    } catch (err) {
      App.showToast('रिकॉर्ड सेव नहीं हो सका: ' + err.message, 'error');
    }
  }
};

if (typeof window !== 'undefined') {
  window.PlannerModule = PlannerModule;
}

