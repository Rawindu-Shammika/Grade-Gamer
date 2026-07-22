import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

/**
 * ProfileSettingsModal Component
 * 
 * - Renders details of the active player credentials from Supabase auth and profile.
 * - Displays active eSports titles.
 * - Provides a confirmed account deletion workflow.
 */
export const ProfileSettingsModal = ({ user, onClose, onStartDeletion }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      <div className="bg-[#111622] border border-slate-800 p-8 rounded-xl max-w-2xl w-full text-slate-200 font-sans shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-4 py-16">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Loading profile parameters...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111622] border border-slate-800 p-8 rounded-xl max-w-2xl w-full text-slate-200 font-sans shadow-2xl relative overflow-hidden">
      {/* Cyan Left Accent Rule */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>

      {/* Close button X */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        aria-label="Close Profile Settings Modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header Block */}
      <div className="mb-6">
        <span className="text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1 block font-mono">
          USER DATA PROFILE
        </span>
        <h2 className="text-3xl font-extrabold text-white mb-1">
          Your Profile Details
        </h2>
        <p className="text-slate-400 text-sm">
          Verify your student athlete basic credentials.
        </p>
      </div>

      {/* Credentials Data Box */}
      <div className="bg-[#161b26] border border-slate-800/80 rounded-xl p-5 space-y-3 mb-6">
        <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
          <span className="text-slate-400 font-semibold uppercase font-mono">Full Name</span>
          <span className="text-white font-bold">{fullName}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
          <span className="text-slate-400 font-semibold uppercase font-mono">Email Address</span>
          <span className="text-white font-bold">{email}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
          <span className="text-slate-400 font-semibold uppercase font-mono">Education Level</span>
          <span className="text-white font-bold">{eduLevel}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
          <span className="text-slate-400 font-semibold uppercase font-mono">Institution</span>
          <span className="text-white font-bold">{institution}</span>
        </div>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-slate-400 font-semibold uppercase font-mono">Gaming Tag</span>
          <span className="text-cyan-400 font-bold font-mono">{gamerTag}</span>
        </div>
      </div>

      {/* Selected Esports Titles Section */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">
          YOUR SELECTED ESPORTS TITLES
        </h3>
        <div className="flex flex-wrap gap-2">
          {genres.length > 0 ? (
            genres.map((genre) => (
              <span
                key={genre}
                className="border border-cyan-500/50 text-cyan-400 bg-cyan-950/20 px-4 py-1.5 rounded-full text-xs font-medium font-mono"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 font-medium">No titles selected</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-slate-800/80 my-5"></div>

      {/* Danger Zone / Account Deletion Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">Danger Zone</h4>
            <p className="text-[10px] text-slate-400">Permanently delete your profile and account from GradeGamer.</p>
          </div>
        </div>
        <button
          onClick={handleDeleteAccountClick}
          className="border border-red-500/50 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          DELETE ACCOUNT
        </button>
      </div>

      {/* Initial Deletion Confirmation Dialog overlay */}
      {showConfirmDialog && (
        <div className="absolute inset-0 bg-[#0b0f19]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
          <div className="max-w-md space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Delete GradeGamer Account?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your profile, telemetry records, and roster memberships will be permanently deleted. You will have 10 seconds to undo this action after clicking confirm.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  onStartDeletion();
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer border-none shadow-lg shadow-red-600/20"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsModal;
