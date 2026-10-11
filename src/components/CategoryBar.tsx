import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check, Filter, Compass, X } from 'lucide-react';
import { Category } from '../types';

export const CATEGORIES: Category[] = [
  'All',
  'Leaderboards',
  'Marketing',
  'SEO',
  'Productivity',
  'Agents',
  'Developer',
  'Crypto',
  'Other',
  'Explore',
];

interface CategoryBarProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const totalBidsCount = Object.values(categoryCounts).reduce((acc, curr) => acc + curr, 0);
  const activeCount = selectedCategory === 'All' ? totalBidsCount : categoryCounts[selectedCategory] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.3 }}
      className="relative mx-auto w-full max-w-5xl px-4 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Consolidated Category Dropdown Menu */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Category:
          </span>

          <button
            id="category-filter-dropdown"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`group flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 transform-gpu active:scale-95 shadow-2xs ${
              selectedCategory !== 'All'
                ? 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100/60'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className={`h-3.5 w-3.5 ${selectedCategory !== 'All' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="font-heading">
              {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </span>

            {activeCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                  selectedCategory !== 'All'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {activeCount}
              </span>
            )}

            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          </button>

          {/* Quick reset button if a category other than All is active */}
          {selectedCategory !== 'All' && (
            <button
              onClick={() => onSelectCategory('All')}
              title="Reset to all categories"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 shadow-2xs"
            >
              <span>Reset</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Dropdown Menu Overlay */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute left-0 sm:left-auto top-full z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>Select Category</span>
                <span className="font-mono text-[10px] text-slate-400">{CATEGORIES.length} options</span>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = cat === 'All' ? totalBidsCount : categoryCounts[cat];

                  return (
                    <button
                      key={cat}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectCategory(cat);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-800 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                        ) : cat === 'Explore' ? (
                          <Compass className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}
                        <span>{cat === 'All' ? 'All Categories' : cat}</span>
                      </div>

                      {typeof count === 'number' && count > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums ${
                            isSelected
                              ? 'bg-blue-200 text-blue-800 font-semibold'
                              : 'border border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side status indicator */}
        <div className="text-xs text-slate-500 hidden sm:block font-sans">
          {selectedCategory === 'All' ? (
            <span>
              Showing all categories <span className="font-mono text-slate-400">({totalBidsCount} total)</span>
            </span>
          ) : (
            <span>
              Filtered to <strong className="text-slate-900">{selectedCategory}</strong>{' '}
              <span className="font-mono text-slate-400">({activeCount} entries)</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryBar;
