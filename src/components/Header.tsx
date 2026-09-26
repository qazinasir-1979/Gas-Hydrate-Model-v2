import React from 'react';
import { Beaker, BookOpen, Download, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'validation' | 'calculator' | 'envelope' | 'separation' | 'custom';
  setActiveTab: (tab: 'validation' | 'calculator' | 'envelope' | 'separation' | 'custom') => void;
  onOpenTheory: () => void;
  onExportCSV: () => void;
  onResetDefaults: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTheory,
  onExportCSV,
  onResetDefaults,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Title and Paper Citation */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  CO₂ + CH₄ Hydrate Phase Equilibria & Gas Separation
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Model Validated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thermodynamic modeling via Modified Chen-Guo, NRTL &amp; SRK EOS ·{' '}
                <span className="text-slate-300 font-medium">Haghighi &amp; Haghtalab (2024)</span>, Nat. Gas Ind. B
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={onOpenTheory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Mathematical equations &amp; methodology"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Model Theory &amp; Equations</span>
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Export validation dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onResetDefaults}
              className="inline-flex items-center p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition"
              title="Reset parameters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-slate-800/80 pt-1 -mb-px overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'validation'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validation Benchmark Suite</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              38 Pts · 1.98% AADP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calculator'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Beaker className="w-4 h-4" />
            <span>Equilibrium Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('envelope')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'envelope'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>P-T Phase Envelopes</span>
          </button>

          <button
            onClick={() => setActiveTab('separation')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'separation'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Gas Separation Efficiency</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Table 10 Fits
            </span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'custom'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Custom Point Validator</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
