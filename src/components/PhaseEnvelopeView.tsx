import React, { useState, useMemo } from 'react';
import { generatePTCurve } from '../thermo/solver';
import { Layers, Download, RefreshCw, Eye, Info } from 'lucide-react';

interface CurveConfig {
  id: string;
  name: string;
  yCO2: number;
  color: string;
  enabled: boolean;
}

const DEFAULT_CURVES: CurveConfig[] = [
  { id: 'pure_co2', name: 'Pure CO₂', yCO2: 1.0, color: '#06b6d4', enabled: true },
  { id: 'mix_68', name: '68% CO₂', yCO2: 0.68, color: '#f43f5e', enabled: true },
  { id: 'mix_50', name: '50% CO₂ (Authors)', yCO2: 0.50, color: '#ec4899', enabled: true },
  { id: 'mix_44', name: '44% CO₂', yCO2: 0.44, color: '#6366f1', enabled: true },
  { id: 'mix_25', name: '25% CO₂', yCO2: 0.25, color: '#10b981', enabled: true },
  { id: 'mix_13', name: '13% CO₂', yCO2: 0.13, color: '#3b82f6', enabled: true },
  { id: 'mix_08', name: '8% CO₂', yCO2: 0.08, color: '#8b5cf6', enabled: true },
  { id: 'pure_ch4', name: 'Pure CH₄', yCO2: 0.0, color: '#f59e0b', enabled: true },
];

