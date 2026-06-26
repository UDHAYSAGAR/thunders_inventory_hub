export interface Product {
  id: string; // Product ID, auto-generated
  name: string; // Product Name
  category: string; // Category
  price: number; // Price
  quantity: number; // Quantity
  lastUpdated?: string; // Virtual or internal last updated timestamp (ISO string)
}

export interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Office Supplies',
  'Apparel',
  'Food & Beverage',
  'Automotive',
  'Health & Beauty',
  'Sports & Outdoors'
];
