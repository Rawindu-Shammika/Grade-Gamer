import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

const GAME_CATEGORIES = {
  'Valorant': 'FPS Shooters',
  'F1 25': 'Sim Racing',
  'Apex Legends': 'Battle Royale',
  'CS2': 'FPS Shooters',
  'Assetto Corsa': 'Sim Racing',
  'Rocket League': 'Sports Gaming'
};

export const CreateRosterModal = ({ isOpen, onClose, onRosterCreated, currentUser, selectedGame }) => {
  const [teamName, setTeamName] = useState('');
  const [iglProfile, setIglProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchIglProfile = async () => {
      if (!currentUser?.id || !isOpen) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, in_game_name, unique_account_id')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setIglProfile(data);
        }
      } catch (err) {
        console.error('Error fetching IGL profile:', err);
      }
    };

    fetchIglProfile();
  }, [currentUser?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMessage("Please enter a Roster Name.");
      return;
    }
    if (!currentUser) {
      setErrorMessage("Your session is currently offline.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const activeGame = selectedGame || 'Valorant';
      const category = GAME_CATEGORIES[activeGame] || 'Sim Racing';

      // 1. Insert team roster
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .insert({
          user_id: currentUser.id,
          team_name: teamName.trim(),
          game_title: activeGame,
          game_category: category
        })
        .select()
        .single();

      if (teamErr) throw teamErr;

      // 2. Automatically insert creator as IGL
      const { error: memberErr } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: currentUser.id,
          role: 'IGL'
        });

      if (memberErr) throw memberErr;

      setSuccessMessage(`Roster "${teamName}" established successfully!`);
      setTimeout(() => {
        if (onRosterCreated) onRosterCreated();
        onClose();
        setTeamName('');
        setSuccessMessage(null);
      }, 1500);

    } catch (err) {
      console.error('Failed to establish roster:', err);
      setErrorMessage(err.message || 'Failed to complete team establishment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121620] border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl dark:shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 p-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
              Establish Competitive Squad
            </h3>
            <p className="text-[10px] text-cyan-600 dark:text-[#00b4d8] font-mono tracking-widest uppercase">Roster Initialization Node</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-transparent border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Team Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Roster Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HYPERVISOR"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Read-Only Target Game Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase">
              Target Esports Discipline
            </label>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200 uppercase">
                {selectedGame || 'Sim Racing'}
              </span>
            </div>
          </div>

          {/* IGL Card (Read-Only Confirmation) */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-[#00b4d8] uppercase block">
              In-Game Leader (IGL) Info
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500/10 dark:from-[#00b4d8]/20 to-cyan-500/5 flex items-center justify-center text-cyan-600 dark:text-[#00b4d8] font-bold border border-cyan-500/20">
                  <Shield className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {iglProfile?.in_game_name || currentUser?.user_metadata?.in_game_name || 'Player'}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                    {iglProfile?.full_name || currentUser?.user_metadata?.full_name || 'Esports Athlete'}
                  </div>
                  <div className="text-[9px] text-cyan-600 dark:text-[#00b4d8] font-mono mt-0.5">
                    GradeGamer ID: {iglProfile?.unique_account_id || 'GG-000000'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-cyan-100 dark:bg-[#00b4d8]/10 border border-cyan-300 dark:border-[#00b4d8]/30 text-cyan-700 dark:text-[#00b4d8] text-[9px] font-bold font-mono uppercase">
                IGL / Captain
              </span>
            </div>
          </div>

          {/* Submit/Cancel footer */}
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
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-cyan-500 dark:bg-[#00b4d8] hover:bg-cyan-600 dark:hover:bg-[#0096c7] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-md dark:shadow-md dark:shadow-[#00b4d8]/10"
            >
              {isSubmitting ? 'Syncing...' : 'Establish Squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRosterModal;
