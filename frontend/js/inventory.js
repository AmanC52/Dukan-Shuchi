// Tab 2: Inventory / Product CRUD & Import Logic

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
    if (!tbody) return;

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

    let html = '';
    filtered.forEach(p => {
      const subQty = p.sub_quantity || 1;
      const subUnit = p.sub_unit || 'पीस';
      const unitBuy = p.unit_purchase_price ? p.unit_purchase_price.toFixed(2) : (p.purchase_price / subQty).toFixed(2);
      const retailSell = (p.retail_selling_price || 0).toFixed(2);
      const unitProfit = p.unit_profit ? p.unit_profit.toFixed(2) : (retailSell - unitBuy).toFixed(2);
      const totalProfit = (p.total_profit_per_pack || (p.selling_price - p.purchase_price)).toFixed(2);
      const margin = p.margin_percent || 0;

      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3 px-4 text-xs font-mono text-slate-400">#${p.id}</td>
          
          <!-- Product Name -->
          <td class="py-3 px-4 font-semibold text-slate-900">
            ${p.name}
            ${p.notes ? `<p class="text-xs text-slate-400 font-normal">${p.notes}</p>` : ''}
          </td>

          <!-- Category -->
          <td class="py-3 px-4">
            <span class="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">${p.category || 'सामान्य'}</span>
          </td>

          <!-- Wholesale Pack & Sub-quantity -->
          <td class="py-3 px-4 text-xs">
            <div class="font-bold text-slate-800">${p.unit || 'पेटी'}</div>
            <div class="text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
              1 पैक = ${subQty} ${subUnit}
            </div>
          </td>

          <!-- Wholesale Buy Price -->
          <td class="py-3 px-4 text-right">
            <div class="font-extrabold text-blue-600">₹${p.purchase_price.toFixed(2)}</div>
            <div class="text-[10px] text-slate-400">₹${unitBuy} /${subUnit}</div>
          </td>

          <!-- Retail Selling Rate -->
          <td class="py-3 px-4 text-right">
            <div class="font-bold text-slate-800">₹${retailSell} <span class="text-[10px] text-slate-400 font-normal">/${subUnit}</span></div>
            <div class="text-[10px] text-slate-500">कुल ₹${p.selling_price.toFixed(2)} /पैक</div>
          </td>

          <!-- Unit Profit -->
          <td class="py-3 px-4 text-right">
            <span class="font-bold text-emerald-600 text-xs">+₹${unitProfit}</span>
            <span class="text-[10px] text-slate-400 block font-normal">प्रति ${subUnit}</span>
          </td>

          <!-- Total Pack Profit & Margin -->
          <td class="py-3 px-4 text-right">
            <div class="font-extrabold text-emerald-700">+₹${totalProfit}</div>
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5">${margin}% मार्जिन</span>
          </td>

          <!-- Action Buttons -->
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="InventoryModule.openEditModal(${p.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="एडिट करें">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="InventoryModule.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="डिलीट करें">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
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
  },

  openBulkModal() {
    document.getElementById('bulkInputText').value = '';
    document.getElementById('bulkStatusMsg').innerText = '';
    document.getElementById('bulkModal').classList.remove('hidden');
  },

  closeBulkModal() {
    document.getElementById('bulkModal').classList.add('hidden');
  },

  async executeBulkImport() {
    const rawText = document.getElementById('bulkInputText').value.trim();
    if (!rawText) {
      App.showToast('कृपया पहले लिस्ट पेस्ट करें', 'warning');
      return;
    }

    const statusMsg = document.getElementById('bulkStatusMsg');
    statusMsg.innerText = 'इम्पोर्ट किया जा रहा है...';

    try {
      const res = await API.bulkImport(rawText);
      App.showToast(`${res.count} सामान सफलतापूर्वक जोड़ दिए गए!`, 'success');
      this.closeBulkModal();
      await App.refreshProducts();
      await App.refreshCategories();
    } catch (err) {
      statusMsg.innerText = 'इम्पोर्ट विफल: ' + err.message;
      App.showToast('त्रुटि: ' + err.message, 'error');
    }
  }
};

function roundVal(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
