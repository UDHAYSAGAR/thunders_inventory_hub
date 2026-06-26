import React from 'react';
import { Package, AlertTriangle, XOctagon, RefreshCw, ChevronRight } from 'lucide-react';
import { Product, InventoryStats } from '../types';

interface DashboardViewProps {
  products: Product[];
  onNavigateToProducts: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardView({
  products,
  onNavigateToProducts,
  loading,
  onRefresh,
}: DashboardViewProps) {
  
  // Calculate Stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < 5).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;

  // Get recently updated products. Sort by virtual timestamp or index-reversed if timestamp is same
  const recentlyUpdated = [...products]
    .sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory statistics and status tracking.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          {loading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow card-hover-shadow flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-400">Total Products</span>
            <div className="text-3xl font-bold text-gray-900 font-display">
              {loading ? (
                <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-md" />
              ) : (
                totalProducts
              )}
            </div>
            <p className="text-xs text-gray-500">Unique catalog products tracked</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow card-hover-shadow flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-400">Low Stock Products</span>
            <div className="text-3xl font-bold text-amber-600 font-display">
              {loading ? (
                <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-md" />
              ) : (
                lowStockProducts
              )}
            </div>
            <p className="text-xs text-amber-600/80">Quantity below 5 units</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow card-hover-shadow flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-400">Out of Stock Products</span>
            <div className="text-3xl font-bold text-rose-600 font-display">
              {loading ? (
                <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-md" />
              ) : (
                outOfStockProducts
              )}
            </div>
            <p className="text-xs text-rose-600/80">Zero inventory remaining</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
            <XOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recently Updated Table Card */}
      <div className="bg-white border border-gray-100 rounded-2xl card-shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recently Updated</h2>
            <p className="text-xs text-gray-500 mt-0.5">Quick overview of inventory changes in this session.</p>
          </div>
          <button
            onClick={onNavigateToProducts}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200"
          >
            Manage Products
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Fetching catalog data...</span>
          </div>
        ) : recentlyUpdated.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Create or upload products to populate the dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Product ID</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentlyUpdated.map((product) => {
                  const isOutOfStock = product.quantity === 0;
                  const isLowStock = product.quantity > 0 && product.quantity < 5;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-500">
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
                      <td className="px-6 py-4 text-right">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
