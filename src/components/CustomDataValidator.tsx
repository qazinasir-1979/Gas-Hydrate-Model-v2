import React, { useState } from 'react';
import { solveHydrateEquilibrium } from '../thermo/solver';
import { Plus, Trash2, Download, CheckCircle, Calculator, Info } from 'lucide-react';

export interface CustomPoint {
  id: string;
  name: string;
  yCO2: number;
  temperature: number; // K
  pExpt: number; // bar
  pCalc?: number;
  adp?: number;
  zCO2?: number;
  zCH4?: number;
}

export const CustomDataValidator: React.FC = () => {
  const [points, setPoints] = useState<CustomPoint[]>([
    {
      id: 'c-1',
      name: 'Custom Test Point 1',
      yCO2: 0.50,
      temperature: 279.0,
      pExpt: 29.8,
    },
    {
      id: 'c-2',
      name: 'Custom Test Point 2',
      yCO2: 0.15,
      temperature: 282.0,
      pExpt: 56.4,
    },
  ]);

  // Form inputs for new point
  const [pointName, setPointName] = useState<string>('Lab Test Point');
  const [yCO2, setYCO2] = useState<number>(0.50);
  const [tempK, setTempK] = useState<number>(278.0);
  const [pExpt, setPExpt] = useState<number>(26.5);

  // Evaluate points
  const evaluatedPoints = React.useMemo(() => {
    return points.map((p) => {
      const res = solveHydrateEquilibrium(p.temperature, p.yCO2);
      const pCalc = res.equilibriumPressure;
      const adp = (Math.abs(p.pExpt - pCalc) / p.pExpt) * 100;
      return {
        ...p,
        pCalc,
        adp,
        zCO2: res.z_CO2,
        zCH4: res.z_CH4,
      };
    });
  }, [points]);

  const aadp = React.useMemo(() => {
    if (evaluatedPoints.length === 0) return 0;
    const sum = evaluatedPoints.reduce((acc, curr) => acc + (curr.adp || 0), 0);
    return sum / evaluatedPoints.length;
  }, [evaluatedPoints]);

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const newPt: CustomPoint = {
      id: `c-${Date.now()}`,
      name: pointName || `Point ${points.length + 1}`,
      yCO2,
      temperature: tempK,
      pExpt,
    };
    setPoints([...points, newPt]);
    setPointName('');
  };

  const handleDeletePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const handleExportCSV = () => {
    let csv = 'Point_Name,yCO2,Temperature_K,P_expt_bar,P_calc_bar,ADP_percent,Hydrate_zCO2,Hydrate_zCH4\n';
    for (const p of evaluatedPoints) {
      csv += `"${p.name}",${p.yCO2},${p.temperature},${p.pExpt},${p.pCalc?.toFixed(2)},${p.adp?.toFixed(2)},${p.zCO2?.toFixed(4)},${p.zCH4?.toFixed(4)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'custom_validation_points.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                User Experimental Validator
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              Custom Data Validation &amp; Benchmarking
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
              Enter your own measured laboratory hydrate equilibrium data (T, y_CO₂, P_exp)
              to evaluate model deviations (ADP%) and calculate hydrate phase partitioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Custom Dataset AADP
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {aadp.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Add Experimental Point</h3>
          </div>

          <form onSubmit={handleAddPoint} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Point Label</label>
              <input
                type="text"
                value={pointName}
                onChange={(e) => setPointName(e.target.value)}
                placeholder="e.g. Lab Run #4"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Feed Gas CO₂ Fraction (y_CO₂: {yCO2.toFixed(2)})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={yCO2}
                  onChange={(e) => setYCO2(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400 font-bold w-12 text-right">
                  {(yCO2 * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Temperature T (K)
              </label>
              <input
                type="number"
                step={0.1}
                min={270.0}
                max={295.0}
                value={tempK}
                onChange={(e) => setTempK(parseFloat(e.target.value) || 275.0)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {(tempK - 273.15).toFixed(2)} °C
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Measured Equilibrium Pressure P_exp (bar)
              </label>
              <input
                type="number"
                step={0.1}
                min={1.0}
                max={250.0}
                value={pExpt}
                onChange={(e) => setPExpt(parseFloat(e.target.value) || 20.0)}
                className="w-full bg-slate-800 border border-slate-700 text-amber-400 font-mono font-semibold rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Validate &amp; Add Point</span>
            </button>
          </form>
        </div>

        {/* Validation Results Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Validation Evaluation Results
              </h3>
              <p className="text-xs text-slate-400">
                {evaluatedPoints.length} points evaluated.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={evaluatedPoints.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Point Name</th>
                  <th className="py-2.5 px-3">y_CO₂</th>
                  <th className="py-2.5 px-3">T (K)</th>
                  <th className="py-2.5 px-3">P_exp (bar)</th>
                  <th className="py-2.5 px-3">P_calc (bar)</th>
                  <th className="py-2.5 px-3">Deviation (ADP%)</th>
                  <th className="py-2.5 px-3">Hydrate z_CO₂</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {evaluatedPoints.map((p) => {
                  const isLowError = (p.adp || 0) < 3.0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">
                        {p.name}
                      </td>
                      <td className="py-2 px-3 text-cyan-400">
                        {(p.yCO2 * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-3">{p.temperature.toFixed(1)}</td>
                      <td className="py-2 px-3 text-amber-400 font-semibold">
                        {p.pExpt.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-blue-400 font-semibold">
                        {p.pCalc?.toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            isLowError
                              ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.adp?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-cyan-300">
                        {p.zCO2 ? `${(p.zCO2 * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeletePoint(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
