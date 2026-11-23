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
      <button onclick="PlannerModule.setCategory('all')" class="category-pill whitespace-nowrap px-3 py-1 rounded-full font-medium transition ${Store.selectedPlannerCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
        सभी (All)
      </button>
    `;

    Store.categories.forEach(cat => {
      const isSel = Store.selectedPlannerCategory === cat;
      html += `
        <button onclick="PlannerModule.setCategory('${cat}')" class="category-pill whitespace-nowrap px-3 py-1 rounded-full font-medium transition ${isSel ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
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
      emptyState?.classList.remove('hidden');
      return;
    }
    emptyState?.classList.add('hidden');

    let rowsHtml = '';
    filtered.forEach(p => {
      Store.initPlannerItem(p.id);
      const state = Store.plannerState[p.id];
      const isChecked = state.checked;
      const qty = state.qty || 1;
      const subtotalP = (p.purchase_price * qty).toFixed(2);
      const subtotalS = (p.selling_price * qty).toFixed(2);
      const profit = (subtotalS - subtotalP).toFixed(2);
      const margin = p.selling_price > 0 ? ((p.profit_per_unit / p.selling_price) * 100).toFixed(1) : 0;

      rowsHtml += `
        <tr class="hover:bg-slate-50/80 transition ${isChecked ? 'bg-blue-50/40' : ''}">
          <td class="py-3 px-4 text-center">
            <input type="checkbox" 
              onchange="PlannerModule.toggleCheck(${p.id}, this.checked)" 
              ${isChecked ? 'checked' : ''} 
              class="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer">
          </td>
          <td class="py-3 px-4 font-medium text-slate-900">
            <div class="flex items-center space-x-2">
              <span class="font-bold">${p.name}</span>
              <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">${p.unit || 'पेटी'}</span>
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
              <span>1 पैक = <strong>${p.sub_quantity || 1} ${p.sub_unit || 'पीस'}</strong></span>
              ${p.retail_selling_price ? `<span class="text-emerald-700">| फुटकर बिक्री: <strong>₹${p.retail_selling_price.toFixed(2)} /${p.sub_unit || 'पीस'}</strong></span>` : ''}
            </div>
          </td>
          <td class="py-3 px-4 text-slate-600 text-xs">
            <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">${p.category || 'सामान्य'}</span>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="font-semibold text-blue-600">₹${p.purchase_price.toFixed(2)}</div>
            <div class="text-[10px] text-slate-400">₹${(p.unit_purchase_price || (p.purchase_price / (p.sub_quantity || 1))).toFixed(2)} /${p.sub_unit || 'पीस'}</div>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="font-bold text-slate-800">₹${p.selling_price.toFixed(2)}</div>
            <div class="text-[10px] text-emerald-600 font-medium">₹${(p.retail_selling_price || 0).toFixed(2)} /${p.sub_unit || 'पीस'}</div>
          </td>
          <td class="py-3 px-4 text-center">
            <div class="inline-flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
              <button onclick="PlannerModule.adjustQty(${p.id}, -1)" class="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-600 font-bold transition">
                <i class="fa-solid fa-minus text-xs"></i>
              </button>
              <input type="number" min="0.1" step="any" value="${qty}" onchange="PlannerModule.setQty(${p.id}, this.value)" 
                class="w-14 text-center text-xs font-bold text-slate-800 focus:outline-none py-1">
              <button onclick="PlannerModule.adjustQty(${p.id}, 1)" class="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-600 font-bold transition">
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
          </td>
          <td class="py-3 px-4 text-right font-extrabold ${isChecked ? 'text-blue-700' : 'text-slate-500'}">
            ₹${subtotalP}
          </td>
          <td class="py-3 px-4 text-right">
            <span class="font-bold text-emerald-600 text-xs">+₹${profit}</span>
            <span class="text-[10px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded ml-1 font-semibold">${margin}%</span>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
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
    const marginPercent = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : 0;

    const barCount = document.getElementById('barSelectedCount');
    const barPurchase = document.getElementById('barPurchaseCost');
    const barSelling = document.getElementById('barSellingValue');
    const barProfit = document.getElementById('barProfit');

    if (barCount) barCount.innerText = `${selectedCount} सामान`;
    if (barPurchase) barPurchase.innerText = `₹${totalPurchase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (barSelling) barSelling.innerText = `₹${totalSelling.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (barProfit) barProfit.innerHTML = `₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="text-xs font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ml-1">${marginPercent}% मार्जिन</span>`;
  },

  async saveTrip() {
    const tripDate = document.getElementById('tripDate')?.value;
    const tripTitle = document.getElementById('tripTitle')?.value.trim() || 'दुकान खरीदारी';

    if (!tripDate) {
      App.showToast('कृपया खरीद तारीख चुनें', 'error');
      return;
    }

    const checkedItems = [];
    Store.products.forEach(p => {
      const state = Store.plannerState[p.id];
      if (state && state.checked) {
        checkedItems.push({
          product_id: p.id,
          product_name: p.name,
          category: p.category || '',
          unit: p.unit || 'पीस',
          quantity: state.qty || 1,
          purchase_price: p.purchase_price,
          selling_price: p.selling_price
        });
      }
    });

    if (checkedItems.length === 0) {
      App.showToast('कम से कम एक सामान पर टिक मार्क (✓) लगाएं', 'warning');
      return;
    }

    const saveBtn = document.getElementById('saveTripBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> सेव हो रहा है...`;
    }

    try {
      const res = await API.saveTrip({
        trip_date: tripDate,
        title: tripTitle,
        notes: '',
        items: checkedItems
      });

      App.showToast(`तारीख ${tripDate} की खरीदारी सुरक्षित हो गई! (कुल: ₹${res.total_purchase_cost})`, 'success');
      setTimeout(() => {
        App.switchTab('history');
      }, 500);
    } catch (err) {
      App.showToast('त्रुटि: ' + err.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk mr-1"></i> <span>खरीदारी सुरक्षित करें (Save)</span>`;
      }
    }
  },

  openBillModal() {
    const tripDate = document.getElementById('tripDate')?.value || '--';
    const tripTitle = document.getElementById('tripTitle')?.value.trim() || 'दुकान खरीदारी';

    document.getElementById('billSlipDate').innerText = tripDate;
    document.getElementById('billSlipTitle').innerText = tripTitle;

    const tbody = document.getElementById('billModalTableBody');
    tbody.innerHTML = '';

    let count = 0;
    let totalPurchase = 0;
    let totalSelling = 0;

    Store.products.forEach(p => {
      const state = Store.plannerState[p.id];
      if (state && state.checked) {
        count++;
        const qty = state.qty || 1;
        const subP = p.purchase_price * qty;
        const subS = p.selling_price * qty;
        const profit = subS - subP;

        totalPurchase += subP;
        totalSelling += subS;

        tbody.innerHTML += `
          <tr class="border-b border-slate-100">
            <td class="py-2 font-medium text-slate-800">${p.name} <span class="text-[10px] text-slate-400">(${p.unit || 'पीस'})</span></td>
            <td class="py-2 text-center font-bold">${qty}</td>
            <td class="py-2 text-right">₹${p.purchase_price.toFixed(2)}</td>
            <td class="py-2 text-right font-bold text-blue-600">₹${subP.toFixed(2)}</td>
            <td class="py-2 text-right">₹${subS.toFixed(2)}</td>
            <td class="py-2 text-right font-bold text-emerald-600">+₹${profit.toFixed(2)}</td>
          </tr>
        `;
      }
    });

    const totalProfit = totalSelling - totalPurchase;
    const margin = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : 0;

    document.getElementById('billTotalItemsCount').innerText = `${count} प्रकार`;
    document.getElementById('billTotalPurchaseCost').innerText = `₹${totalPurchase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('billTotalSellingValue').innerText = `₹${totalSelling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('billTotalProfit').innerText = `₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('billMarginPercent').innerText = `${margin}% मार्जिन`;

    document.getElementById('billModal').classList.remove('hidden');
  },

  closeBillModal() {
    document.getElementById('billModal').classList.add('hidden');
  }
};
