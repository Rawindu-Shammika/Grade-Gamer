import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import useAuth from '../../hooks/useAuth';

/**
 * ProfileSettingsModal Component
 * 
 * - Renders details of the active player credentials from Supabase auth and profile.
 * - Displays active eSports titles.
 * - Provides a confirmed account deletion workflow.
 */
export const ProfileSettingsModal = ({ user, onClose, onStartDeletion }) => {
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = (uniqueId) => {
    if (!uniqueId) return;
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from('player_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile settings modal details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleDeleteAccountClick = () => {
    setShowConfirmDialog(true);
  };

  const metadata = user?.user_metadata || {};
  const fullName = metadata.fullName || 'N/A';
  const email = user?.email || 'N/A';
  const eduLevel = metadata.eduLevel || 'Undergraduate';
  const institution = metadata.institution || 'Academic Institution';
  const gamerTag = metadata.gamerTag || 'N/A';
  const genres = profile?.registered_genres || metadata.titles || [];

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-8 rounded-xl max-w-2xl w-full text-slate-900 dark:text-slate-200 font-sans shadow-md dark:shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-4 py-16">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 dark:bg-cyan-400"></div>
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400" />
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Loading profile parameters...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-8 rounded-xl max-w-2xl w-full text-slate-900 dark:text-slate-200 font-sans shadow-lg dark:shadow-2xl relative overflow-hidden">
      {/* Cyan Left Accent Rule */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 dark:bg-cyan-400"></div>

      {/* Close button X */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        aria-label="Close Profile Settings Modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header Block */}
      <div className="mb-6">
        <span className="text-cyan-600 dark:text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1 block font-mono">
          USER DATA PROFILE
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
          Your Profile Details
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Verify your student athlete basic credentials.
        </p>
      </div>

      {/* Credentials Data Box */}
      <div className="bg-slate-50 dark:bg-[#161b26] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 space-y-3 mb-6">
        {/* GradeGamer ID Row */}
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            GRADEGAMER ID
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyId(authProfile?.unique_account_id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all duration-200 cursor-pointer ${
                copied
                  ? 'bg-cyan-100 dark:bg-cyan-500/20 border-cyan-400 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:border-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
              }`}
              title="Click to copy GradeGamer ID"
            >
              <span>{authProfile?.unique_account_id || 'GG-000000'}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300 animate-in zoom-in duration-150"/>
              ) : (
                <Copy className="w-3.5 h-3.5 text-cyan-500/70 dark:text-cyan-400/70 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition"/>
              )}
            </button>
            {copied && (
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 animate-in fade-in duration-150">
                COPIED!
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-800/40 pb-2 pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase font-mono">Full Name</span>
          <span className="text-slate-900 dark:text-white font-bold">{fullName}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-800/40 pb-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase font-mono">Email Address</span>
          <span className="text-slate-900 dark:text-white font-bold">{email}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-800/40 pb-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase font-mono">Education Level</span>
          <span className="text-slate-900 dark:text-white font-bold">{eduLevel}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-800/40 pb-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase font-mono">Institution</span>
          <span className="text-slate-900 dark:text-white font-bold">{institution}</span>
        </div>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase font-mono">Gaming Tag</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">{gamerTag}</span>
        </div>
      </div>

      {/* Selected Esports Titles Section */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-mono">
          YOUR SELECTED ESPORTS TITLES
        </h3>
        <div className="flex flex-wrap gap-2">
          {genres.length > 0 ? (
            genres.map((genre) => (
              <span
                key={genre}
                className="border border-cyan-300 dark:border-cyan-500/50 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 px-4 py-1.5 rounded-full text-xs font-medium font-mono"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 font-medium">No titles selected</span>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProfileSettingsModal;
