import React, { useState, useMemo } from 'react';
import { PureValidationPoint, MixtureValidationPoint } from '../thermo/types';
import { PURE_GAS_VALIDATION_DATA, MIXTURE_VALIDATION_DATA, LITERATURE_COMPARISON } from '../thermo/validationData';
import { solveHydrateEquilibrium } from '../thermo/solver';
import { CheckCircle2, TrendingUp, Filter, Eye, AlertCircle, BarChart3, HelpCircle } from 'lucide-react';

interface ValidationViewProps {
  onInspectPoint: (temperature: number, yCO2: number) => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ onInspectPoint }) => {
  // Filters
  const [selectedComposition, setSelectedComposition] = useState<string>('all');
  const [activeChart, setActiveChart] = useState<'parity' | 'pt' | 'z_vs_p' | 'deviation'>('parity');
  const [calcSource, setCalcSource] = useState<'paper' | 'live'>('paper');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Combine pure and mixture datasets
  const combinedData = useMemo(() => {
    const pureMapped = PURE_GAS_VALIDATION_DATA.map((p, idx) => ({
      id: `pure-${p.gas}-${idx}`,
      system: p.gas === 'CO2' ? 'Pure CO₂' : 'Pure CH₄',
      gasType: p.gas,
      yCO2: p.gas === 'CO2' ? 1.0 : 0.0,
      yCH4: p.gas === 'CO2' ? 0.0 : 1.0,
      temperature: p.temperature,
      pExpt: p.pExpt,
      pCalcPaper: p.pCalcPaper,
      adpPaper: p.adpPaper,
      zCO2: p.gas === 'CO2' ? 1.0 : 0.0,
      zCH4: p.gas === 'CO2' ? 0.0 : 1.0,
      reference: p.gas === 'CO2' ? 'Haghighi & Haghtalab (2024)' : 'This work / Lit.',
    }));

    const mixMapped = MIXTURE_VALIDATION_DATA.map((m) => ({
      id: m.id,
      system: `${Math.round(m.yCO2 * 100)}% CO₂ + ${Math.round((1 - m.yCO2) * 100)}% CH₄`,
      gasType: 'Mixture' as const,
      yCO2: m.yCO2,
      yCH4: 1.0 - m.yCO2,
      temperature: m.temperature,
      pExpt: m.pExpt,
      pCalcPaper: m.pCalcPaper,
      adpPaper: m.adpPaper,
      zCO2: m.zCO2Paper ?? m.yCO2,
      zCH4: m.zCH4Paper ?? (1 - m.yCO2),
      reference: m.reference ?? 'Adisasmito et al. (1991)',
    }));

    return [...pureMapped, ...mixMapped];
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (selectedComposition === 'all') return combinedData;
    if (selectedComposition === 'pure_co2') return combinedData.filter((d) => d.yCO2 === 1.0);
    if (selectedComposition === 'pure_ch4') return combinedData.filter((d) => d.yCO2 === 0.0);
    const targetPercent = parseInt(selectedComposition, 10);
    return combinedData.filter((d) => Math.round(d.yCO2 * 100) === targetPercent);
  }, [combinedData, selectedComposition]);

  // Statistics
  const stats = useMemo(() => {
    const pureCO2 = PURE_GAS_VALIDATION_DATA.filter((p) => p.gas === 'CO2');
    const pureCH4 = PURE_GAS_VALIDATION_DATA.filter((p) => p.gas === 'CH4');
    const mix = MIXTURE_VALIDATION_DATA;

    const pureCO2_AADP = pureCO2.reduce((acc, c) => acc + c.adpPaper, 0) / pureCO2.length;
    const pureCH4_AADP = pureCH4.reduce((acc, c) => acc + c.adpPaper, 0) / pureCH4.length;
    const mixture_AADP = mix.reduce((acc, c) => acc + c.adpPaper, 0) / mix.length;
    const total_AADP =
      (pureCO2.reduce((acc, c) => acc + c.adpPaper, 0) +
        pureCH4.reduce((acc, c) => acc + c.adpPaper, 0) +
        mix.reduce((acc, c) => acc + c.adpPaper, 0)) /
      (pureCO2.length + pureCH4.length + mix.length);

    return {
      pureCO2_AADP,
      pureCH4_AADP,
      mixture_AADP,
      total_AADP,
      totalPoints: pureCO2.length + pureCH4.length + mix.length,
    };
  }, []);

  // Color generator for gas compositions
  const getColorForComposition = (yCO2: number) => {
    if (yCO2 === 1.0) return '#06b6d4'; // cyan for pure CO2
    if (yCO2 === 0.0) return '#f59e0b'; // amber for pure CH4
    const p = Math.round(yCO2 * 100);
    if (p === 8) return '#8b5cf6';
    if (p === 13) return '#3b82f6';
    if (p === 22 || p === 25) return '#10b981';
    if (p === 39 || p === 40) return '#14b8a6';
    if (p === 44) return '#6366f1';
    if (p === 50) return '#ec4899'; // pink/magenta for author experimental data
    if (p === 68) return '#f43f5e';
    return '#64748b';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Empirical &amp; Experimental Validation Completed
              </span>
              <span className="text-xs text-slate-400">
                Benchmark vs 38 Experimental Points (Tables 6, 7, 8 &amp; 9)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              Thermodynamic Model Validation Benchmark
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
              Comparison between experimentally measured hydrate equilibrium pressures and those calculated
              using the modified Chen–Guo base hydrate fugacity correlation with novel modification function{' '}
              <code className="text-blue-400 bg-slate-800 px-1 py-0.5 rounded text-[11px]">I(T, yCO₂)</code>, NRTL water activity, and SRK equation of state.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Active Model</div>
              <div className="text-xs font-medium text-blue-400">Haghighi &amp; Haghtalab (2024)</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Mixture AADP</div>
              <div className="text-base font-bold text-emerald-400">1.98%</div>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pure CO₂ AADP (Table 6)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">{stats.pureCO2_AADP.toFixed(2)}%</span>
              <span className="text-xs text-slate-400">5 data points</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              T: 277.8 – 281.1 K · P: 21.1 – 37.5 bar
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pure CH₄ AADP (Table 6)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">{stats.pureCH4_AADP.toFixed(2)}%</span>
              <span className="text-xs text-slate-400">6 data points</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              T: 275.3 – 279.6 K · P: 31.5 – 53.5 bar
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              CO₂ + CH₄ Mixture AADP (Table 7)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.mixture_AADP.toFixed(2)}%</span>
              <span className="text-xs text-slate-400">27 data points</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              yCO₂: 8% – 68% · 273.7 – 287.6 K
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Overall Benchmark AADP
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-400">{stats.total_AADP.toFixed(2)}%</span>
              <span className="text-xs text-slate-400">38 total points</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Literature: 6.6% (Chen-Guo) · 8.8% (aw=1)
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Chart Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Validation Graphical Analysis
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveChart('parity')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeChart === 'parity' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Parity Plot (P_calc vs P_exp)
            </button>
            <button
              onClick={() => setActiveChart('pt')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeChart === 'pt' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              P-T Diagram (Fig. 6 &amp; 7)
            </button>
            <button
              onClick={() => setActiveChart('z_vs_p')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeChart === 'z_vs_p' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hydrate z_CO₂ vs P (Fig. 8 &amp; 9)
            </button>
            <button
              onClick={() => setActiveChart('deviation')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeChart === 'deviation' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Error Distribution
            </button>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative min-h-[380px] bg-slate-950 rounded-lg p-4 border border-slate-800/80">
          {activeChart === 'parity' && (
            <ParityPlotSVG
              data={filteredData}
              getColor={getColorForComposition}
              onHoverPoint={setHoveredPoint}
            />
          )}

          {activeChart === 'pt' && (
            <PTDiagramSVG
              data={filteredData}
              getColor={getColorForComposition}
              onHoverPoint={setHoveredPoint}
            />
          )}

          {activeChart === 'z_vs_p' && (
            <ZvsPPlotSVG
              data={filteredData}
              getColor={getColorForComposition}
              onHoverPoint={setHoveredPoint}
            />
          )}

          {activeChart === 'deviation' && (
            <DeviationHistogramSVG data={filteredData} />
          )}

          {/* Hover tooltip overlay */}
          {hoveredPoint && (
            <div className="absolute top-6 right-6 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur text-xs pointer-events-none z-20 space-y-1 w-64">
              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                {hoveredPoint.system}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <span className="text-slate-400">Temperature:</span>
                <span className="font-mono text-slate-200">
                  {hoveredPoint.temperature} K ({(hoveredPoint.temperature - 273.15).toFixed(2)} °C)
                </span>

                <span className="text-slate-400">P_experimental:</span>
                <span className="font-mono text-amber-400">{hoveredPoint.pExpt.toFixed(2)} bar</span>

                <span className="text-slate-400">P_calculated:</span>
                <span className="font-mono text-blue-400">{hoveredPoint.pCalcPaper.toFixed(2)} bar</span>

                <span className="text-slate-400">Absolute Deviation:</span>
                <span className="font-mono text-emerald-400">{hoveredPoint.adpPaper.toFixed(2)}%</span>

                <span className="text-slate-400">Hydrate z_CO₂:</span>
                <span className="font-mono text-cyan-400">{hoveredPoint.zCO2 ? (hoveredPoint.zCO2 * 100).toFixed(2) + '%' : 'N/A'}</span>

                <span className="text-slate-400">Reference:</span>
                <span className="text-slate-300 truncate">{hoveredPoint.reference}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend for gas compositions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-800/80">
          <span className="text-slate-400 font-medium">Composition series:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Pure CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Pure CH₄</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span className="text-slate-300">50% CO₂ (Haghighi &amp; Haghtalab)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">68% CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-300">44% CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-300">39–40% CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">22–25% CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-300">13% CO₂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-300">8% CO₂</span>
          </div>
        </div>
      </div>

      {/* Model Comparison Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">
              Literature Model Accuracy Comparison (Reported in Paper Section 4)
            </h3>
            <p className="text-xs text-slate-400">
              Benchmark of Average Absolute Deviation Percent (AADP%) against other established models for CO₂ + CH₄ hydrate systems.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            Lowest Error: This Work (1.98%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Thermodynamic Model &amp; Authors</th>
                <th className="py-2.5 px-3 text-center">Pure CO₂ AADP%</th>
                <th className="py-2.5 px-3 text-center">Pure CH₄ AADP%</th>
                <th className="py-2.5 px-3 text-center">CO₂ + CH₄ Mixture AADP%</th>
                <th className="py-2.5 px-3">Key Features &amp; Differences</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {LITERATURE_COMPARISON.map((lit, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    lit.highlight ? 'bg-emerald-950/20 font-medium text-slate-100' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    {lit.highlight && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span>{lit.model}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {lit.pureCO2_AADP ? `${lit.pureCO2_AADP.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {lit.pureCH4_AADP ? `${lit.pureCH4_AADP.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded ${
                        lit.highlight
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-slate-300'
                      }`}
                    >
                      {lit.mixture_AADP.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{lit.features}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Data Table with Filtering and Inspect */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">
              Complete Experimental Validation Dataset (Tables 6 &amp; 7)
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredData.length} of {combinedData.length} validated data points. Click any row to inspect full thermodynamic state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedComposition}
              onChange={(e) => setSelectedComposition(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Compositions (38 points)</option>
              <option value="pure_co2">Pure CO₂ (5 points)</option>
              <option value="pure_ch4">Pure CH₄ (6 points)</option>
              <option value="50">50% CO₂ (This work, 5 points)</option>
              <option value="68">68% CO₂ (2 points)</option>
              <option value="44">44% CO₂ (2 points)</option>
              <option value="40">40% CO₂ (2 points)</option>
              <option value="39">39% CO₂ (3 points)</option>
              <option value="25">25% CO₂ (2 points)</option>
              <option value="22">22% CO₂ (2 points)</option>
              <option value="13">13% CO₂ (5 points)</option>
              <option value="8">8% CO₂ (4 points)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">System / Feed</th>
                <th className="py-2.5 px-3">T (K)</th>
                <th className="py-2.5 px-3">T (°C)</th>
                <th className="py-2.5 px-3">P_exp (bar)</th>
                <th className="py-2.5 px-3">P_calc (bar)</th>
                <th className="py-2.5 px-3">ADP (%)</th>
                <th className="py-2.5 px-3">Hydrate z_CO₂</th>
                <th className="py-2.5 px-3">Hydrate z_CH₄</th>
                <th className="py-2.5 px-3">Data Reference</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredData.map((row) => {
                const isAuthorWork = row.reference.includes('This work');
                const isOptimal = row.adpPaper <= 2.0;
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/60 transition-colors ${
                      isAuthorWork ? 'bg-pink-950/10' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-medium flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: getColorForComposition(row.yCO2) }}
                      />
                      <span>{row.system}</span>
                      {isAuthorWork && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          Authors' Rig
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">{row.temperature.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {(row.temperature - 273.15).toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-amber-400 font-semibold">{row.pExpt.toFixed(2)}</td>
                    <td className="py-2 px-3 text-blue-400 font-semibold">{row.pCalcPaper.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                          isOptimal
                            ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {row.adpPaper.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-400">
                      {row.zCO2 !== undefined ? (row.zCO2 * 100).toFixed(2) + '%' : '—'}
                    </td>
                    <td className="py-2 px-3 text-amber-400">
                      {row.zCH4 !== undefined ? (row.zCH4 * 100).toFixed(2) + '%' : '—'}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-400 text-[11px] truncate max-w-[150px]">
                      {row.reference}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onInspectPoint(row.temperature, row.yCO2)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition"
                        title="Load into Equilibrium Calculator"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTS: Custom Responsive SVG Charts --- */

interface ChartProps {
  data: any[];
  getColor: (yCO2: number) => string;
  onHoverPoint: (point: any | null) => void;
}

/**
 * Parity Plot SVG (Calculated Pressure vs Experimental Pressure)
 */
const ParityPlotSVG: React.FC<ChartProps> = ({ data, getColor, onHoverPoint }) => {
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const minVal = 10;
  const maxVal = 130;

  const scale = (val: number) => ((val - minVal) / (maxVal - minVal)) * plotW;
  const scaleY = (val: number) => plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

  // Ticks at 20, 40, 60, 80, 100, 120
  const ticks = [20, 40, 60, 80, 100, 120];

  return (
    <div className="w-full h-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[380px] select-none"
        onMouseLeave={() => onHoverPoint(null)}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <line
                x1={scale(t)}
                y1={0}
                x2={scale(t)}
                y2={plotH}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <line
                x1={0}
                y1={scaleY(t)}
                x2={plotW}
                y2={scaleY(t)}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              {/* Tick labels */}
              <text
                x={scale(t)}
                y={plotH + 20}
                fill="#64748b"
                fontSize={10}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {t}
              </text>
              <text
                x={-10}
                y={scaleY(t) + 4}
                fill="#64748b"
                fontSize={10}
                textAnchor="end"
                fontFamily="monospace"
              >
                {t}
              </text>
            </React.Fragment>
          ))}

          {/* +10% and -10% error margin corridor */}
          <polygon
            points={`
              ${scale(minVal)},${scaleY(minVal * 1.1)}
              ${scale(maxVal / 1.1)},${scaleY(maxVal)}
              ${scale(maxVal)},${scaleY(maxVal)}
              ${scale(maxVal)},${scaleY(maxVal * 0.9)}
              ${scale(minVal / 0.9)},${scaleY(minVal)}
              ${scale(minVal)},${scaleY(minVal * 0.9)}
            `}
            fill="#3b82f6"
            fillOpacity={0.04}
          />

          {/* +5% and -5% error margin corridor */}
          <line
            x1={scale(minVal)}
            y1={scaleY(minVal * 1.05)}
            x2={scale(maxVal / 1.05)}
            y2={scaleY(maxVal)}
            stroke="#10b981"
            strokeOpacity={0.35}
            strokeDasharray="4 4"
          />
          <line
            x1={scale(minVal)}
            y1={scaleY(minVal * 0.95)}
            x2={scale(maxVal)}
            y2={scaleY(maxVal * 0.95)}
            stroke="#10b981"
            strokeOpacity={0.35}
            strokeDasharray="4 4"
          />

          {/* 1:1 Parity Diagonal */}
          <line
            x1={scale(minVal)}
            y1={scaleY(minVal)}
            x2={scale(maxVal)}
            y2={scaleY(maxVal)}
            stroke="#94a3b8"
            strokeWidth={1.5}
          />

          {/* Data Points */}
          {data.map((pt, i) => {
            const cx = scale(pt.pExpt);
            const cy = scaleY(pt.pCalcPaper);
            const color = getColor(pt.yCO2);

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={5}
                fill={color}
                stroke="#0f172a"
                strokeWidth={1.5}
                className="cursor-pointer hover:r-7 transition-all opacity-90 hover:opacity-100"
                onMouseEnter={() => onHoverPoint(pt)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={plotW / 2}
            y={plotH + 36}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Experimental Hydrate Equilibrium Pressure P_expt (bar)
          </text>
          <text
            transform="rotate(-90)"
            x={-plotH / 2}
            y={-40}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Calculated Pressure P_calc (bar)
          </text>
        </g>
      </svg>
      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-slate-400 inline-block" /> 1:1 Parity Line
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t border-dashed border-emerald-500 inline-block" /> ±5% Error Band
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-500/10 border border-blue-500/20 inline-block" /> ±10% Confidence Corridor
        </span>
      </div>
    </div>
  );
};

/**
 * Pressure vs Temperature Phase Diagram (Fig. 6 & 7)
 */
const PTDiagramSVG: React.FC<ChartProps> = ({ data, getColor, onHoverPoint }) => {
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const tMin = 273.0; // K
  const tMax = 289.0;
  const pMin = 10.0; // bar
  const pMax = 120.0;

  const scaleX = (T: number) => ((T - tMin) / (tMax - tMin)) * plotW;
  const scaleY = (P: number) => plotH - ((P - pMin) / (pMax - pMin)) * plotH;

  const tTicks = [274, 276, 278, 280, 282, 284, 286, 288];
  const pTicks = [20, 40, 60, 80, 100, 120];

  // Group data by gas composition to draw smooth lines
  const groupedData = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const d of data) {
      const key = Math.round(d.yCO2 * 100);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    // Sort each group by temperature
    for (const [k, pts] of map.entries()) {
      pts.sort((a, b) => a.temperature - b.temperature);
    }
    return Array.from(map.entries());
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[380px] select-none"
        onMouseLeave={() => onHoverPoint(null)}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {tTicks.map((t) => (
            <React.Fragment key={t}>
              <line
                x1={scaleX(t)}
                y1={0}
                x2={scaleX(t)}
                y2={plotH}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={scaleX(t)}
                y={plotH + 18}
                fill="#64748b"
                fontSize={10}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {t} K
              </text>
            </React.Fragment>
          ))}

          {pTicks.map((p) => (
            <React.Fragment key={p}>
              <line
                x1={0}
                y1={scaleY(p)}
                x2={plotW}
                y2={scaleY(p)}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={-10}
                y={scaleY(p) + 4}
                fill="#64748b"
                fontSize={10}
                textAnchor="end"
                fontFamily="monospace"
              >
                {p}
              </text>
            </React.Fragment>
          ))}

          {/* Model calculated lines */}
          {groupedData.map(([yPercent, pts]) => {
            const color = getColor(pts[0].yCO2);
            if (pts.length < 2) return null;
            const pathD = pts.reduce((acc, curr, idx) => {
              const x = scaleX(curr.temperature);
              const y = scaleY(curr.pCalcPaper);
              return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            return (
              <path
                key={yPercent}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.8}
              />
            );
          })}

          {/* Experimental data points */}
          {data.map((pt, i) => {
            const cx = scaleX(pt.temperature);
            const cy = scaleY(pt.pExpt);
            const color = getColor(pt.yCO2);

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={5.5}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
                className="cursor-pointer hover:r-7 transition-all"
                onMouseEnter={() => onHoverPoint(pt)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={plotW / 2}
            y={plotH + 36}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Temperature T (K)
          </text>
          <text
            transform="rotate(-90)"
            x={-plotH / 2}
            y={-40}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Hydrate Equilibrium Pressure P (bar)
          </text>
        </g>
      </svg>
      <div className="text-[11px] text-slate-400 mt-1">
        Solid curves represent Modified Chen–Guo model calculations; circles represent experimental equilibrium points.
      </div>
    </div>
  );
};

/**
 * Hydrate Phase CO2 Mole Fraction vs Pressure (Fig. 8 & 9, Table 10)
 */
const ZvsPPlotSVG: React.FC<ChartProps> = ({ data, getColor, onHoverPoint }) => {
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const pMin = 15;
  const pMax = 115;
  const zMin = 0.2;
  const zMax = 0.95;

  const scaleX = (p: number) => ((p - pMin) / (pMax - pMin)) * plotW;
  const scaleY = (z: number) => plotH - ((z - zMin) / (zMax - zMin)) * plotH;

  const pTicks = [20, 40, 60, 80, 100];
  const zTicks = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  // Group mixture points by feed CO2 fraction
  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const d of data) {
      if (d.yCO2 > 0 && d.yCO2 < 1.0) {
        const key = Math.round(d.yCO2 * 100);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(d);
      }
    }
    for (const [k, pts] of map.entries()) {
      pts.sort((a, b) => a.pExpt - b.pExpt);
    }
    return Array.from(map.entries());
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[380px] select-none"
        onMouseLeave={() => onHoverPoint(null)}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {pTicks.map((p) => (
            <React.Fragment key={p}>
              <line
                x1={scaleX(p)}
                y1={0}
                x2={scaleX(p)}
                y2={plotH}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={scaleX(p)}
                y={plotH + 18}
                fill="#64748b"
                fontSize={10}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {p} bar
              </text>
            </React.Fragment>
          ))}

          {zTicks.map((z) => (
            <React.Fragment key={z}>
              <line
                x1={0}
                y1={scaleY(z)}
                x2={plotW}
                y2={scaleY(z)}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={-10}
                y={scaleY(z) + 4}
                fill="#64748b"
                fontSize={10}
                textAnchor="end"
                fontFamily="monospace"
              >
                {z.toFixed(2)}
              </text>
            </React.Fragment>
          ))}

          {/* Linear regression trendlines */}
          {grouped.map(([yPercent, pts]) => {
            const color = getColor(pts[0].yCO2);
            if (pts.length < 2) return null;
            const first = pts[0];
            const last = pts[pts.length - 1];

            return (
              <line
                key={yPercent}
                x1={scaleX(first.pExpt)}
                y1={scaleY(first.zCO2)}
                x2={scaleX(last.pExpt)}
                y2={scaleY(last.zCO2)}
                stroke={color}
                strokeWidth={1.8}
                strokeDasharray="4 2"
              />
            );
          })}

          {/* Points */}
          {grouped.flatMap(([_, pts]) =>
            pts.map((pt, idx) => (
              <circle
                key={`${pt.id}-${idx}`}
                cx={scaleX(pt.pExpt)}
                cy={scaleY(pt.zCO2)}
                r={5}
                fill={getColor(pt.yCO2)}
                stroke="#0f172a"
                strokeWidth={1.5}
                className="cursor-pointer hover:r-7 transition-all"
                onMouseEnter={() => onHoverPoint(pt)}
              />
            ))
          )}

          {/* Axis Labels */}
          <text
            x={plotW / 2}
            y={plotH + 36}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Equilibrium Pressure P (bar)
          </text>
          <text
            transform="rotate(-90)"
            x={-plotH / 2}
            y={-40}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            CO₂ Mole Fraction in Hydrate Phase z_CO₂
          </text>
        </g>
      </svg>
      <div className="text-[11px] text-slate-400 mt-1">
        Demonstrates the linear correlation: z_CO₂ = m · P + c with slope m ≈ -0.001 (Table 10). Lower P yields higher CO₂ capture in clathrate.
      </div>
    </div>
  );
};

/**
 * Absolute Deviation Percent Histogram SVG
 */
const DeviationHistogramSVG: React.FC<{ data: any[] }> = ({ data }) => {
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Bins: [0-1%], [1-2%], [2-3%], [3-5%], [>5%]
  const bins = [
    { label: '< 1.0%', count: 0, color: '#10b981' },
    { label: '1.0 – 2.0%', count: 0, color: '#06b6d4' },
    { label: '2.0 – 3.0%', count: 0, color: '#3b82f6' },
    { label: '3.0 – 5.0%', count: 0, color: '#f59e0b' },
    { label: '> 5.0%', count: 0, color: '#f43f5e' },
  ];

  for (const d of data) {
    const err = d.adpPaper;
    if (err < 1.0) bins[0].count++;
    else if (err < 2.0) bins[1].count++;
    else if (err < 3.0) bins[2].count++;
    else if (err < 5.0) bins[3].count++;
    else bins[4].count++;
  }

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const barWidth = plotW / bins.length - 20;

  return (
    <div className="w-full h-full flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[380px]">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {bins.map((b, idx) => {
            const barH = (b.count / maxCount) * (plotH - 20);
            const x = idx * (barWidth + 20) + 10;
            const y = plotH - barH;

            return (
              <g key={b.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={b.color}
                  rx={4}
                  className="opacity-90 hover:opacity-100 transition-opacity"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  fill="#f1f5f9"
                  fontSize={12}
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {b.count} ({((b.count / data.length) * 100).toFixed(0)}%)
                </text>
                <text
                  x={x + barWidth / 2}
                  y={plotH + 20}
                  fill="#94a3b8"
                  fontSize={11}
                  textAnchor="middle"
                >
                  {b.label}
                </text>
              </g>
            );
          })}

          <text
            x={plotW / 2}
            y={plotH + 38}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
          >
            Absolute Deviation Percent Range (ADP %)
          </text>
        </g>
      </svg>
      <div className="text-[11px] text-slate-400 mt-1">
        Over 75% of experimental points exhibit deviation below 2.0%, confirming the model's exceptional precision.
      </div>
    </div>
  );
};
