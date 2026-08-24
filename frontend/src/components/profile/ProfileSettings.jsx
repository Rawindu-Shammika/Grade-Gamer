import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { getRankStyle } from '../../utils/gameRankMap';
import { ShieldCheck, Award, Gamepad2, Layers, RefreshCw } from 'lucide-react';

/**
 * ProfileSettings Component (Verified Profile Tab)
 * 
 * - Strictly displays read-only data overview cards: Academic Profile, Competitive Profile, and Registered Genres.
 * - Adheres to GradeGamer dark cyber aesthetic theme.
 * - Does NOT contain any edit inputs, sliders, select boxes, or toggle buttons.
 */
export const ProfileSettings = ({ user }) => {
  const [allowAnon, setAllowAnon] = useState(true);
  const [frequency, setFrequency] = useState('Every match stream');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define active tracked games list
  const activeGames = ['FC26', 'F1 25', 'Valorant', 'CS2', 'Dota 2', 'Overwatch 2', 'League of Legends'];

  // Load user profile configurations from Supabase on mount
  useEffect(() => {
    const loadProfileOverview = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.allow_anonymous_reviews !== undefined) setAllowAnon(data.allow_anonymous_reviews);
          if (data.update_frequency) setFrequency(data.update_frequency);
          setSelectedGenres(data.registered_genres || data.esports_titles || data.active_titles || []);
        } else {
          // If no row exists, fallback to metadata values
          const initialGenres = user.user_metadata?.titles || [];
          setSelectedGenres(initialGenres);
        }
      } catch (err) {
        console.warn('Unexpected error loading profile overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileOverview();
  }, [user]);

  const metadata = user?.user_metadata || {};
  
  // Competitive profile rank tiers
  const rankTiers = metadata?.rank_tiers || {
    'FC26': 'Division 2',
    'F1 25': 'Platinum',
    'Valorant': 'Immortal',
    'CS2': 'Platinum',
    'Dota 2': 'Gold',
    'Overwatch 2': 'Gold',
    'League of Legends': 'Platinum'
  };

  const cardClass = 'bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6';
  const labelClass = 'block text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1';

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b4d8]" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Accessing Profile Registry...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 md:px-8 pb-12 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verified Profile</h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              Verified Registry Node Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Read-only overview metrics of academic identity records, esports credentials, and genres.
          </p>
        </div>
      </div>

      {/* Grid area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Academic Profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className={cardClass}>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-800 pb-2 flex items-center gap-2 font-mono">
              <Award className="w-4 h-4 text-[#00b4d8]" />
              Academic Profile
            </h3>
            
            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className={labelClass}>Gamer Tag Badge</span>
                <span className="text-sm font-black text-white uppercase">{metadata?.gamerTag || 'PlayerOne'}</span>
              </div>
              <div>
                <span className={labelClass}>Affiliated Institution</span>
                <span className="text-sm font-semibold text-slate-300">{metadata?.institution || 'SLIIT City Uni'}</span>
              </div>
              <div>
                <span className={labelClass}>Academic Level</span>
                <span className="text-sm font-semibold text-slate-300">{metadata?.eduLevel || 'Undergraduate'}</span>
              </div>
              <div className="border-t border-slate-800/80 pt-3">
                <span className={labelClass}>Registry UUID</span>
                <span className="text-[10px] font-mono text-slate-500 break-all">{user.id}</span>
              </div>
              <div>
                <span className={labelClass}>Telemetry Email</span>
                <span className="text-xs font-mono text-slate-400">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Competitive Profile */}
        <div className="lg:col-span-5 space-y-6">
          <div className={cardClass}>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-800 pb-2 flex items-center gap-2 font-mono">
              <Gamepad2 className="w-4 h-4 text-[#00b4d8]" />
              Competitive Profile
            </h3>

            <div className="space-y-4">
              <span className={labelClass}>Active Esports Tiers</span>
              <div className="space-y-3">
                {activeGames.map((game) => {
                  const rankName = rankTiers[game] || 'Unranked';
                  const style = getRankStyle(game, rankName);
                  return (
                    <div key={game} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                      <span className="text-xs font-bold font-mono tracking-wide text-slate-300 uppercase">{game}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} ${style.extra || ''}`}>
                        {rankName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Registered Genres & Parameters Overview */}
        <div className="lg:col-span-3 space-y-6">
          <div className={cardClass}>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-800 pb-2 flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-[#00b4d8]" />
              Registered Genres
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className={labelClass}>Status Settings</span>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Reviews Anonymous</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      allowAnon ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {allowAnon ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Sync Frequency</span>
                    <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">
                      {frequency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <span className={labelClass}>Registered Genres</span>
                {selectedGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedGenres.map((genre) => (
                      <span key={genre} className="px-2 py-1 rounded bg-[#00b4d8]/5 border border-[#00b4d8]/20 text-[9px] font-mono text-[#00b4d8] uppercase tracking-wider font-semibold">
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1 italic">No registered genres configuration found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfileSettings;
