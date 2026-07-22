import React from 'react';
import { X } from 'lucide-react';

/**
 * FAQModal Component
 * 
 * - Renders a modal box containing frequently asked questions.
 * - Adheres strictly to the dark cyber aesthetic layout specifications.
 */
export const FAQModal = ({ onClose }) => {
  return (
    <div className="bg-[#111622] border border-slate-800 p-8 rounded-xl max-w-2xl text-slate-200 font-sans shadow-2xl relative overflow-hidden w-full">
      {/* Cyan Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>

      {/* Close Button ('X' icon) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        aria-label="Close FAQ Modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header Section */}
      <div className="mb-6">
        <span className="text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1 block">
          HELP DESK FAQ
        </span>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-400 text-sm">
          Find quick answers to common platform inquiries.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Item 1 */}
        <div className="bg-[#161b26] border border-slate-800/80 p-5 rounded-xl space-y-2">
          <h3 className="text-cyan-400 font-bold text-base">
            Q: How does GradeGamer track my skill growth?
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            A: We use standard linear formulas to track your match scores and show your improvement over time.
          </p>
        </div>

        {/* Item 2 */}
        <div className="bg-[#161b26] border border-slate-800/80 p-5 rounded-xl space-y-2">
          <h3 className="text-cyan-400 font-bold text-base">
            Q: Can employers see my personal school schedule?
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            A: No, your public profile only shows your verified soft skills and workload management scores to protect your privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQModal;