export const PhaseEnvelopeView: React.FC = () => {
  const [curves, setCurves] = useState<CurveConfig[]>(DEFAULT_CURVES);
  const [customYCO2, setCustomYCO2] = useState<number>(0.30);
  const [showCustomCurve, setShowCustomCurve] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Generate curves data
  const generatedSeries = useMemo(() => {
    const list = curves
      .filter((c) => c.enabled)
      .map((c) => ({
        ...c,
        points: generatePTCurve(c.yCO2, 273.15, 288.0, 20),
      }));

    if (showCustomCurve) {
      list.push({
        id: 'custom',
        name: `Custom ${(customYCO2 * 100).toFixed(0)}% CO₂`,
        yCO2: customYCO2,
        color: '#14b8a6',
        enabled: true,
        points: generatePTCurve(customYCO2, 273.15, 288.0, 20),
      });
    }

    return list;
  }, [curves, showCustomCurve, customYCO2]);

  const toggleCurve = (id: string) => {
    setCurves((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleExportCSV = () => {
    let csv = 'Curve,yCO2,Temperature_K,Temperature_C,Pressure_bar,Hydrate_zCO2,Hydrate_zCH4\n';
    for (const s of generatedSeries) {
      for (const p of s.points) {
        csv += `"${s.name}",${s.yCO2},${p.T.toFixed(2)},${p.TCelsius.toFixed(2)},${p.P.toFixed(2)},${p.zCO2.toFixed(4)},${p.zCH4.toFixed(4)}\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hydrate_phase_envelopes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dimensions for SVG
  const width = 860;
  const height = 440;
  const padding = { top: 35, right: 35, bottom: 50, left: 65 };

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

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                P-T Phase Diagram Generator
              </span>
              <span className="text-xs text-slate-400">Fig. 7 Reproduction</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              CO₂ + CH₄ Hydrate Phase Envelopes
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
              Hydrate formation boundary lines across temperatures (273 – 288 K) for various CO₂ concentrations.
              Above each line is the stable Hydrate + Liquid Water phase; below is the Gas + Liquid Water phase.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Envelope Data</span>
          </button>
        </div>
      </div>

      {/* Main Chart Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Curve Toggles */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
          <span className="text-slate-400 font-medium mr-1">Toggle Envelopes:</span>
          {curves.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCurve(c.id)}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition ${
                c.enabled
                  ? 'bg-slate-800 text-slate-100 border-slate-600'
                  : 'bg-slate-900/50 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span>{c.name}</span>
            </button>
          ))}

          {/* Custom Curve Toggle */}
          <div className="flex items-center gap-2 ml-auto bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            <input
              type="checkbox"
              id="showCustom"
              checked={showCustomCurve}
              onChange={(e) => setShowCustomCurve(e.target.checked)}
              className="accent-teal-500 rounded cursor-pointer"
            />
            <label htmlFor="showCustom" className="text-slate-300 font-medium cursor-pointer">
              Custom CO₂:
            </label>
            <input
              type="range"
              min={0.01}
              max={0.99}
              step={0.01}
              value={customYCO2}
              onChange={(e) => setCustomYCO2(parseFloat(e.target.value))}
              disabled={!showCustomCurve}
              className="w-24 accent-teal-400 h-1 bg-slate-700 rounded cursor-pointer"
            />
            <span className="font-mono text-teal-400 w-10 text-right">
              {Math.round(customYCO2 * 100)}%
            </span>
          </div>
        </div>

        {/* SVG Plot Canvas */}
        <div className="relative min-h-[440px] bg-slate-950 rounded-lg p-4 border border-slate-800/80 flex justify-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[460px] select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Region Labels */}
              <text
                x={plotW * 0.2}
                y={plotH * 0.15}
                fill="#38bdf8"
                fillOpacity={0.25}
                fontSize={16}
                fontWeight="bold"
                letterSpacing={1.5}
              >
                HYDRATE STABLE REGION (H + LW)
              </text>
              <text
                x={plotW * 0.65}
                y={plotH * 0.85}
                fill="#94a3b8"
                fillOpacity={0.25}
                fontSize={16}
                fontWeight="bold"
                letterSpacing={1.5}
              >
                GAS + WATER REGION (V + LW)
              </text>

              {/* Grid Lines */}
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
                    y={plotH + 20}
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

              {/* Curve Paths */}
              {generatedSeries.map((s) => {
                if (s.points.length < 2) return null;
                const pathD = s.points.reduce((acc, curr, idx) => {
                  const x = scaleX(curr.T);
                  const y = scaleY(curr.P);
                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '');

                return (
                  <g key={s.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={s.id === 'mix_50' || s.id === 'custom' ? 2.8 : 2}
                      strokeLinecap="round"
                    />
                    {/* Interactive Points along curve */}
                    {s.points.map((pt, pIdx) => (
                      <circle
                        key={pIdx}
                        cx={scaleX(pt.T)}
                        cy={scaleY(pt.P)}
                        r={3.5}
                        fill={s.color}
                        className="cursor-pointer hover:r-5 transition-all opacity-80 hover:opacity-100"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            curveName: s.name,
                            yCO2: s.yCO2,
                            ...pt,
                          })
                        }
                      />
                    ))}
                  </g>
                );
              })}

              {/* Axis Labels */}
              <text
                x={plotW / 2}
                y={plotH + 40}
                fill="#94a3b8"
                fontSize={11}
                textAnchor="middle"
                fontWeight="bold"
              >
                Equilibrium Temperature T (K)
              </text>
              <text
                transform="rotate(-90)"
                x={-plotH / 2}
                y={-45}
                fill="#94a3b8"
                fontSize={11}
                textAnchor="middle"
                fontWeight="bold"
              >
                Hydrate Formation Pressure P (bar)
              </text>
            </g>
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-6 right-6 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur text-xs pointer-events-none z-20 space-y-1 w-64">
              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                {hoveredPoint.curveName}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <span className="text-slate-400">Temperature:</span>
                <span className="font-mono text-slate-200">
                  {hoveredPoint.T.toFixed(1)} K ({hoveredPoint.TCelsius.toFixed(1)} °C)
                </span>
                <span className="text-slate-400">P_equilibrium:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {hoveredPoint.P.toFixed(2)} bar
                </span>
                <span className="text-slate-400">Hydrate z_CO₂:</span>
                <span className="font-mono text-cyan-400">
                  {(hoveredPoint.zCO2 * 100).toFixed(2)}%
                </span>
                <span className="text-slate-400">Hydrate z_CH₄:</span>
                <span className="font-mono text-amber-400">
                  {(hoveredPoint.zCH4 * 100).toFixed(2)}%
                </span>
                {hoveredPoint.SF && (
                  <>
                    <span className="text-slate-400">Separation Factor:</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {hoveredPoint.SF.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="flex items-start gap-2 p-3 bg-slate-800/60 rounded-lg text-xs text-slate-300 border border-slate-700/60">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">Parallel Trend Phenomenon: </strong>
            As established in Haghighi &amp; Haghtalab (2024), hydrate equilibrium curves for different CO₂ concentrations form parallel trajectories on the P-T diagram. Increasing CO₂ content consistently lowers the required formation pressure at any given temperature, enabling selective clathrate entrapment of CO₂.
          </div>
        </div>
      </div>
    </div>
  );
};
