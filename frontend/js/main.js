// Main Application Orchestrator & Utility Modules

let html5QrCode = null;

const App = {
  async init() {
    PlannerModule.init();
    await this.refreshProducts();
    await this.refreshCategories();
    await HistoryModule.load();
    this.registerPWA();
  },

  registerPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('PWA ServiceWorker registered:', reg.scope))
          .catch(err => console.log('PWA ServiceWorker registration failed:', err));
      });
    }
  },

  async refreshProducts() {
    try {
      Store.products = await API.getProducts();
      Store.products.forEach(p => Store.initPlannerItem(p.id));
      PlannerModule.renderTable();
      PlannerModule.updateSummary();
      InventoryModule.renderTable();
    } catch (err) {
      this.showToast('सामान लोड करने में समस्या आई', 'error');
    }
  },

  async refreshCategories() {
    try {
      Store.categories = await API.getCategories();
      PlannerModule.renderCategories();
      InventoryModule.renderDropdown();
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  switchTab(tab) {
    Store.currentTab = tab;

    // Toggle Tab Containers
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('block');
    });

    // Reset Desktop Buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
      btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-white/60');
    });

    // Reset Mobile Nav Icons
    ['planner', 'inventory', 'history', 'reports'].forEach(t => {
      const mobBtn = document.getElementById(`mobileNav-${t}`);
      if (mobBtn) {
        mobBtn.classList.remove('text-blue-600');
        mobBtn.classList.add('text-slate-500');
      }
    });

    const activeTabEl = document.getElementById(`tab-${tab}`);
    if (activeTabEl) {
      activeTabEl.classList.remove('hidden');
      activeTabEl.classList.add('block');
    }

    const activeBtn = document.getElementById(`tabBtn-${tab}`);
    if (activeBtn) {
      activeBtn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-white/60');
      activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
    }

    const activeMobBtn = document.getElementById(`mobileNav-${tab}`);
    if (activeMobBtn) {
      activeMobBtn.classList.remove('text-slate-500');
      activeMobBtn.classList.add('text-blue-600');
    }

    // Toggle Sticky Planner Bar
    const bottomBar = document.getElementById('plannerBottomBar');
    if (bottomBar) {
      if (tab === 'planner') {
        bottomBar.classList.remove('translate-y-full');
      } else {
        bottomBar.classList.add('translate-y-full');
      }
    }

    // Tab-specific Actions
    if (tab === 'history') {
      HistoryModule.load();
    } else if (tab === 'reports') {
      ReportsModule.load();
    } else if (tab === 'inventory') {
      InventoryModule.renderTable();
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-slate-800 text-white'
    };

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    toast.className = `flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-bold transition-all transform translate-y-2 opacity-0 pointer-events-auto ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// ==================== BARCODE SCANNER MODULE ====================
function openBarcodeScannerModal() {
  document.getElementById('barcodeScannerModal').classList.remove('hidden');
  document.getElementById('scannerFeedback').innerText = 'कैमरा शुरू हो रहा है...';

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onBarcodeScannedSuccess,
      (err) => { /* ignore per-frame failures */ }
    ).then(() => {
      document.getElementById('scannerFeedback').innerText = 'बारकोड को कैमरे के बीच में रखें';
    }).catch(err => {
      document.getElementById('scannerFeedback').innerText = 'कैमरा खोलने की अनुमति नहीं मिली: ' + err;
    });
  } catch (err) {
    document.getElementById('scannerFeedback').innerText = 'स्कैनर लोड करने में त्रुटि';
  }
}

function onBarcodeScannedSuccess(decodedText, decodedResult) {
  App.showToast(`बारकोड मिला: ${decodedText}`, 'success');
  closeBarcodeScannerModal();

  // Search in products by barcode or code
  const searchInput = document.getElementById('plannerSearch');
  if (searchInput) {
    searchInput.value = decodedText;
    PlannerModule.filterSearch();
  }

  // If exact match found, auto check it
  const match = Store.products.find(p => p.name.includes(decodedText) || (p.notes && p.notes.includes(decodedText)));
  if (match) {
    PlannerModule.toggleCheck(match.id, true);
    App.showToast(`"${match.name}" लिस्ट में चुना गया!`, 'success');
  }
}

function closeBarcodeScannerModal() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      document.getElementById('barcodeScannerModal').classList.add('hidden');
    }).catch(() => {
      document.getElementById('barcodeScannerModal').classList.add('hidden');
    });
  } else {
    document.getElementById('barcodeScannerModal').classList.add('hidden');
  }
}

// ==================== WHATSAPP BILL SHARE ====================
function shareBillOnWhatsApp() {
  const tripDate = document.getElementById('billSlipDate')?.innerText || new Date().toISOString().split('T')[0];
  const mandi = document.getElementById('billSlipTitle')?.innerText || 'सदर मंडी';
  const totalCost = document.getElementById('billTotalPurchaseCost')?.innerText || '₹0.00';
  const totalSell = document.getElementById('billTotalSellingValue')?.innerText || '₹0.00';
  const totalProfit = document.getElementById('billTotalProfit')?.innerText || '₹0.00';

  let text = `📦 *दुकान खरीदारी बिल पर्ची*\n`;
  text += `📅 *तारीख:* ${tripDate}\n`;
  text += `📍 *मंडी/मार्केट:* ${mandi}\n`;
  text += `--------------------------------\n`;

  let itemIdx = 1;
  Store.products.forEach(p => {
    const state = Store.plannerState[p.id];
    if (state && state.checked) {
      const qty = state.qty || 1;
      const subP = (p.purchase_price * qty).toFixed(2);
      text += `${itemIdx}. *${p.name}* (${p.unit || 'पेटी'})\n`;
      text += `   मात्रा: ${qty} | खरीद: ₹${p.purchase_price} | कुल: ₹${subP}\n`;
      itemIdx++;
    }
  });

  text += `--------------------------------\n`;
  text += `💰 *कुल खरीद लागत:* ${totalCost}\n`;
  text += `📈 *संभावित कुल बिक्री:* ${totalSell}\n`;
  text += `🟢 *अनुमानित शुद्ध मुनाफा:* ${totalProfit}\n\n`;
  text += `_तैयार किया गया: दुकान सहायक (Smart Dukan Manager)_`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

// Global shortcuts for onclick handlers
function switchTab(tab) { App.switchTab(tab); }
function filterPlannerItems() { PlannerModule.filterSearch(); }
function clearPlannerSearch() { PlannerModule.clearSearch(); }
function selectAllPlanner(checked) { PlannerModule.selectAll(checked); }
function openAddProductModal() { InventoryModule.openAddModal(); }
function openEditProductModal(id) { InventoryModule.openEditModal(id); }
function closeProductModal() { InventoryModule.closeModal(); }
function handleProductSubmit(e) { InventoryModule.handleSubmit(e); }
function calculateModalProfit() { InventoryModule.calculateModalProfit(); }
function filterInventoryItems() { InventoryModule.renderTable(); }
function openBulkImportModal() { InventoryModule.openBulkModal(); }
function closeBulkImportModal() { InventoryModule.closeBulkModal(); }
function executeBulkImport() { InventoryModule.executeBulkImport(); }
function openBillBreakdownModal() { PlannerModule.openBillModal(); }
function closeBillBreakdownModal() { PlannerModule.closeBillModal(); }
function saveCurrentTrip() { PlannerModule.saveTrip(); }
function filterHistoryList() { HistoryModule.filter(); }
function openHistoryDetailModal(id) { HistoryModule.openDetailModal(id); }
function closeHistoryDetailModal() { HistoryModule.closeDetailModal(); }
function reorderHistoryTrip() { HistoryModule.reorderTrip(); }
function deleteActiveHistoryTrip() { HistoryModule.deleteTrip(); }

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
