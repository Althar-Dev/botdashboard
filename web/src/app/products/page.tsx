'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { ProductCategory, ProductItem } from '@/lib/types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Box, 
  X, 
  PlusCircle, 
  ListPlus,
  Tag,
  Search,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  FolderPlus,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export default function ProductsPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Drilldown View State: null = Categories Grid, string = Active Category Detail
  const [activeCategoryDetailId, setActiveCategoryDetailId] = useState<string | null>(null);

  // Search & Filters
  const [catSearch, setCatSearch] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'ready' | 'empty'>('all');

  // Modals state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);

  // Form states
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('box');

  const [editingCategory, setEditingCategory] = useState<{ originalId: string; id: string; name: string; icon: string } | null>(null);

  const [activeCatForProduct, setActiveCatForProduct] = useState('');
  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemDesc, setNewItemDesc] = useState('');

  const [activeItemForStock, setActiveItemForStock] = useState<{ catId: string; item: ProductItem } | null>(null);
  const [bulkStockText, setBulkStockText] = useState('');

  const [editingItem, setEditingItem] = useState<{ catId: string; item: ProductItem } | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId || !newCatName) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_category',
          categoryData: {
            id: newCatId.toLowerCase().trim(),
            name: newCatName.trim(),
            icon: newCatIcon.trim() || 'box',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        setShowAddCatModal(false);
        setNewCatId('');
        setNewCatName('');
      } else {
        alert(json.error || 'Failed to add category');
      }
    } catch (err) {
      alert('Error creating category');
    }
  };

  // Update Category (ID & Name & Icon)
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editingCategory.originalId,
          categoryData: {
            id: editingCategory.id.toLowerCase().trim(),
            name: editingCategory.name.trim(),
            icon: editingCategory.icon.trim() || 'box',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        // If active drilldown detail view was open for this category, update ID
        if (activeCategoryDetailId === editingCategory.originalId) {
          setActiveCategoryDetailId(json.updatedCategoryId || editingCategory.id.toLowerCase().trim());
        }
        setShowEditCatModal(false);
        setEditingCategory(null);
      } else {
        alert(json.error || 'Failed to update category');
      }
    } catch (err) {
      alert('Error updating category');
    }
  };

  // Create Product Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCatForProduct || !newItemId || !newItemName) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_item',
          categoryId: activeCatForProduct,
          itemData: {
            id: newItemId.toLowerCase().trim(),
            name: newItemName.trim(),
            price: Number(newItemPrice),
            description: newItemDesc.trim(),
            stock: [],
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        setShowAddItemModal(false);
        setNewItemId('');
        setNewItemName('');
        setNewItemPrice(0);
        setNewItemDesc('');
      } else {
        alert(json.error || 'Failed to add product');
      }
    } catch (err) {
      alert('Error creating product');
    }
  };

  // Add Bulk Stock
  const handleAddBulkStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemForStock || !bulkStockText.trim()) return;

    const lines = bulkStockText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_stock',
          categoryId: activeItemForStock.catId,
          itemId: activeItemForStock.item.id,
          stockItems: lines,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        setShowStockModal(false);
        setBulkStockText('');
        setActiveItemForStock(null);
      } else {
        alert(json.error || 'Failed to add stock');
      }
    } catch (err) {
      alert('Error adding stock');
    }
  };

  // Update Item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editingItem.catId,
          itemId: editingItem.item.id,
          itemData: editingItem.item,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        setShowEditItemModal(false);
        setEditingItem(null);
      } else {
        alert(json.error || 'Failed to update item');
      }
    } catch (err) {
      alert('Error updating item');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Delete category ${catId}? All items inside will be removed.`)) return;

    try {
      const res = await fetch(`/api/products?categoryId=${catId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        if (activeCategoryDetailId === catId) {
          setActiveCategoryDetailId(null);
        }
      }
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  // Delete Item
  const handleDeleteItem = async (catId: string, itemId: string) => {
    if (!confirm(`Delete product ${itemId}?`)) return;

    try {
      const res = await fetch(`/api/products?categoryId=${catId}&itemId=${itemId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  // Delete single stock item
  const handleDeleteStockItem = async (catId: string, itemId: string, stockIndex: number) => {
    const category = categories.find((c) => c.id === catId);
    const item = category?.items.find((i) => i.id === itemId);
    if (!item) return;

    const newStock = [...item.stock];
    newStock.splice(stockIndex, 1);

    const updatedItem = { ...item, stock: newStock };

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: catId,
          itemId: itemId,
          itemData: updatedItem,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        if (activeItemForStock) {
          setActiveItemForStock({ catId, item: updatedItem });
        }
      }
    } catch (err) {
      alert('Failed to delete stock item');
    }
  };

  const activeCategoryObj = categories.find((c) => c.id === activeCategoryDetailId);

  // Calculations for metrics
  let totalVariants = 0;
  let totalStockCount = 0;
  let outOfStockCount = 0;

  categories.forEach((cat) => {
    if (cat.items) {
      totalVariants += cat.items.length;
      cat.items.forEach((item) => {
        const stk = item.stock?.length || 0;
        totalStockCount += stk;
        if (stk === 0) outOfStockCount += 1;
      });
    }
  });

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredItems = (activeCategoryObj?.items || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.id.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.description.toLowerCase().includes(searchItem.toLowerCase());

    const stockLen = item.stock?.length || 0;
    if (stockFilter === 'ready') return matchesSearch && stockLen > 0;
    if (stockFilter === 'empty') return matchesSearch && stockLen === 0;
    return matchesSearch;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-theme-main transition-colors duration-200">
      <Header
        title="Products & Stock Catalog"
        onRefresh={fetchProducts}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto pb-8">
        {/* Metric Cards Row - Always 2 Cards Per Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Categories</p>
              <h3 className="text-sm sm:text-base font-extrabold text-theme-main mt-0.5">{categories.length} Categories</h3>
              <p className="text-[10px] text-theme-muted mt-0.5">Bot groups</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme text-cyan-500 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Variants</p>
              <h3 className="text-sm sm:text-base font-extrabold text-theme-main mt-0.5">{totalVariants} Products</h3>
              <p className="text-[10px] text-theme-muted mt-0.5">Active items</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme text-indigo-500 shrink-0">
              <Box className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Stock</p>
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-500 mt-0.5">{totalStockCount} Items</h3>
              <p className="text-[10px] text-theme-muted mt-0.5">Database stock</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme text-emerald-500 shrink-0">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Out of Stock</p>
              <h3 className={`text-sm sm:text-base font-extrabold mt-0.5 ${outOfStockCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {outOfStockCount} Products
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5">{outOfStockCount > 0 ? 'Restock needed' : 'Stock healthy'}</p>
            </div>
            <div className={`p-2 rounded-lg bg-theme-sub border border-theme shrink-0 ${outOfStockCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* CONDITION 1: CATEGORIES GRID VIEW (If activeCategoryDetailId is null) */}
        {!activeCategoryDetailId ? (
          <div className="space-y-4">
            {/* Top Toolbar for Category Grid View */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-theme-card p-4 rounded-xl border border-theme shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-theme-sub absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search product category..."
                  className="w-full bg-theme-input border border-theme rounded-lg pl-8 pr-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => setShowAddCatModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                + Add New Category
              </button>
            </div>

            {/* Categories Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const totalStock = cat.items.reduce((acc, i) => acc + (i.stock?.length || 0), 0);

                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategoryDetailId(cat.id)}
                    className="group relative rounded-xl bg-theme-card border border-theme p-4 shadow-sm hover:border-cyan-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                              {cat.id}
                            </span>
                            <h3 className="text-sm font-bold text-theme-main mt-0.5 group-hover:text-cyan-500 transition-colors">
                              {cat.name}
                            </h3>
                          </div>
                        </div>

                        {/* Category Edit & Delete Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory({ originalId: cat.id, id: cat.id, name: cat.name, icon: cat.icon || 'box' });
                              setShowEditCatModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-theme-sub text-theme-sub hover:text-cyan-500 transition-all"
                            title="Edit Category ID & Name"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteCategory(cat.id, e)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stock & Variant Count Badges */}
                      <div className="mt-4 pt-3 border-t border-theme grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-theme-sub border border-theme">
                          <span className="text-[10px] text-theme-sub block">Product Variants</span>
                          <strong className="text-xs font-bold text-theme-main">{cat.items.length} Variants</strong>
                        </div>

                        <div className="p-2 rounded-lg bg-theme-sub border border-theme">
                          <span className="text-[10px] text-theme-sub block">Accounts Stock</span>
                          <strong className={`text-xs font-bold ${totalStock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {totalStock} Items
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Open Category Button Action Bar */}
                    <div className="mt-4 pt-2.5 border-t border-theme flex items-center justify-between text-xs font-semibold text-cyan-500 group-hover:text-cyan-400">
                      <span>Open Category Products</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="col-span-full py-16 text-center text-theme-muted bg-theme-card rounded-xl border border-dashed border-theme space-y-2">
                  <Box className="w-10 h-10 mx-auto text-theme-muted" />
                  <p className="text-xs font-semibold text-theme-main">No Categories Found</p>
                  <p className="text-[11px] text-theme-sub">Click "+ Add New Category" to create your first category.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CONDITION 2: CATEGORY PRODUCTS DETAIL VIEW (When activeCategoryDetailId is selected) */
          <div className="space-y-5">
            {/* Top Navigation Bar: Back Button & Category Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-theme-card p-4 rounded-xl border border-theme shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCategoryDetailId(null)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub border border-theme text-theme-main hover:text-cyan-500 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Categories
                </button>

                <div className="pl-2 border-l border-theme">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {activeCategoryObj?.id}
                    </span>
                    <h2 className="text-base font-bold text-theme-main">{activeCategoryObj?.name}</h2>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setEditingCategory({
                      originalId: activeCategoryObj!.id,
                      id: activeCategoryObj!.id,
                      name: activeCategoryObj!.name,
                      icon: activeCategoryObj!.icon || 'box',
                    });
                    setShowEditCatModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub border border-theme text-theme-main hover:text-cyan-500 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Category
                </button>

                <button
                  onClick={() => {
                    setActiveCatForProduct(activeCategoryObj!.id);
                    setShowAddItemModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Add Product Variant
                </button>

                <button
                  onClick={() => handleDeleteCategory(activeCategoryObj!.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-xs transition-all cursor-pointer"
                  title="Delete This Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Search & Status Filter Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-theme-card p-4 rounded-xl border border-theme shadow-sm">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                      : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                  }`}
                >
                  All ({activeCategoryObj?.items.length || 0})
                </button>
                <button
                  onClick={() => setStockFilter('ready')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    stockFilter === 'ready'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setStockFilter('empty')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    stockFilter === 'empty'
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                  }`}
                >
                  Out of Stock
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3 h-3 text-theme-sub absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  placeholder="Search products / ID..."
                  className="w-full bg-theme-input border border-theme rounded-lg pl-7 pr-2.5 py-1 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Product Cards Grid - 2 per row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const stockCount = item.stock?.length || 0;
                const isReady = stockCount > 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-theme-card border border-theme p-4 shadow-sm hover:border-theme-muted transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                              {item.id}
                            </span>
                            <h3 className="text-sm font-bold text-theme-main">{item.name}</h3>
                          </div>
                          <p className="text-[11px] text-theme-sub mt-1">{item.description || 'No description provided.'}</p>
                        </div>

                        <span className="text-base font-extrabold text-emerald-500 whitespace-nowrap">
                          {formatRupiah(item.price)}
                        </span>
                      </div>

                      {/* Stock Status Badge */}
                      <div className="mt-3 p-2 rounded-lg bg-theme-sub border border-theme flex items-center justify-between text-xs">
                        <span className="text-[11px] text-theme-sub">Available Stock</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isReady
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {isReady ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                          {stockCount} Accounts
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-theme flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveItemForStock({ catId: activeCategoryObj!.id, item });
                          setShowStockModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-500 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        Manage Stock ({stockCount})
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingItem({ catId: activeCategoryObj!.id, item: { ...item } });
                            setShowEditItemModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-theme-sub hover:bg-theme-hover border border-theme text-theme-main text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteItem(activeCategoryObj!.id, item.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-theme-muted bg-theme-card rounded-xl border border-dashed border-theme space-y-1">
                  <Box className="w-8 h-8 mx-auto text-theme-muted" />
                  <p className="text-xs font-semibold text-theme-main">No Product Variants Found</p>
                  <p className="text-[11px] text-theme-sub">Click "+ Add Product Variant" to add items to this category.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <h3 className="text-sm font-bold text-theme-main">Add Product Category</h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Category ID (e.g. capcut)</label>
                <input
                  type="text"
                  required
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  placeholder="capcut"
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="CapCut Premium"
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Category (ID & Name) */}
      {showEditCatModal && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <h3 className="text-sm font-bold text-theme-main">Edit Category</h3>
              <button onClick={() => setShowEditCatModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Category ID (Unique)</label>
                <input
                  type="text"
                  required
                  value={editingCategory.id}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      id: e.target.value,
                    })
                  }
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditCatModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <h3 className="text-sm font-bold text-theme-main">Add Product Variant</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Product ID (e.g. cc_pro)</label>
                <input
                  type="text"
                  required
                  value={newItemId}
                  onChange={(e) => setNewItemId(e.target.value)}
                  placeholder="cc_pro"
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Variant Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="CapCut Pro 1 Month"
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Price (IDR)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Short description..."
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Item */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <h3 className="text-sm font-bold text-theme-main">Edit Product ({editingItem.item.id})</h3>
              <button onClick={() => setShowEditItemModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.item.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, name: e.target.value },
                    })
                  }
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Price (IDR)</label>
                <input
                  type="number"
                  required
                  value={editingItem.item.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, price: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.item.description || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, description: e.target.value },
                    })
                  }
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditItemModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stock Management */}
      {showStockModal && activeItemForStock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-theme-main flex items-center gap-1.5">
                  <ListPlus className="w-4 h-4 text-cyan-500" />
                  Stock Manager: {activeItemForStock.item.name}
                </h3>
                <p className="text-[11px] text-theme-sub">
                  Total Active Stock:{' '}
                  <strong className="text-emerald-500">{activeItemForStock.item.stock?.length || 0} accounts</strong>
                </p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden py-1">
              {/* Left Column: Bulk Add Stock */}
              <form onSubmit={handleAddBulkStock} className="flex flex-col h-full space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-theme-sub">
                    Inject Stock (1 account per line)
                  </label>
                  <span className="text-[10px] text-cyan-500 font-mono">
                    {bulkStockText.split('\n').filter((l) => l.trim()).length} lines
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={bulkStockText}
                  onChange={(e) => setBulkStockText(e.target.value)}
                  placeholder={`account1@email.com:pass123\naccount2@email.com:pass123`}
                  className="w-full flex-1 bg-theme-input border border-theme rounded-lg p-2.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!bulkStockText.trim()}
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Inject Stock to Database
                </button>
              </form>

              {/* Right Column: Existing Stock List */}
              <div className="flex flex-col h-full space-y-2 min-h-0">
                <label className="block text-[11px] font-semibold text-theme-sub">
                  Available Stock List ({activeItemForStock.item.stock?.length || 0})
                </label>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                  {activeItemForStock.item.stock && activeItemForStock.item.stock.length > 0 ? (
                    activeItemForStock.item.stock.map((stk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-theme-sub border border-theme text-[11px] font-mono text-theme-main"
                      >
                        <span className="truncate pr-2">{stk}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteStockItem(
                              activeItemForStock.catId,
                              activeItemForStock.item.id,
                              idx
                            )
                          }
                          className="text-rose-500 hover:text-rose-400 p-1"
                          title="Delete stock item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-theme-muted border border-dashed border-theme rounded-lg p-3">
                      Stock is empty.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-theme">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
