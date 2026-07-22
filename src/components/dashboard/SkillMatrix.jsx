import React from 'react';
import { Award, Zap, Heart, MessageSquare, TrendingUp } from 'lucide-react';

const SKILLS_DATA = [
  {
    title: 'Economy Management',
    status: 'Elite Status',
    accuracy: '94%',
    desc: 'Maintains optimal credit allocations and equipment buys. Minimizes waste during structural buy rounds.',
    fill: 'bg-teal-500',
    border: 'border-teal-500/20',
    text: 'text-teal-400',
    width: '94%',
    icon: <Zap className="w-4 h-4 text-teal-400" />
  },
  {
    title: 'Leadership Skills',
    status: 'Master Status',
    accuracy: '88%',
    desc: 'Sets strategy vectors under heavy pressure. Leads strategic entry executions and spacing calls.',
    fill: 'bg-blue-500',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    width: '88%',
    icon: <Award className="w-4 h-4 text-blue-400" />
  },
  {
    title: 'Communication Skills',
    status: 'Excellent Status',
    accuracy: '82%',
    desc: 'Relays clean information coordinates. Maximizes rotation warnings and spatial tracking broadcasts.',
    fill: 'bg-cyan-500',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    width: '82%',
    icon: <MessageSquare className="w-4 h-4 text-cyan-400" />
  },
  {
    title: 'Stress Management',
    status: 'Master Status',
    accuracy: '86%',
    desc: 'Controls heart rate during high-pressure clutch states. Keeps high mechanical parsing accuracy.',
    fill: 'bg-orange-500',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    width: '86%',
    icon: <Heart className="w-4 h-4 text-orange-400" />
  }
];

/**
 * SkillMatrix Component
 * 
 * - Renders evaluated peer metrics inside an HR layout grid.
 * - Displays accuracy tags, performance status titles, descriptions, and progress fill bars.
 */
export const SkillMatrix = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4 text-[#00b4d8]" />
          Lower Professional Skill Mapping Matrix
        </h3>
        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">
          Evaluated Peer Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SKILLS_DATA.map((skill) => (
          <div 
            key={skill.title} 
            className={`p-5 rounded-xl bg-[#161b26] border ${skill.border} shadow-lg space-y-4`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex-shrink-0">
                  {skill.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">{skill.title}</h4>
                  <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${skill.text}`}>
                    {skill.status}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-black text-white font-mono bg-slate-950 border border-white/5 px-2 py-1 rounded-lg">
                  {skill.accuracy}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {skill.desc}
            </p>

            {/* Accented progress fill bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden border border-white/5 p-[1px]">
                <div 
                  style={{ width: skill.width }}
                  className={`h-full rounded-full ${skill.fill} transition-all duration-1000 ease-out`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillMatrix;
