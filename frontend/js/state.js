// Central State Store
const Store = {
  products: [],
  plannerState: {}, // { [productId]: { checked: boolean, qty: number } }
  categories: [],
  trips: [],
  activeTrip: null,
  currentTab: 'planner',
  selectedPlannerCategory: 'all',

  initPlannerItem(productId) {
    if (!this.plannerState[productId]) {
      this.plannerState[productId] = { checked: false, qty: 1 };
    }
  }
};
