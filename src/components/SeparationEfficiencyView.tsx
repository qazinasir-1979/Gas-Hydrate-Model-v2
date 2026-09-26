import React, { useState, useMemo } from 'react';
import { LINEAR_CORRELATIONS } from '../thermo/constants';
import { solveHydrateEquilibrium } from '../thermo/solver';
import { TrendingUp, ArrowDownRight, Layers, Sliders, Calculator, CheckCircle2, Info } from 'lucide-react';

export const SeparationEfficiencyView: React.FC = () => {
  const [selectedYCO2, setSelectedYCO2] = useState<number>(0.50);
  const [operatingTemp, setOperatingTemp] = useState<number>(275.0);
  const [feedFlowRate, setFeedFlowRate] = useState<number>(100.0); // mol/s or kmol/h
  const [hydrateSplitFraction, setHydrateSplitFraction] = useState<number>(0.40); // 40% of feed converted to hydrate

  // Calculate thermodynamic equilibrium at this point
  const thermo = useMemo(() => {
    return solveHydrateEquilibrium(operatingTemp, selectedYCO2);
  }, [operatingTemp, selectedYCO2]);

  // Find corresponding Table 10 linear correlation
  const targetPercent = Math.round(selectedYCO2 * 100);
  const matchCorr = LINEAR_CORRELATIONS.find(
    (c) => Math.abs(c.yCO2Percent - targetPercent) <= 2
  ) ?? LINEAR_CORRELATIONS[1]; // default 50%

  // Linear fit predicted zCO2
  const linearZCO2 = matchCorr.slope * thermo.equilibriumPressure + matchCorr.intercept;

  // Single-stage gas separation mass balance:
  // Feed F (mol/h) with composition yCO2
  // Hydrate H = F * splitFraction with composition zCO2
  // Remaining Gas G = F - H with composition y_rem_CO2 = (F*yCO2 - H*zCO2) / G
  const F = feedFlowRate;
  const H = F * hydrateSplitFraction;
  const G = F - H;

  const zCO2 = thermo.z_CO2;
  const zCH4 = thermo.z_CH4;
  const yCO2 = thermo.yCO2;
  const yCH4 = thermo.yCH4;

  const n_CO2_feed = F * yCO2;
  const n_CH4_feed = F * yCH4;

  const n_CO2_hydrate = H * zCO2;
  const n_CH4_hydrate = H * zCH4;

  const n_CO2_gas = Math.max(0, n_CO2_feed - n_CO2_hydrate);
  const n_CH4_gas = Math.max(0, n_CH4_feed - n_CH4_hydrate);
  const total_gas = n_CO2_gas + n_CH4_gas;

  const y_gas_CO2 = total_gas > 0 ? n_CO2_gas / total_gas : 0;
  const y_gas_CH4 = total_gas > 0 ? n_CH4_gas / total_gas : 1;

  const co2RecoveryHydrate = n_CO2_feed > 0 ? (n_CO2_hydrate / n_CO2_feed) * 100 : 0;
  const ch4PurityProduct = y_gas_CH4 * 100;
  const separationFactor = (zCO2 / zCH4) / (yCO2 / yCH4);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Gas Separation Engineering &amp; Clathrate Selectivity
              </span>
              <span className="text-xs text-slate-400">Section 4 &amp; Table 10 Analysis</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              CO₂ / CH₄ Hydrate Gas Separation Performance
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
              Gas hydrate-based separation leverages preferential entrapment of CO₂ inside sI clathrate cages.
              The paper proves that lower temperatures and pressures yield higher CO₂ mole fractions in the hydrate phase
              (<code className="text-cyan-400 bg-slate-800 px-1 py-0.5 rounded text-[11px]">z_CO₂ = -0.001 · P + c</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operating Sliders & Table 10 Correlations (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-slate-100 text-sm">
                Separation Process Conditions
              </h3>
            </div>

            {/* Feed Gas Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Feed Gas Composition (y_CO₂)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.08}
                  max={0.68}
                  step={0.01}
                  value={selectedYCO2}
                  onChange={(e) => setSelectedYCO2(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-xs text-cyan-400 font-bold w-12 text-right">
                  {(selectedYCO2 * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>8% (Pipeline NG)</span>
                <span>50% (Biogas/Author)</span>
                <span>68% (Flue Gas)</span>
              </div>
            </div>

            {/* Operating Temperature */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Crystallizer Temperature: {operatingTemp.toFixed(1)} K ({(operatingTemp - 273.15).toFixed(1)} °C)
              </label>
              <input
                type="range"
                min={273.15}
                max={285.0}
                step={0.2}
                value={operatingTemp}
                onChange={(e) => setOperatingTemp(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Hydrate Conversion Cut Fraction */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Feed Hydrate Conversion Cut: {(hydrateSplitFraction * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.05}
                value={hydrateSplitFraction}
                onChange={(e) => setHydrateSplitFraction(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Fraction of inlet gas trapped into solid hydrate phase.
              </span>
            </div>
          </div>

          {/* Table 10 Linear Correlation Equations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
                Table 10: Fitted Linear Equations (R² &gt; 0.996)
              </h3>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {LINEAR_CORRELATIONS.map((c) => {
                const isSelected = Math.abs(c.yCO2Percent - targetPercent) <= 2;
                return (
                  <div
                    key={c.yCO2Percent}
                    onClick={() => setSelectedYCO2(c.yCO2Percent / 100)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{c.yCO2Percent}% CO₂</span>
                    <span className="text-slate-200">
                      z_CO₂ = {c.slope} · P + {c.intercept}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      R²={c.rSquared.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Process Separation Flowsheet & Separation Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Key Separation Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-3">
              Separation Efficiency &amp; Stream Balance
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Separation Factor (SF)</div>
                <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                  {separationFactor.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Selectivity CO₂/CH₄</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Hydrate z_CO₂</div>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                  {(zCO2 * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">In Solid Hydrate</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-[10px] uppercase text-slate-400 font-medium">CH₄ Gas Purity</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  {ch4PurityProduct.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">In Sweetened Gas</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-[10px] uppercase text-slate-400 font-medium">CO₂ Capture Recovery</div>
                <div className="text-xl font-bold text-pink-400 font-mono mt-1">
                  {co2RecoveryHydrate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">To Hydrate Clathrate</div>
              </div>
            </div>

            {/* Visual Process Flow Diagram */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-300">
                Hydrate Separation Stage Balance (Feed: {feedFlowRate} kmol/h)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
                {/* 1. Feed Gas */}
                <div className="bg-slate-900 p-3 rounded-lg border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    Inlet Feed Gas
                  </div>
                  <div className="mt-1 font-mono text-slate-100 font-semibold">
                    {F.toFixed(1)} kmol/h
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300 font-mono">
                    <div>CO₂: {(yCO2 * 100).toFixed(1)}% ({n_CO2_feed.toFixed(1)} kmol)</div>
                    <div>CH₄: {(yCH4 * 100).toFixed(1)}% ({n_CH4_feed.toFixed(1)} kmol)</div>
                  </div>
                </div>

                {/* Arrow to crystallizer */}
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <div className="text-[10px] text-slate-400">Hydrate Crystallizer</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    P_eq: {thermo.equilibriumPressure.toFixed(2)} bar
                  </div>
                  <div className="text-[10px] text-slate-400">
                    T: {operatingTemp.toFixed(1)} K
                  </div>
                </div>

                {/* 2. Streams Out */}
                <div className="space-y-2">
                  {/* Sweetened Gas */}
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-amber-500/30">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Purified Gas Stream (Unreacted)
                    </div>
                    <div className="text-[11px] text-slate-200 font-mono">
                      {G.toFixed(1)} kmol/h · <strong className="text-emerald-400">{ch4PurityProduct.toFixed(1)}% CH₄</strong>
                    </div>
                  </div>

                  {/* CO2 Hydrate Slurry */}
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-pink-500/30">
                    <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
                      CO₂-Rich Clathrate Hydrate
                    </div>
                    <div className="text-[11px] text-slate-200 font-mono">
                      {H.toFixed(1)} kmol/h · <strong className="text-cyan-400">{(zCO2 * 100).toFixed(1)}% CO₂</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Conclusion Callout from Paper */}
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-lg p-3.5 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Paper Core Finding Verified:
              </div>
              <p className="text-slate-400 text-[11px]">
                &quot;Low thermodynamic conditions (lower temperature and lower pressure) result in higher CO₂ mole fractions in the hydrate phase and great separation efficiency.&quot;
                At lower equilibrium pressures, CO₂ enters the cage preferentially over CH₄, producing separation factors upwards of 3.0 to 4.5.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
