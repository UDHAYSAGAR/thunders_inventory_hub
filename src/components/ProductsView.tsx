import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, Filter, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Product, CATEGORIES } from '../types';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  onEditProduct: (id: string, product: Partial<Omit<Product, 'id'>>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  loading: boolean;
}

type SortField = 'name' | 'quantity' | 'id';
type SortOrder = 'asc' | 'desc';

export default function ProductsView({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  loading,
}: ProductsViewProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form Fields State
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    price: '',
    quantity: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset states
  const resetForm = () => {
    setFormData({
      name: '',
      category: CATEGORIES[0],
      price: '',
      quantity: '',
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price must be a valid positive number';
    }

    const qtyNum = parseInt(formData.quantity, 10);
    if (formData.quantity === '' || isNaN(qtyNum) || qtyNum < 0) {
      errors.quantity = 'Quantity must be a valid non-negative integer';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await onAddProduct({
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity, 10),
    });

    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !validateForm()) return;

    const success = await onEditProduct(currentProduct.id, {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity, 10),
    });

    if (success) {
      setIsEditModalOpen(false);
      setCurrentProduct(null);
      resetForm();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentProduct) return;
    const success = await onDeleteProduct(currentProduct.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setCurrentProduct(null);
    }
  };

  // Handle Sort Toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  // Process & Filter Products List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || p.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let modifier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') {
          return a.name.localeCompare(b.name) * modifier;
        }
        if (sortField === 'quantity') {
          return (a.quantity - b.quantity) * modifier;
        }
        // Default 'id' sort
        return a.id.localeCompare(b.id) * modifier;
      });
  }, [products, searchTerm, selectedCategory, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  
  // Adjust current page if it is out of bounds due to filters
  const sanitizedCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (sanitizedCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, sanitizedCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Products Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">Add, search, edit, and keep track of your product stock levels.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="btn-add-product"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer text-center"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search, Filter, Sort Controls Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 card-shadow flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-gray-700 focus:outline-none transition-all duration-200 appearance-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white border border-gray-100 rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Updating product database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <div className="p-4 bg-gray-50 inline-flex rounded-full text-gray-400 mb-4 border border-gray-100">
              <Search className="w-8 h-8" />
            </div>
            <p className="font-semibold text-lg text-gray-700">No matching products found</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              We couldn't find any products matching your filters. Try adjusting your query or category.
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th
                      onClick={() => toggleSort('id')}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors duration-150 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Product ID
                        <ArrowUpDown className={`w-3.5 h-3.5 text-gray-400 ${sortField === 'id' ? 'text-blue-600' : ''}`} />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('name')}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors duration-150 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Product Name
                        <ArrowUpDown className={`w-3.5 h-3.5 text-gray-400 ${sortField === 'name' ? 'text-blue-600' : ''}`} />
                      </div>
                    </th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th
                      onClick={() => toggleSort('quantity')}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors duration-150 select-none text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        Quantity
                        <ArrowUpDown className={`w-3.5 h-3.5 text-gray-400 ${sortField === 'quantity' ? 'text-blue-600' : ''}`} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedProducts.map((product) => {
                    const isOutOfStock = product.quantity === 0;
                    const isLowStock = product.quantity > 0 && product.quantity < 5;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(product)}
                              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150 cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs md:text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-800">
                  {Math.min(filteredProducts.length, (sanitizedCurrentPage - 1) * itemsPerPage + 1)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-800">
                  {Math.min(filteredProducts.length, sanitizedCurrentPage * itemsPerPage)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-800">
                  {filteredProducts.length}
                </span>{' '}
                products
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={sanitizedCurrentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all duration-150 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 text-xs md:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                      sanitizedCurrentPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={sanitizedCurrentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-100 card-shadow overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the fields. Product ID is auto-assigned.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Product ID Indicator */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product ID</label>
                <input
                  type="text"
                  disabled
                  value="PRD-XXXX (Auto-assigned on Save)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-sm font-mono cursor-not-allowed"
                />
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Wireless Mouse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                    formErrors.name ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category *</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 appearance-none bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                      formErrors.price ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                      formErrors.quantity ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.quantity}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-100 card-shadow overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
                <p className="text-xs text-gray-400 mt-0.5">Modify values and save changes back to the database.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Product ID Indicator */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product ID</label>
                <input
                  type="text"
                  disabled
                  value={currentProduct?.id || ''}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm font-mono cursor-not-allowed font-semibold"
                />
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                    formErrors.name ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category *</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 appearance-none bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                      formErrors.price ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                      formErrors.quantity ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.quantity}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md border border-gray-100 card-shadow overflow-hidden scale-in">
            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 inline-flex rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-gray-900">Confirm Delete Product</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <span className="font-semibold text-gray-800">"{currentProduct?.name}"</span> ({currentProduct?.id})?
                </p>
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-100/50 mt-2">
                  This action cannot be undone and will permanently remove this record from the Excel file database.
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  id="btn-confirm-delete"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-rose-500/10 transition-all duration-150 cursor-pointer"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
