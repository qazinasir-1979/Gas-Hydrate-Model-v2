import React, { useState } from 'react';
import { Header } from './components/Header';
import { ValidationView } from './components/ValidationView';
import { EquilibriumCalculator } from './components/EquilibriumCalculator';
import { PhaseEnvelopeView } from './components/PhaseEnvelopeView';
import { SeparationEfficiencyView } from './components/SeparationEfficiencyView';
import { CustomDataValidator } from './components/CustomDataValidator';
import { TheoryModal } from './components/TheoryModal';
import { PURE_GAS_VALIDATION_DATA, MIXTURE_VALIDATION_DATA } from './thermo/validationData';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'validation' | 'calculator' | 'envelope' | 'separation' | 'custom'
  >('validation');

  const [inspectorParams, setInspectorParams] = useState<{
    temperature: number;
    yCO2: number;
  }>({
    temperature: 275.0,
    yCO2: 0.50,
  });

  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Switch to simulator with selected parameters
  const handleInspectPoint = (temperature: number, yCO2: number) => {
    setInspectorParams({ temperature, yCO2 });
    setActiveTab('calculator');
  };

  // Export complete 38 experimental validation points to CSV
  const handleExportCSV = () => {
    let csv =
      'Point_Type,Gas_System,Feed_yCO2,Temperature_K,Temperature_C,P_expt_bar,P_calc_paper_bar,ADP_percent,Hydrate_zCO2,Hydrate_zCH4,Reference\n';

    // Pure gases
    for (const p of PURE_GAS_VALIDATION_DATA) {
      const yCO2 = p.gas === 'CO2' ? 1.0 : 0.0;
      csv += `Pure_Gas,${p.gas},${yCO2},${p.temperature},${(p.temperature - 273.15).toFixed(2)},${p.pExpt},${p.pCalcPaper},${p.adpPaper},${yCO2},${1 - yCO2},"${p.reference ?? 'Literature'}"\n`;
    }

    // Mixtures
    for (const m of MIXTURE_VALIDATION_DATA) {
      const sysName = `${Math.round(m.yCO2 * 100)}% CO2 + ${Math.round((1 - m.yCO2) * 100)}% CH4`;
      csv += `Mixture,"${sysName}",${m.yCO2},${m.temperature},${(m.temperature - 273.15).toFixed(2)},${m.pExpt},${m.pCalcPaper},${m.adpPaper},${m.zCO2Paper ?? ''},${m.zCH4Paper ?? ''},"${m.reference ?? ''}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CO2_CH4_Hydrate_Validation_Dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetDefaults = () => {
    setInspectorParams({ temperature: 275.0, yCO2: 0.50 });
    setActiveTab('validation');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onExportCSV={handleExportCSV}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'validation' && (
          <ValidationView onInspectPoint={handleInspectPoint} />
        )}

        {activeTab === 'calculator' && (
          <EquilibriumCalculator
            initialTemp={inspectorParams.temperature}
            initialYCO2={inspectorParams.yCO2}
          />
        )}

        {activeTab === 'envelope' && <PhaseEnvelopeView />}

        {activeTab === 'separation' && <SeparationEfficiencyView />}

        {activeTab === 'custom' && <CustomDataValidator />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Thermodynamic Hydrate Equilibrium Model · Ali Moshfegh Haghighi &amp; Ali Haghtalab (2024)
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTheoryOpen(true)}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              Model Equations (Eq. 2–44)
            </button>
            <span>·</span>
            <span>AADP 1.98% on Gas Mixtures</span>
          </div>
        </div>
      </footer>

      {/* Theory & Mathematical Reference Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
