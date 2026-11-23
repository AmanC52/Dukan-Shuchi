// Tab 2: Inventory / Product CRUD & Mobile Cards Logic

const InventoryModule = {
  renderDropdown() {
    const invSelect = document.getElementById('inventoryCategoryFilter');
    if (!invSelect) return;
    let options = `<option value="all">सभी श्रेणियां</option>`;
    Store.categories.forEach(cat => {
      options += `<option value="${cat}">${cat}</option>`;
    });
    invSelect.innerHTML = options;

    const datalist = document.getElementById('categoriesDatalist');
    if (datalist) {
      datalist.innerHTML = Store.categories.map(c => `<option value="${c}">`).join('');
    }
  },

  renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const cardsContainer = document.getElementById('inventoryMobileCards');

    const searchTxt = (document.getElementById('inventorySearch')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('inventoryCategoryFilter')?.value || 'all';

    const filtered = Store.products.filter(p => {
      const matchesSearch = !searchTxt ||
        p.name.toLowerCase().includes(searchTxt) ||
        (p.category && p.category.toLowerCase().includes(searchTxt)) ||
        (p.notes && p.notes.toLowerCase().includes(searchTxt)) ||
        (p.unit && p.unit.toLowerCase().includes(searchTxt));
      const matchesCat = catFilter === 'all' || p.category === catFilter;
      return matchesSearch && matchesCat;
    });

    let tableHtml = '';
    let cardsHtml = '';

    filtered.forEach(p => {
      const subQty = p.sub_quantity || 1;
      const subUnit = p.sub_unit || 'पीस';
      const unitBuy = p.unit_purchase_price ? p.unit_purchase_price.toFixed(2) : (p.purchase_price / subQty).toFixed(2);
      const retailSell = (p.retail_selling_price || 0).toFixed(2);
      const unitProfit = p.unit_profit ? p.unit_profit.toFixed(2) : (retailSell - unitBuy).toFixed(2);
      const totalProfit = (p.total_profit_per_pack || (p.selling_price - p.purchase_price)).toFixed(2);
      const margin = p.margin_percent || 0;

      // 1. Desktop Table Row
      tableHtml += `
        <tr>
          <td style="color: #94a3b8; font-family: monospace;">#${p.id}</td>
          <td>
            <strong style="color: #0f172a; font-size: 14px;">${p.name}</strong>
            ${p.notes ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${p.notes}</div>` : ''}
          </td>
          <td>
            <span class="badge badge-slate">${p.category || 'सामान्य'}</span>
          </td>
          <td>
            <strong style="color: #334155;">${p.unit || 'पेटी'}</strong>
            <div style="font-size: 11px; color: #2563eb; font-weight: 700; margin-top: 2px;">
              1 पैक = ${subQty} ${subUnit}
            </div>
          </td>
          <td style="text-align: right;">
            <div style="font-weight: 800; color: #2563eb;">₹${p.purchase_price.toFixed(2)}</div>
            <div style="font-size: 10px; color: #94a3b8;">₹${unitBuy} /${subUnit}</div>
          </td>
          <td style="text-align: right;">
            <div style="font-weight: 800; color: #0f172a;">₹${retailSell} <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">/${subUnit}</span></div>
            <div style="font-size: 10px; color: #64748b;">कुल ₹${p.selling_price.toFixed(2)}</div>
          </td>
          <td style="text-align: right;">
            <span style="font-weight: 800; color: #059669;">+₹${unitProfit}</span>
            <div style="font-size: 10px; color: #94a3b8;">प्रति ${subUnit}</div>
          </td>
          <td style="text-align: right;">
            <div style="font-weight: 800; color: #059669;">+₹${totalProfit}</div>
            <span class="badge badge-green" style="font-size: 10px; margin-top: 2px;">${margin}% मार्जिन</span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 6px; justify-content: center;">
              <button onclick="InventoryModule.openEditModal(${p.id})" class="btn btn-outline btn-sm" title="एडिट करें">
                ✏️
              </button>
              <button onclick="InventoryModule.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="btn btn-sm" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" title="डिलीट करें">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;

      // 2. Dedicated Mobile Card
      cardsHtml += `
        <div class="mobile-item-card">
          <div class="mobile-card-top">
            <div style="flex: 1;">
              <span class="mobile-prod-name">${p.name}</span>
              ${p.notes ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${p.notes}</div>` : ''}
            </div>
            <span class="badge badge-slate">${p.category || 'सामान्य'}</span>
          </div>

          <div class="mobile-pack-info">
            <span>📦 थोक पैकिंग: <strong>${p.unit || 'पेटी'}</strong> (${subQty} ${subUnit})</span>
            <span class="badge badge-green">${margin}% मार्जिन</span>
          </div>

          <div class="mobile-rates-grid">
            <div class="rate-cell">
              <span class="rate-lbl">थोक खरीद</span>
              <span class="rate-val buy">₹${p.purchase_price.toFixed(2)}</span>
              <span style="font-size: 9px; color: #94a3b8;">₹${unitBuy}/${subUnit}</span>
            </div>
            <div class="rate-cell">
              <span class="rate-lbl">फुटकर बिक्री</span>
              <span class="rate-val sell">₹${retailSell}</span>
              <span style="font-size: 9px; color: #94a3b8;">/${subUnit}</span>
            </div>
            <div class="rate-cell">
              <span class="rate-lbl">पेटी मुनाफा</span>
              <span class="rate-val profit">+₹${totalProfit}</span>
              <span style="font-size: 9px; color: #059669;">+₹${unitProfit}/${subUnit}</span>
            </div>
          </div>

          <div class="mobile-card-bottom" style="justify-content: flex-end; gap: 8px;">
            <button onclick="InventoryModule.openEditModal(${p.id})" class="btn btn-outline btn-sm">
              ✏️ एडिट करें
            </button>
            <button onclick="InventoryModule.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="btn btn-sm" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">
              🗑️ हटाएं
            </button>
          </div>
        </div>
      `;
    });

    if (tbody) tbody.innerHTML = tableHtml;
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
  },

  openAddModal() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('prodSubQuantity').value = '1';
    document.getElementById('prodSubUnit').value = 'पीस';
    document.getElementById('productModalTitle').innerText = 'नया सामान जोड़ें';
    this.calculateModalProfit();
    document.getElementById('productModal').classList.remove('hidden');
  },

  openEditModal(productId) {
    const p = Store.products.find(item => item.id === productId);
    if (!p) return;

    document.getElementById('editProductId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category || '';
    document.getElementById('prodUnit').value = p.unit || 'पेटी';
    document.getElementById('prodSubQuantity').value = p.sub_quantity || 1;
    document.getElementById('prodSubUnit').value = p.sub_unit || 'पीस';
    document.getElementById('prodPurchasePrice').value = p.purchase_price;
    document.getElementById('prodRetailSellingPrice').value = p.retail_selling_price || 0;
    document.getElementById('prodNotes').value = p.notes || '';
    document.getElementById('productModalTitle').innerText = 'सामान विवरण एडिट करें';

    this.calculateModalProfit();
    document.getElementById('productModal').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('productModal').classList.add('hidden');
  },

  calculateModalProfit() {
    const subQty = parseFloat(document.getElementById('prodSubQuantity')?.value) || 1;
    const subUnit = document.getElementById('prodSubUnit')?.value || 'पीस';
    const pRate = parseFloat(document.getElementById('prodPurchasePrice')?.value) || 0;
    const rRate = parseFloat(document.getElementById('prodRetailSellingPrice')?.value) || 0;

    const unitBuy = subQty > 0 ? (pRate / subQty) : pRate;
    const unitProfit = rRate - unitBuy;
    const totalSelling = subQty * rRate;
    const totalProfit = totalSelling - pRate;
    const margin = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : 0;

    const unitBuyEl = document.getElementById('modalUnitPurchasePreview');
    const unitProfitEl = document.getElementById('modalUnitProfitPreview');
    const totalSellingEl = document.getElementById('modalTotalSellingPreview');
    const totalProfitEl = document.getElementById('modalTotalProfitPreview');
    const marginEl = document.getElementById('modalMarginPreview');

    if (unitBuyEl) unitBuyEl.innerText = `₹${unitBuy.toFixed(2)} /${subUnit}`;
    if (unitProfitEl) unitProfitEl.innerText = `${unitProfit >= 0 ? '+' : ''}₹${unitProfit.toFixed(2)} /${subUnit}`;
    if (totalSellingEl) totalSellingEl.innerText = `बिक्री: ₹${totalSelling.toFixed(2)}`;
    if (totalProfitEl) totalProfitEl.innerText = `(${totalProfit >= 0 ? '+' : ''}₹${totalProfit.toFixed(2)})`;
    if (marginEl) marginEl.innerText = `${margin}% मार्जिन`;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const subQty = parseFloat(document.getElementById('prodSubQuantity').value) || 1;
    const rPrice = parseFloat(document.getElementById('prodRetailSellingPrice').value) || 0;
    const pPrice = parseFloat(document.getElementById('prodPurchasePrice').value) || 0;
    const sPrice = roundVal(subQty * rPrice);

    const payload = {
      name: document.getElementById('prodName').value.trim(),
      category: document.getElementById('prodCategory').value.trim() || 'किराना',
      unit: document.getElementById('prodUnit').value.trim() || 'पेटी',
      sub_quantity: subQty,
      sub_unit: document.getElementById('prodSubUnit').value,
      purchase_price: pPrice,
      retail_selling_price: rPrice,
      selling_price: sPrice,
      notes: document.getElementById('prodNotes').value.trim()
    };

    try {
      if (id) {
        await API.updateProduct(id, payload);
        App.showToast('सामान अपडेट हो गया!', 'success');
      } else {
        await API.addProduct(payload);
        App.showToast('नया सामान सफलतापूर्वक जुड़ गया!', 'success');
      }
      this.closeModal();
      await App.refreshProducts();
      await App.refreshCategories();
    } catch (err) {
      App.showToast('त्रुटि: ' + err.message, 'error');
    }
  },

  async deleteProduct(id, name) {
    if (!confirm(`क्या आप "${name}" को हटाना चाहते हैं?`)) return;
    try {
      await API.deleteProduct(id);
      App.showToast(`"${name}" हटा दिया गया`, 'success');
      await App.refreshProducts();
      await App.refreshCategories();
    } catch (err) {
      App.showToast('डिलीट नहीं हो सका: ' + err.message, 'error');
    }
  }
};

function roundVal(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
