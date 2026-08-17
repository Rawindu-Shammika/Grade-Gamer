import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, Lock, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const EditProfileModal = ({ isOpen, onClose, user, refreshProfile }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [primaryGame, setPrimaryGame] = useState('Valorant');
  const [gradeGamerId, setGradeGamerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setBio(data.bio || '');
          setPrimaryGame(data.primary_game || 'Valorant');
          setGradeGamerId(data.unique_account_id || '');
        }
      } catch (err) {
        console.error('Error fetching profile settings:', err);
      }
    };

    fetchProfile();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          bio: bio.trim(),
          primary_game: primaryGame
        });

      if (error) throw error;

      if (refreshProfile) {
        await refreshProfile();
      }

      setSuccessMessage('Profile & Resume details updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to persist settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121620] border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl dark:shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 p-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
              Profile & Resume Credentials
            </h3>
            <p className="text-[10px] text-cyan-600 dark:text-[#00b4d8] font-mono tracking-widest uppercase">Metadata Modification Node</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-transparent border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-grow">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Locked GradeGamer ID Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between relative">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
                Permanent GradeGamer ID
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{gradeGamerId || 'GG-XXXXXX'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <HelpCircle className="w-4 h-4 text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-400 transition-all" />
                {showTooltip && (
                  <div className="absolute right-0 bottom-6 w-48 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-[9px] font-mono uppercase text-slate-600 dark:text-slate-350 tracking-wider shadow-md dark:shadow-2xl z-55">
                    GradeGamer ID cannot be modified.
                  </div>
                )}
              </div>
              <Lock className="w-4 h-4 text-cyan-500 dark:text-[#00b4d8]" />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Full Name (Verified ATS Resume)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rawindu De Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Telephone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Telephone Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +94 77 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          {/* Residential Address / City */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Residential Address / City
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Colombo, Sri Lanka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Bio / Professional Summary
            </label>
            <textarea
              placeholder="A short summary of your professional capabilities and gaming skills."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl p-4 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-sans min-h-[80px] resize-none"
            />
          </div>

          {/* Primary Game */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Primary Competitive Title
            </label>
            <select
              value={primaryGame}
              onChange={(e) => setPrimaryGame(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-mono uppercase"
            >
              <option value="Sim Racing">Sim Racing</option>
              <option value="Valorant">Valorant</option>
              <option value="Apex Legends">Apex Legends</option>
              <option value="CS2">CS2</option>
            </select>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-850 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-cyan-500 dark:bg-[#00b4d8] hover:bg-cyan-600 dark:hover:bg-[#0096c7] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-md dark:shadow-md dark:shadow-[#00b4d8]/10"
            >
              {isSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
