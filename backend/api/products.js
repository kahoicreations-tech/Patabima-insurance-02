// Products API abstraction: currently returns static catalog from config.
// In a real backend this would call the server or query a database.

import { INSURANCE_PRODUCTS, listProducts, getProductByCode, ensureAllCategoriesRepresented } from '../config/insuranceProducts';
import { INSURANCE_CATEGORIES } from '../config/categories';

class ProductsService {
  listAll() {
    return INSURANCE_PRODUCTS;
  }
  listByCategory(category) {
    return listProducts(category);
  }
  getByCode(code) {
    return getProductByCode(code);
  }
  getCategories() {
    return INSURANCE_CATEGORIES;
  }
  diagnostics() {
    return {
      missingCategories: ensureAllCategoriesRepresented(),
      totalProducts: INSURANCE_PRODUCTS.length,
    };
  }
}

const productsService = new ProductsService();
export default productsService;
