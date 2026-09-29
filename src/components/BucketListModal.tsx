import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Compass,
  Coffee,
  Plane,
  Heart,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { BucketCategory, BucketItem } from '../types';

interface BucketListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<
  BucketCategory,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  places: {
    label: 'Places & Travel',
    emoji: '✈️',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  cafe: {
    label: 'Cafes & Food',
    emoji: '☕',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  adventure: {
    label: 'Fun & Adventure',
    emoji: '🎡',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  date: {
    label: 'Date Ideas',
    emoji: '🌙',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  general: {
    label: 'Dream & Wish',
    emoji: '✨',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
};

export const BucketListModal: React.FC<BucketListModalProps> = ({ isOpen, onClose }) => {
  const { bucketList, addBucketItem, toggleBucketItem, deleteBucketItem, currentUser, partnerUser } = useVault();

  // Tab: 'todo' | 'completed' | 'all'
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'all'>('todo');
  const [selectedCategory, setSelectedCategory] = useState<BucketCategory | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<BucketCategory>('places');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalCount = bucketList.length;
  const completedCount = bucketList.filter((b) => b.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered items
  const filteredItems = bucketList.filter((item) => {
    if (activeTab === 'todo' && item.isCompleted) return false;
    if (activeTab === 'completed' && !item.isCompleted) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await addBucketItem({
        title: newTitle.trim(),
        location: newLocation.trim() || undefined,
        category: newCategory,
        notes: newNotes.trim() || undefined,
      });

      // Reset form
      setNewTitle('');
      setNewLocation('');
      setNewNotes('');
      setIsFormOpen(false);
      if (activeTab === 'completed') {
        setActiveTab('todo');
      }
    } catch (err) {
      console.error('Failed to add bucket item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-lavender-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl glass-card rounded-3xl p-4 sm:p-6 shadow-2xl relative border border-lavender-200 my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-lavender-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-lavender-500 text-white flex items-center justify-center shadow-cute text-xl">
              🗺️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-xl font-bold font-cute text-purple-950">
                  Places We Want to Go
                </h3>
                <span className="text-xs">✨</span>
              </div>
              <p className="text-xs text-purple-700/80 font-medium">
                Our shared travel bucket list & date wishlist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Quick Stats Card */}
        <div className="mt-3.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-cute border border-purple-400/20 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-lavender-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-lavender-200">
                Shared Progress
              </span>
            </div>
            <span className="text-xs font-bold text-yellow-300">
              {completedCount} of {totalCount} visited ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-emerald-400 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-lavender-200 mt-2">
            <span>📍 {pendingCount} places to visit</span>
            <span>🎉 {completedCount} visited together</span>
          </div>
        </div>

        {/* Action Bar (+ Add Button, Tabs) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-lavender-100/90 rounded-2xl border border-lavender-200">
            <button
              onClick={() => setActiveTab('todo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'todo'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              To Visit ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              All ({totalCount})
            </button>
          </div>

          {/* Toggle Add Item Form */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:brightness-105 text-white text-xs font-bold shadow-cute transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Add New Place</span>
            {isFormOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
        </div>

        {/* Collapsible Add New Place Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-white/95 border border-lavender-300 shadow-cute overflow-hidden space-y-3 flex-shrink-0"
            >
              <div className="flex items-center justify-between pb-1 border-b border-lavender-100">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>New Place or Wishlist Goal</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-purple-600 hover:text-purple-900"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  Place / Activity Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Watch sunset from Santorini cliffs, Try fluffy matcha pancakes..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-lavender-50/50 text-purple-950 text-xs font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Location / Destination (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
                    <input
                      type="text"
                      placeholder="e.g. Kyoto, Paris, Downtown..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-lavender-50/50 text-purple-950 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BucketCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-lavender-50/50 text-purple-950 text-xs font-semibold"
                  >
                    <option value="places">✈️ Places & Travel</option>
                    <option value="cafe">☕ Cafes & Dining</option>
                    <option value="adventure">🎡 Fun & Adventure</option>
                    <option value="date">🌙 Date Night Ideas</option>
                    <option value="general">✨ Dream Wishlist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  Notes & Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best in autumn when leaves change, book tickets 2 weeks ahead..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-lavender-50/50 text-purple-950 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold shadow-cute transition-all"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Wishlist ✨'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Category Filter Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-purple-900 text-white'
                : 'bg-white/80 hover:bg-lavender-100 text-purple-800 border border-lavender-200'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_CONFIG) as BucketCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? 'bg-purple-900 text-white'
                    : 'bg-white/80 hover:bg-lavender-100 text-purple-800 border border-lavender-200'
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bucket List Items */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
          {filteredItems.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-lavender-50/50 border border-dashed border-lavender-300">
              <div className="text-3xl mb-2">🗺️</div>
              <h4 className="text-sm font-bold text-purple-950 font-cute">
                {activeTab === 'completed'
                  ? 'No completed places yet!'
                  : 'No places in this wishlist yet!'}
              </h4>
              <p className="text-xs text-purple-600 max-w-xs mt-1">
                {activeTab === 'completed'
                  ? 'Tap the checkbox next to any place when you visit it to celebrate!'
                  : 'Add places you dream of visiting, cafes to try, or cute date ideas.'}
              </p>
              {activeTab !== 'completed' && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-cute"
                >
                  + Add First Place
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    item.isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200/90 shadow-2xs'
                      : 'bg-white border-lavender-200/90 shadow-xs hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleBucketItem(item.id)}
                      className="mt-0.5 flex-shrink-0 transition-transform hover:scale-115 active:scale-90"
                      title={item.isCompleted ? 'Mark as to visit' : 'Mark as completed 🎉'}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 hover:text-purple-600" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catConfig.bg} ${catConfig.color} ${catConfig.border} flex items-center gap-1`}
                        >
                          <span>{catConfig.emoji}</span>
                          <span>{catConfig.label}</span>
                        </span>

                        {item.location && (
                          <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-0.5 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            <MapPin className="w-3 h-3 text-purple-600" />
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">
                              {item.location}
                            </span>
                          </span>
                        )}

                        {item.isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                            Done! 🎉
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs sm:text-sm font-bold text-purple-950 leading-snug break-words ${
                          item.isCompleted ? 'line-through text-purple-500 font-medium' : ''
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Notes */}
                      {item.notes && (
                        <p className="mt-1 text-[11px] text-purple-700/90 bg-lavender-50/70 p-1.5 rounded-lg border border-lavender-100">
                          {item.notes}
                        </p>
                      )}

                      {/* Footer meta */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-purple-500 font-medium">
                        <span>Added by {item.createdBy}</span>
                        {item.isCompleted && item.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">
                              Visited {new Date(item.completedAt).toLocaleDateString()}
                              {item.completedBy ? ` by ${item.completedBy}` : ''} 🎉
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove "${item.title}" from bucket list?`)) {
                          deleteBucketItem(item.id);
                        }
                      }}
                      className="p-1 text-purple-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                      title="Delete place"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
