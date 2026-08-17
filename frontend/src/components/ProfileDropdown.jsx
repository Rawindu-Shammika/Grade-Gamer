import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Users, MessageSquare, LogOut, Copy, Check } from 'lucide-react';

export const ProfileDropdown = ({ user, onClose, onOpenEditProfile, onViewChange, onLogout }) => {
  const [profileData, setProfileData] = useState({ inGameName: '', fullName: '', gradeGamerId: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('in_game_name, full_name, unique_account_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfileData({
            inGameName: data.in_game_name || user.user_metadata?.gamerTag || 'Player',
            fullName: data.full_name || user.user_metadata?.fullName || 'Full Name',
            gradeGamerId: data.unique_account_id || 'GG-XXXXXX'
          });
        }
      } catch (err) {
        console.error('Error loading dropdown profile info:', err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleCopyId = (e) => {
    e.stopPropagation();
    if (!profileData.gradeGamerId) return;
    navigator.clipboard.writeText(profileData.gradeGamerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (viewName) => {
    if (onViewChange) {
      onViewChange(viewName);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-3 w-72 bg-[#121620] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header Profile Card */}
      <div className="p-5 bg-slate-950/40 border-b border-slate-850 flex flex-col gap-3">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">
            {profileData.inGameName}
          </h4>
          <span className="text-[10px] text-slate-500 font-medium truncate block">
            {profileData.fullName}
          </span>
        </div>

        {/* GradeGamer ID Badge */}
        <div 
          onClick={handleCopyId}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850 cursor-pointer hover:border-[#00b4d8]/40 transition-all active:scale-[0.98]"
        >
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
              GradeGamer ID
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {profileData.gradeGamerId}
            </span>
          </div>
          <button 
            type="button" 
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Menu Options */}
      <div className="p-2 space-y-1 bg-[#121620]">
        <button
          onClick={() => { onOpenEditProfile(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-medium text-slate-350 hover:bg-slate-950 hover:text-white transition-all cursor-pointer border-none"
        >
          <User className="w-4 h-4 text-[#00b4d8]" />
          <span>Profile & Resume Details</span>
        </button>

        <button
          onClick={() => handleAction('rosters')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-medium text-slate-350 hover:bg-slate-950 hover:text-white transition-all cursor-pointer border-none"
        >
          <Users className="w-4 h-4 text-[#00b4d8]" />
          <span>My Rosters & Teams</span>
        </button>

        <button
          onClick={() => handleAction('messages')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-medium text-slate-350 hover:bg-slate-950 hover:text-white transition-all cursor-pointer border-none"
        >
          <MessageSquare className="w-4 h-4 text-[#00b4d8]" />
          <span>Direct Messages</span>
        </button>

        <div className="h-px bg-slate-850/60 my-1 mx-2" />

        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all cursor-pointer border-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
