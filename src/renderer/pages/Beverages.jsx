import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ShoppingBag } from 'lucide-react';
import '../styles/beverages.css';
import { useToast } from '../hooks/useToast';
import BeverageDrawer from '../components/ui/BeverageDrawer';
import { useAppStore } from '../store/appStore';

export default function Beverages() {
  const { user } = useAppStore();
  const isOwner = user?.role === 'owner';
  const [beverages, setBeverages] = useState([]);
  const [filteredBeverages, setFilteredBeverages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingBeverage, setEditingBeverage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBeverages();
  }, []);

  useEffect(() => {
    filterBeverages();
  }, [searchQuery, categoryFilter, beverages]);

  const loadBeverages = async () => {
    try {
      const result = await window.electron.invoke('beverages:getAll');
      if (result.success) {
        setBeverages(result.data);
      }
    } catch (error) {
      toast.error('Failed to load beverages');
    } finally {
      setLoading(false);
    }
  };

  const filterBeverages = () => {
    let filtered = beverages;

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(b => b.category === categoryFilter);
    }

    setFilteredBeverages(filtered);
  };

  const handleAdd = () => {
    setEditingBeverage(null);
    setShowDrawer(true);
  };

  const handleEdit = (beverage) => {
    setEditingBeverage(beverage);
    setShowDrawer(true);
  };

  const handleDelete = async (beverage) => {
    if (deleteConfirm === beverage.id) {
      try {
        const result = await window.electron.deleteBeverage({ id: beverage.id });
        if (result.success) {
          toast.success(`${beverage.name} removed`);
          loadBeverages();
          setDeleteConfirm(null);
        } else {
          toast.error(result.error || 'Failed to delete beverage');
        }
      } catch (error) {
        toast.error('Failed to delete beverage');
      }
    } else {
      setDeleteConfirm(beverage.id);
      setTimeout(() => setDeleteConfirm(null), 5000);
    }
  };

  const handleToggleStock = async (beverage) => {
    try {
      const result = await window.electron.invoke('beverages:update', {
        id: beverage.id,
        name: beverage.name,
        category: beverage.category,
        price: beverage.price,
        inStock: !beverage.in_stock
      });
      if (result.success) {
        loadBeverages();
      }
    } catch (error) {
      toast.error('Failed to update stock status');
    }
  };

  const FIXED_CATEGORIES = ['Drinks', 'Snacks', 'Hot beverages', 'Smoking'];
  const dynamicCategories = beverages
    .map(b => b.category)
    .filter(c => c && !FIXED_CATEGORIES.includes(c));
  const extraCategories = [...new Set(dynamicCategories)];
  const categories = ['All', ...FIXED_CATEGORIES, ...extraCategories];

  if (loading) {
    return (
      <div className="beverages-container">
        <div className="beverages-header">
          <div className="search-wrapper skeleton" style={{ width: 300, height: 40 }} />
          <div className="skeleton" style={{ width: 120, height: 40 }} />
        </div>
        <div className="table-card skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="beverages-container">
      <div className="beverages-header">
        <div className="filters-row">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {isOwner && (
          <button className="btn-emerald" onClick={handleAdd}>
            <Plus size={18} />
            Add item
          </button>
        )}
      </div>

      {filteredBeverages.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>No beverages yet</h3>
          <p>Add your first beverage item to get started</p>
          {isOwner && (
            <button className="btn-emerald" onClick={handleAdd}>
              <Plus size={18} />
              Add item
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <table className="beverages-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>In stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeverages.map(beverage => (
                <tr key={beverage.id} className={deleteConfirm === beverage.id ? 'delete-confirm' : ''}>
                  {isOwner && deleteConfirm === beverage.id ? (
                    <td colSpan={5}>
                      <div className="delete-confirm-row">
                        <span>Delete {beverage.name}?</span>
                        <div className="delete-actions">
                          <button className="btn-text" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </button>
                          <button className="btn-text danger" onClick={() => handleDelete(beverage)}>
                            Yes
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td>{beverage.name}</td>
                      <td>
                        <span className={`category-badge ${['drinks','snacks','hotbeverages','smoking'].includes(beverage.category.toLowerCase().replace(/ /g,'')) ? beverage.category.toLowerCase().replace(/ /g,'') : 'custom'}`}>
                          {beverage.category === 'Hot beverages' ? 'HOT' : beverage.category.toUpperCase()}
                        </span>
                      </td>
                      <td>Rs {beverage.price}</td>
                      <td>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={beverage.in_stock === 1}
                            onChange={() => handleToggleStock(beverage)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn" onClick={() => handleEdit(beverage)}>
                            <Edit2 size={16} />
                          </button>
                          {isOwner && (
                            <button className="icon-btn danger" onClick={() => handleDelete(beverage)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDrawer && (
        <BeverageDrawer
          beverage={editingBeverage}
          onClose={() => {
            setShowDrawer(false);
            setEditingBeverage(null);
          }}
          onSuccess={() => {
            loadBeverages();
            setShowDrawer(false);
            setEditingBeverage(null);
          }}
        />
      )}
    </div>
  );
}

