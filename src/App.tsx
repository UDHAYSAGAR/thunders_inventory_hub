import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, FolderSync, Info, Zap } from 'lucide-react';
import { Product, ToastMessage } from './types';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import ExportView from './components/ExportView';
import Toast from './components/Toast';

type Tab = 'dashboard' | 'products' | 'export';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show Toast Helper
  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        showToast('error', data.error || 'Failed to fetch inventory.');
      }
    } catch (err) {
      showToast('error', 'Network error. Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  // Add Product
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        showToast('success', `Product "${productData.name}" added successfully.`);
        return true;
      } else {
        showToast('error', data.error || 'Failed to create product.');
        return false;
      }
    } catch (err) {
      showToast('error', 'Network error. Could not add product.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Edit Product
  const handleEditProduct = async (id: string, productData: Partial<Omit<Product, 'id'>>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        showToast('success', 'Product details updated successfully.');
        return true;
      } else {
        showToast('error', data.error || 'Failed to update product.');
        return false;
      }
    } catch (err) {
      showToast('error', 'Network error. Could not update product.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        showToast('success', 'Product deleted successfully.');
        return true;
      } else {
        showToast('error', data.error || 'Failed to delete product.');
        return false;
      }
    } catch (err) {
      showToast('error', 'Network error. Could not delete product.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload Excel base64
  const handleUploadExcel = async (fileBase64: string, fileName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, fileName }),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        showToast('success', 'Database synced with uploaded Excel file.');
        return true;
      } else {
        showToast('error', data.error || 'Failed to sync with uploaded file.');
        return false;
      }
    } catch (err) {
      showToast('error', 'Network error. Could not upload file.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold font-display shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-4.5 h-4.5 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-800 font-display leading-tight">Team Thunder</h1>
              <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wider">Inventory Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              id="tab-products"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                activeTab === 'products'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>Products</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                activeTab === 'export'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FolderSync className="w-4.5 h-4.5" />
              <span>Export / Import</span>
            </button>
          </nav>

          {/* Connected File Widget */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Excel Linked</p>
              </div>
              <p className="text-xs font-mono font-semibold text-slate-700 truncate" title="inventory.xlsx">
                inventory.xlsx
              </p>
              <button
                onClick={() => setActiveTab('export')}
                className="mt-3 w-full text-left text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Change File / Sync
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Navbar / Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold font-display shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-4.5 h-4.5 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-800 font-display leading-none">Team Thunder</h1>
              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block">Inventory Hub</span>
            </div>
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Inventory Management System</p>
          </div>

          {/* Quick Tabs switcher for mobile */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl md:hidden">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Products"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'export' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              title="Export / Import"
            >
              <FolderSync className="w-4.5 h-4.5" />
            </button>
          </nav>

          {/* Connection status (all viewports) */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              Internship Portfolio
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Live File Database
            </span>
          </div>
        </header>

        {/* Scrollable Sub-View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                onNavigateToProducts={() => setActiveTab('products')}
                loading={loading}
                onRefresh={fetchProducts}
              />
            )}

            {activeTab === 'products' && (
              <ProductsView
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                loading={loading}
              />
            )}

            {activeTab === 'export' && (
              <ExportView
                products={products}
                onUploadExcel={handleUploadExcel}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
