// Main Application Orchestrator & Utility Modules

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
    });

    // Reset Desktop Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.remove('active-tab');
    });

    // Reset Mobile Nav Icons
    ['planner', 'inventory', 'history', 'reports'].forEach(t => {
      const mobBtn = document.getElementById(`mobileNav-${t}`);
      if (mobBtn) mobBtn.classList.remove('active');
    });

    const activeTabEl = document.getElementById(`tab-${tab}`);
    if (activeTabEl) {
      activeTabEl.classList.remove('hidden');
    }

    const activeBtn = document.getElementById(`tabBtn-${tab}`);
    if (activeBtn) {
      activeBtn.classList.add('active-tab');
    }

    const activeMobBtn = document.getElementById(`mobileNav-${tab}`);
    if (activeMobBtn) {
      activeMobBtn.classList.add('active');
    }

    // Toggle Sticky Planner Bar
    const bottomBar = document.getElementById('plannerBottomBar');
    if (bottomBar) {
      if (tab === 'planner') {
        bottomBar.classList.remove('hidden');
      } else {
        bottomBar.classList.add('hidden');
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
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Global shortcuts for HTML onclick handlers
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
