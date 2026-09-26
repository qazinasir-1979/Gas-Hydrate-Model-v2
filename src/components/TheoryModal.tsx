import React from 'react';
import { X, BookOpen, Layers, Atom, Droplets, CheckCircle, ExternalLink } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Mathematical Formulations &amp; Modeling Methodology
              </h2>
              <p className="text-xs text-slate-400">
                Ali Moshfegh Haghighi &amp; Ali Haghtalab, Natural Gas Industry B 11 (2024) 432–442
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Article Abstract Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Article Background &amp; Core Contributions
            </h3>
            <p className="text-slate-400">
              Clathrate hydrates trap gas molecules in water cages (sI, sII, sH).
              For CO₂ + CH₄ mixtures, the conventional Chen–Guo model constants for CO₂ are insufficient,
              producing AADP errors of 8.8% to 15%. This work introduces a novel modification function{' '}
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">I(T, y_CO₂)</code> coupled with
              custom exponential base fugacities <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">f_0^i(T) = A·exp(BT)</code>,
              the SRK equation of state, and NRTL liquid water activity, reducing mixture prediction deviation to{' '}
              <strong className="text-emerald-400">1.98%</strong>.
            </p>
          </div>

          {/* Section 1: Gas Phase SRK EOS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5">
              <Atom className="w-4 h-4 text-cyan-400" />
              <span>1. Gas Phase: Soave–Redlich–Kwong (SRK) Equation of State</span>
            </div>
            <p className="text-slate-400">
              The fugacity of each gas component in the vapor phase is given by{' '}
              <code className="text-slate-200 font-mono">f_i^G = y_i · φ_i · P</code> (Eq. 2), where the fugacity coefficient φ_i is calculated from:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
              ln φ_i = (B_i / B)·(Z - 1) - ln(Z - B) - (A / B) · [ (2·Σ_k y_k·(aa)_ik / aa) - (B_i / B) ] · ln((Z + B) / Z) &nbsp;&nbsp;(Eq. 3)
            </div>
            <p className="text-slate-400">
              With the cubic compressibility factor equation{' '}
              <code className="text-slate-200 font-mono">Z³ - Z² + (A - B - B²)·Z - AB = 0</code> (Eq. 4), where classical van der Waals mixing rules are applied with critical parameters from Table 5:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                α_i = [1 + (0.48508 + 1.55171·ω_i - 0.15613·ω_i²)·(1 - T_r^0.5)]² &nbsp;(Eq. 7)
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                a_i = 0.42747·R²·Tc_i² / Pc_i, &nbsp; b_i = 0.08664·R·Tc_i / Pc_i &nbsp;(Eq. 10, 11)
              </div>
            </div>
          </div>

          {/* Section 2: Hydrate Phase Modified Chen-Guo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. Hydrate Phase: Modified Chen–Guo Model (sI Structure)</span>
            </div>
            <p className="text-slate-400">
              For gas mixtures in structure sI (α = 1/3), the hydrate phase fugacity is expressed as:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 space-y-1">
              <div>f_i^H = z_i · f_0^i · (1 - Σ_j θ_j)^(1/3) &nbsp;&nbsp;(Eq. 18)</div>
              <div>z_i = f_i^G / [ f_0^i · (1 - Σ_j θ_j)^(1/3) ] &nbsp;&nbsp;(Eq. 20)</div>
              <div className="text-emerald-400">Equilibrium condition: z_CO₂ + z_CH₄ = 1 &nbsp;&nbsp;(Eq. 21)</div>
            </div>

            <p className="text-slate-400">
              Cage occupancy <code className="text-slate-200 font-mono">θ_i = C_i·f_i / (1 + Σ C_j·f_j)</code> (Eq. 19), with Langmuir constants from Table 2:
            </p>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-[11px]">
              C_i = X_i · exp[ Y_i / (T - Z_i) ] &nbsp;&nbsp;(Eq. 14)
              <div className="text-slate-400 text-[10px] mt-1">
                CO₂: X=1.6464×10⁻⁶, Y=2799.66, Z=15.90 · CH₄: X=2.3048×10⁻⁶, Y=2752.29, Z=23.01
              </div>
            </div>

            <p className="text-slate-400">
              The novel base hydrate fugacity function with the authors' <code className="text-cyan-400 font-mono">I(T, y_CO₂)</code> modification:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 space-y-1">
              <div>f_0^i(T) = [ A · exp(B · T) ] · I &nbsp;&nbsp;(Eq. 22)</div>
              <div className="text-cyan-300">
                I = 484112.8268 · exp(-0.0491·T) + 1.2416·y_CO₂³ - 1.9895·y_CO₂² + 1.3147·y_CO₂ - 0.1373 &nbsp;&nbsp;(Eq. 23)
              </div>
              <div className="text-slate-400 text-[10px]">
                Base sI constants (Table 3): CO₂: A=2703×10⁻¹⁸, B=0.1316 · CH₄: A=912×10⁻¹⁶, B=0.1230
              </div>
            </div>
          </div>

          {/* Section 3: Liquid Phase and NRTL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span>3. Liquid Phase: Gas Solubility &amp; NRTL Water Activity</span>
            </div>
            <p className="text-slate-400">
              Water activity <code className="text-slate-200 font-mono">a_w = x_w · γ_w</code> (Eq. 24) is calculated using Henry's law at high pressure (Krichevsky–Kasarnovsky, Eq. 27) and the Non-Random Two-Liquid (NRTL) activity coefficient model (Eq. 35–42):
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 space-y-1">
              <div>{"H_i = H_{i,w}(P_w^sat) · exp[ v_i^∞ · (P - P_w^sat) / (R·T) ]"} &nbsp;&nbsp;(Eq. 27)</div>
              <div>P_w^sat (bar) = exp[ 12.048399 - 4030.18245 / (T - 38.15) ] &nbsp;&nbsp;(Eq. 28)</div>
              <div>x_i = f_i^G / H_i, &nbsp;&nbsp; x_w = 1 - Σ x_i &nbsp;&nbsp;(Eq. 33, 34)</div>
            </div>
          </div>

          {/* Section 4: Gas Separation Linear Correlation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-1.5">
              <span>4. Gas Separation Efficiency &amp; Linear Correlation (Table 10)</span>
            </div>
            <p className="text-slate-400">
              The authors uncovered that the CO₂ mole fraction in the hydrate phase exhibits an exact linear dependency with equilibrium pressure:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
              z_CO₂ = -0.001092 · P + 0.78138 &nbsp;&nbsp;(Eq. 44, 50% CO₂ feed, R² = 0.9968)
            </div>
            <p className="text-slate-400">
              Because the slope is consistently negative (~ -0.001) and intercept is less than 1, lower temperatures and pressures maximize CO₂ entrapment into the solid hydrate, enabling clean separation from CH₄.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs">
          <span className="text-slate-400">Natural Gas Industry B 11 (2024) 432–442</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
