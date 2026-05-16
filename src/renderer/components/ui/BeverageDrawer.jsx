import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import '../../styles/beverages.css';

const FIXED_CATEGORIES = ['Drinks', 'Snacks', 'Hot beverages', 'Smoking'];

export default function BeverageDrawer({ beverage, onClose, onSuccess }) {
  const existingCategory = beverage?.category || 'Drinks';
  const isCustom = existingCategory && !FIXED_CATEGORIES.includes(existingCategory);

  const [categorySelect, setCategorySelect] = useState(isCustom ? 'Custom' : existingCategory);
  const [customCategory, setCustomCategory] = useState(isCustom ? existingCategory : '');
  const [name, setName] = useState(beverage?.name || '');
  const [price, setPrice] = useState(beverage?.price || '');
  const [inStock, setInStock] = useState(beverage?.in_stock === 1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resolvedCategory = categorySelect === 'Custom' ? customCategory.trim() : categorySelect;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Name and price are required');
      return;
    }
    if (categorySelect === 'Custom' && !customCategory.trim()) {
      toast.error('Enter a custom category name');
      return;
    }
    setLoading(true);
    try {
      const data = { name, category: resolvedCategory, price: parseFloat(price), inStock };
      const result = beverage
        ? await window.electron.invoke('beverages:update', { ...data, id: beverage.id })
        : await window.electron.invoke('beverages:add', data);
      if (result.success) {
        toast.success(beverage ? 'Beverage updated' : 'Beverage added');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to save beverage');
      }
    } catch {
      toast.error('Failed to save beverage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h2>{beverage ? 'Edit beverage' : 'Add beverage'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="drawer-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={categorySelect}
              onChange={(e) => setCategorySelect(e.target.value)}
              className="input"
            >
              {FIXED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Custom">Custom…</option>
            </select>
          </div>
          {categorySelect === 'Custom' && (
            <div className="form-group">
              <label>Custom category name</label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="input"
                placeholder="e.g. Energy Drinks"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Price (Rs)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
              min="0"
              step="1"
              required
            />
          </div>
          <div className="form-group-inline">
            <label>In stock</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="drawer-actions">
            <button type="button" className="btn-text" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-emerald" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
