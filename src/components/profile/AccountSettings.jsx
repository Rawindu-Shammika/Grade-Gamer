import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ShieldCheck, Check, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, X } from 'lucide-react';

/**
 * AccountSettings Component
 * 
 * - Handles interactive profile setting configurations: allow_anonymous_reviews, update_frequency, and registered_genres.
 * - Integrates directly with public.player_profiles database table.
 * - Used inside the floating settings modal overlay.
 */
export const AccountSettings = ({ user, onClose }) => {
  const [allowAnon, setAllowAnon] = useState(true);
  const [frequency, setFrequency] = useState('Every match stream');
  const [selectedGenres, setSelectedGenres] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success');

  const genresOptions = ['Sim Racing', 'FPS Shooters', 'MOBA', 'Battle Royale', 'Sports'];

  // Load user profile configurations from Supabase on mount
  useEffect(() => {
    const loadProfileSettings = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('player_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching settings:', error);
          setStatusMessage('Failed to load profile parameters.');
          setStatusType('error');
        } else if (data) {
          setAllowAnon(data.allow_anonymous_reviews);
          setFrequency(data.update_frequency);
          setSelectedGenres(data.registered_genres || []);
        } else {
          // If no row exists, fallback to user metadata registered genres
          const initialGenres = user.user_metadata?.titles || [];
          setSelectedGenres(initialGenres);
        }
      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileSettings();
  }, [user]);

  const handleGenreChange = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setStatusMessage(null);
    
    try {
      const { error } = await supabase
        .from('player_profiles')
        .upsert({
          user_id: user.id,
          allow_anonymous_reviews: allowAnon,
          update_frequency: frequency,
          registered_genres: selectedGenres
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }
      
      setStatusMessage('Verified Profile configurations synced successfully.');
      setStatusType('success');
      setTimeout(() => {
        setStatusMessage(null);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error('Save profile settings failed:', err);
      setStatusMessage(err.message || 'Failed to update configuration settings.');
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121620] border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-xl min-h-[300px] flex flex-col items-center justify-center space-y-4 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b4d8]" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Accessing Settings Registry...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-xl relative space-y-6">
      
      {/* Interactive Close button at the top right of the container */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        aria-label="Close Settings"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#00b4d8] font-mono">
          Account Settings Control Board
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Configure raw telemetry sharing preferences, platform automation frequencies, and genre scopes.
        </p>
      </div>

      {statusMessage && (
        <div className={`text-[11px] px-4 py-2.5 rounded-xl flex items-start gap-3 border animate-in fade-in duration-200 ${
          statusType === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {statusType === 'success' ? (
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
          )}
          <div>
            <span className="font-bold">{statusType === 'success' ? 'System Sync:' : 'Telemetry Failure:'}</span> {statusMessage}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveSettings} className="space-y-5">
        
        {/* Toggle option A: Allow Anonymous Reviews */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Allow Anonymous Reviews</span>
            <p className="text-[9px] text-slate-500 leading-normal">
              If enabled, other verified players can submit performance peer reviews for your matches anonymously.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAllowAnon(!allowAnon)}
            className="bg-transparent border-none cursor-pointer p-1 text-slate-400 hover:text-white transition-all active:scale-95 flex-shrink-0"
          >
            {allowAnon ? (
              <ToggleRight className="w-10 h-10 text-[#00b4d8]" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-600" />
            )}
          </button>
        </div>

        {/* Option B: Update Frequency */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-white uppercase tracking-wider">Telemetry Sync Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium cursor-pointer"
          >
            <option value="Every match stream">Every match stream</option>
            <option value="Daily summary">Daily summary</option>
            <option value="Weekly digest">Weekly digest</option>
            <option value="Manual refresh only">Manual refresh only</option>
          </select>
        </div>

        {/* Option C: Genres select list */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-white uppercase tracking-wider">Registered Scopes & Genres</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {genresOptions.map((genre) => {
              const isChecked = selectedGenres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => handleGenreChange(genre)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isChecked 
                      ? 'bg-[#00b4d8]/10 border-[#00b4d8] text-white shadow-md' 
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                    isChecked ? 'bg-[#00b4d8] border-[#00b4d8]' : 'border-slate-700'
                  }`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3.5]" />}
                  </div>
                  <span className="text-[10px] font-semibold uppercase font-mono tracking-wider">{genre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button footer */}
        <div className="pt-4 border-t border-slate-800/80 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs uppercase tracking-wider cursor-pointer font-bold"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-black py-2 px-5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer border-none shadow-md flex items-center gap-2 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                Syncing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                Save Settings
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default AccountSettings;
