import React, { useState, useMemo } from 'react';
import { solveHydrateEquilibrium } from '../thermo/solver';
import { CalculationResult } from '../thermo/types';
import {
  Gauge,
  Thermometer,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Droplets,
  Atom,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Preset {
  name: string;
  yCO2: number;
  T: number;
  description: string;
}

const PRESETS: Preset[] = [
  {
    name: '50% CO₂ (Authors Exp at 275.0 K)',
    yCO2: 0.50,
    T: 275.0,
    description: "Haghighi & Haghtalab (2024) experimental point (P_exp = 19.6 bar)",
  },
  {
    name: '50% CO₂ (Authors Exp at 280.0 K)',
    yCO2: 0.50,
    T: 280.0,
    description: "Haghighi & Haghtalab (2024) experimental point (P_exp = 33.3 bar)",
  },
  {
    name: 'Biogas Feed (40% CO₂ at 280.7 K)',
    yCO2: 0.40,
    T: 280.7,
    description: "Anaerobic digester biogas upgrading conditions (P_exp = 40.3 bar)",
  },
  {
    name: 'Sour / Associated Gas (8% CO₂ at 277.8 K)',
    yCO2: 0.08,
    T: 277.8,
    description: "Pipeline natural gas decarbonization condition (P_exp = 38.3 bar)",
  },
  {
    name: 'Flue Gas / Landfill (68% CO₂ at 278.2 K)',
    yCO2: 0.68,
    T: 278.2,
    description: "High CO2 concentration clathrate capture (P_exp = 25.8 bar)",
  },
  {
    name: 'Pure CO₂ (277.8 K)',
    yCO2: 1.0,
    T: 277.8,
    description: "Table 6 benchmark (P_exp = 21.1 bar, P_calc = 21.16 bar)",
  },
  {
    name: 'Pure CH₄ (275.3 K)',
    yCO2: 0.0,
    T: 275.3,
    description: "Table 6 benchmark (P_exp = 31.5 bar, P_calc = 31.22 bar)",
  },
];

interface CalculatorProps {
  initialTemp?: number;
  initialYCO2?: number;
}

export const EquilibriumCalculator: React.FC<CalculatorProps> = ({
  initialTemp = 275.0,
  initialYCO2 = 0.50,
}) => {
  const [temperatureK, setTemperatureK] = useState<number>(initialTemp);
  const [yCO2, setYCO2] = useState<number>(initialYCO2);
  const [tempUnit, setTempUnit] = useState<'K' | 'C'>('K');
  const [showAdvancedTrace, setShowAdvancedTrace] = useState<boolean>(true);

  // Synchronize when parent props change
  React.useEffect(() => {
    if (initialTemp) setTemperatureK(initialTemp);
    if (initialYCO2 !== undefined) setYCO2(initialYCO2);
  }, [initialTemp, initialYCO2]);

  // Live calculation
  const result: CalculationResult = useMemo(() => {
    return solveHydrateEquilibrium(temperatureK, yCO2);
  }, [temperatureK, yCO2]);

  const yCH4 = Math.max(0, 1.0 - yCO2);
  const tempC = temperatureK - 273.15;

  const handleTempChange = (val: number, unit: 'K' | 'C') => {
    if (unit === 'K') {
      setTemperatureK(Math.max(270.0, Math.min(295.0, val)));
    } else {
      setTemperatureK(Math.max(270.0, Math.min(295.0, val + 273.15)));
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setTemperatureK(preset.T);
    setYCO2(preset.yCO2);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Live Thermodynamic Engine
              </span>
              <span className="text-xs text-slate-400">SRK EOS + NRTL a_w + Modified Chen-Guo sI</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              Hydrate Equilibrium &amp; Gas Separation Simulator
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
              Simulate hydrate formation conditions for arbitrary CO₂/CH₄ gas mixtures.
              Calculates 3-phase equilibrium (Vapor–Liquid–Hydrate) and gas separation efficiency.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            <select
              onChange={(e) => {
                const p = PRESETS[parseInt(e.target.value, 10)];
                if (p) handlePresetSelect(p);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Operating Conditions</h3>
            </div>

            {/* Temperature Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  System Temperature (T)
                </label>
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setTempUnit('K')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      tempUnit === 'K' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kelvin
                  </button>
                  <button
                    onClick={() => setTempUnit('C')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      tempUnit === 'C' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    °Celsius
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={272.0}
                  max={289.0}
                  step={0.1}
                  value={temperatureK}
                  onChange={(e) => setTemperatureK(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="w-24">
                  <input
                    type="number"
                    step={0.1}
                    value={tempUnit === 'K' ? Number(temperatureK.toFixed(1)) : Number(tempC.toFixed(1))}
                    onChange={(e) => handleTempChange(parseFloat(e.target.value) || 275.0, tempUnit)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs rounded px-2.5 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>272.0 K (-1.15 °C)</span>
                <span>Active: {temperatureK.toFixed(1)} K ({tempC.toFixed(1)} °C)</span>
                <span>289.0 K (15.85 °C)</span>
              </div>
            </div>

            {/* Feed Gas Composition Input */}
            <div className="space-y-2 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-cyan-400" />
                  Feed Gas Composition (y)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  y_CO₂ + y_CH₄ = 1.00
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={yCO2}
                  onChange={(e) => setYCO2(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="w-24">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(yCO2 * 100)}
                    onChange={(e) => setYCO2(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs rounded px-2.5 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <span className="text-xs text-slate-400">% CO₂</span>
              </div>

              {/* Feed Gas Visual Split Bar */}
              <div className="space-y-1 pt-1">
                <div className="h-3 w-full rounded-md overflow-hidden flex bg-slate-800">
                  <div
                    style={{ width: `${yCO2 * 100}%` }}
                    className="bg-cyan-500 transition-all duration-200"
                    title={`CO2: ${(yCO2 * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${yCH4 * 100}%` }}
                    className="bg-amber-500 transition-all duration-200"
                    title={`CH4: ${(yCH4 * 100).toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-cyan-400">CO₂: {(yCO2 * 100).toFixed(1)} mol%</span>
                  <span className="text-amber-400">CH₄: {(yCH4 * 100).toFixed(1)} mol%</span>
                </div>
              </div>
            </div>

            {/* Gas Mixture Mode Shortcuts */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 text-xs">
              <button
                onClick={() => setYCO2(1.0)}
                className={`px-2.5 py-1 rounded border transition ${
                  yCO2 === 1.0
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Pure CO₂
              </button>
              <button
                onClick={() => setYCO2(0.5)}
                className={`px-2.5 py-1 rounded border transition ${
                  yCO2 === 0.5
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Equimolar (50-50)
              </button>
              <button
                onClick={() => setYCO2(0.0)}
                className={`px-2.5 py-1 rounded border transition ${
                  yCO2 === 0.0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Pure CH₄
              </button>
            </div>
          </div>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Primary Calculated KPIs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Equilibrium Hydrate State
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Convergence: {result.converged ? 'Reached (< 0.01 bar)' : 'Refining'}
              </span>
            </div>

            {/* Pressure Output Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Equilibrium Pressure (P_eq)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {result.equilibriumPressure.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">bar</span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({(result.equilibriumPressure * 0.1).toFixed(3)} MPa)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  At T = {result.temperature.toFixed(1)} K ({(result.temperature - 273.15).toFixed(1)} °C)
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Gas Separation Factor (SF)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-blue-400 font-mono">
                    {result.separationFactor ? result.separationFactor.toFixed(2) : '—'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.enrichmentFactor
                      ? `(${result.enrichmentFactor.toFixed(2)}x CO₂ enrich)`
                      : 'N/A'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  SF = (z_CO₂ / z_CH₄) / (y_CO₂ / y_CH₄)
                </div>
              </div>
            </div>

            {/* Gas vs Hydrate Phase Split Comparison */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-200">
                Phase Composition &amp; Clathrate Cage Partitioning
              </div>

              {/* Feed Gas vs Hydrate Phase */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-medium">Feed Gas Phase (y):</span>
                    <span className="font-mono text-cyan-400">
                      {(result.yCO2 * 100).toFixed(1)}% CO₂ · {(result.yCH4 * 100).toFixed(1)}% CH₄
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded overflow-hidden flex bg-slate-800">
                    <div style={{ width: `${result.yCO2 * 100}%` }} className="bg-cyan-500/80" />
                    <div style={{ width: `${result.yCH4 * 100}%` }} className="bg-amber-500/80" />
                  </div>
                </div>

                <div className="flex justify-center py-0.5">
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-medium">
                      Hydrate Clathrate Phase (z):
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {(result.z_CO2 * 100).toFixed(2)}% CO₂ · {(result.z_CH4 * 100).toFixed(2)}% CH₄
                    </span>
                  </div>
                  <div className="h-3.5 w-full rounded overflow-hidden flex bg-slate-800 border border-slate-700">
                    <div
                      style={{ width: `${result.z_CO2 * 100}%` }}
                      className="bg-cyan-400 flex items-center justify-center text-[9px] text-slate-950 font-bold"
                    >
                      {result.z_CO2 > 0.15 ? `${(result.z_CO2 * 100).toFixed(1)}%` : ''}
                    </div>
                    <div
                      style={{ width: `${result.z_CH4 * 100}%` }}
                      className="bg-amber-400 flex items-center justify-center text-[9px] text-slate-950 font-bold"
                    >
                      {result.z_CH4 > 0.15 ? `${(result.z_CH4 * 100).toFixed(1)}%` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 10 Linear Correlation Verification */}
              {result.linearCorrelationZCO2 !== undefined && (
                <div className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-start gap-2 mt-2">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Table 10 Linear Fit Check: </span>
                    <span>
                      At {Math.round(result.yCO2 * 100)}% CO₂, the paper's linear equation yields z_CO₂ ={' '}
                      <strong className="text-cyan-400 font-mono">
                        {(result.linearCorrelationZCO2 * 100).toFixed(2)}%
                      </strong>{' '}
                      (Model calculates{' '}
                      <strong className="text-emerald-400 font-mono">
                        {(result.z_CO2 * 100).toFixed(2)}%
                      </strong>
                      ).
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Thermodynamic Audit Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <button
          onClick={() => setShowAdvancedTrace(!showAdvancedTrace)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Comprehensive Thermodynamic State Inspector (Equations 2 – 44)
            </h3>
            <span className="text-xs text-slate-400">
              {showAdvancedTrace ? 'Click to collapse' : 'Click to expand all intermediate variables'}
            </span>
          </div>
          {showAdvancedTrace ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          )}
        </button>

        {showAdvancedTrace && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-xs">
            {/* 1. Gas Phase SRK Properties */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Atom className="w-3.5 h-3.5 text-blue-400" />
                1. Gas Phase (SRK EOS)
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Z factor (Eq. 4):</span>
                  <span>{result.Z_gas.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">phi_CO₂ (Eq. 3):</span>
                  <span>{result.phi_CO2.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">phi_CH₄ (Eq. 3):</span>
                  <span>{result.phi_CH4.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">f_CO₂^G (Eq. 2):</span>
                  <span className="text-cyan-400">{result.fG_CO2.toFixed(3)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">f_CH₄^G (Eq. 2):</span>
                  <span className="text-amber-400">{result.fG_CH4.toFixed(3)} bar</span>
                </div>
              </div>
            </div>

            {/* 2. Hydrate Clathrate Phase Properties */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                2. Hydrate Phase (Modified Chen-Guo)
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">C_CO₂ (Eq. 14):</span>
                  <span>{result.C_CO2.toFixed(5)} bar⁻¹</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">C_CH₄ (Eq. 14):</span>
                  <span>{result.C_CH4.toFixed(5)} bar⁻¹</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cage Occupancy theta:</span>
                  <span>{(result.theta_total * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Function I (Eq. 23):</span>
                  <span className="text-purple-400">{result.I_factor.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">f_0^CO₂ (sI, Eq. 15):</span>
                  <span>{result.f0_sI_CO2.toFixed(2)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">f_0^CH₄ (sI, Eq. 15):</span>
                  <span>{result.f0_sI_CH4.toFixed(2)} bar</span>
                </div>
              </div>
            </div>

            {/* 3. Liquid Phase & Water Activity */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                3. Liquid Phase (NRTL &amp; Henry)
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">P_w^sat (Eq. 28):</span>
                  <span>{result.pSat_water.toFixed(5)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">H_CO₂ (Eq. 27):</span>
                  <span>{result.H_CO2.toFixed(1)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">H_CH₄ (Eq. 27):</span>
                  <span>{result.H_CH4.toFixed(1)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">x_CO₂ (solubility):</span>
                  <span>{(result.x_CO2 * 100).toFixed(3)} mol%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">gamma_w (NRTL Eq. 35):</span>
                  <span>{result.gamma_water.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">a_w (water activity):</span>
                  <span className="text-blue-400 font-bold">{result.a_water.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
