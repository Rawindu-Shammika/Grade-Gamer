import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const ALL_ESPORTS_TITLES = [
  { category: 'SIM RACING', titles: ['Assetto Corsa', 'F1 25'] },
  { category: 'FPS SHOOTERS', titles: ['Valorant', 'Counter-Strike 2', 'Apex Legends', 'Rainbow Six Siege'] },
  { category: 'MOBA', titles: ['Dota 2', 'League of Legends'] },
  { category: 'SPORTS & OTHERS', titles: ['PUBG', 'EA FC 27'] },
];

const FLAT_TITLES = ALL_ESPORTS_TITLES.flatMap((c) => c.titles);

export default function EsportsTitlesModal({
  isOpen,
  onClose,
  userId,
  initialTitles = [],
  onSaved,
  isFirstTime = false,
}) {
  const [selectedTitles, setSelectedTitles] = useState(initialTitles || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialTitles && initialTitles.length > 0) {
      setSelectedTitles(initialTitles);
    }
  }, [initialTitles, isOpen]);

  if (!isOpen) return null;

  const toggleTitle = (title) => {
    setSelectedTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSelectAll = () => {
    if (selectedTitles.length === FLAT_TITLES.length) {
      setSelectedTitles([]);
    } else {
      setSelectedTitles([...FLAT_TITLES]);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!selectedTitles || selectedTitles.length === 0) {
      alert('Please select at least one game title.');
      return;
    }

    setSaving(true);
    try {
      // 1. Ensure clean array format
      const titlesArray = Array.isArray(selectedTitles) ? selectedTitles : [];

      // 2. Persist to profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          active_titles: titlesArray,
          esports_titles: titlesArray,
          primary_game: titlesArray[0] || 'Valorant',
        })
        .eq('id', userId);

      if (error) throw error;

      // 3. Broadcast instant update to all pages
      window.dispatchEvent(
        new CustomEvent('gg_titles_updated', {
          detail: { activeTitles: titlesArray, esports_titles: titlesArray }
        })
      );

      if (typeof onSaved === 'function') onSaved(titlesArray);
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error('[Save Titles Error]:', err.message || err);
      alert(`Failed to save titles: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#0b111e] border border-slate-300 dark:border-cyan-500/30 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-md dark:shadow-[0_0_40px_rgba(6,182,212,0.15)] relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold block mb-1">
              {isFirstTime ? 'ONBOARDING CALIBRATION' : 'TELEMETRY PREFERENCES'}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
              What Esports Titles Do You Play?
            </h2>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
              Select all games you actively compete in to enable peer reviews and telemetry tracking.
            </p>
          </div>
          {!isFirstTime && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 text-sm font-mono cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300">
            {selectedTitles.length} of {FLAT_TITLES.length} Titles Active
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline uppercase cursor-pointer border-none bg-transparent"
          >
            {selectedTitles.length === FLAT_TITLES.length ? 'Deselect All' : 'Select All Games'}
          </button>
        </div>

        {/* Categories & Title Badges */}
        <div className="space-y-5 mt-4">
          {ALL_ESPORTS_TITLES.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                {cat.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {cat.titles.map((title) => {
                  const isSelected = selectedTitles.includes(title);
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => toggleTitle(title)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500 dark:border-cyan-300'
                          : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? `✓ ${title}` : title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end gap-3">
          {!isFirstTime && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedTitles.length === 0}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-600 dark:hover:bg-cyan-300 transition shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Saving Preferences...' : 'Save & Confirm Titles'}
          </button>
        </div>

      </div>
    </div>
  );
}
