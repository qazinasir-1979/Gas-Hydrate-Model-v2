import { PureValidationPoint, MixtureValidationPoint } from './types';

// Table 6: Pure Gas Experimental and Calculated Pressures
export const PURE_GAS_VALIDATION_DATA: PureValidationPoint[] = [
  // CO2
  { gas: 'CO2', temperature: 277.8, pExpt: 21.1, pCalcPaper: 21.16, adpPaper: 0.28 },
  { gas: 'CO2', temperature: 280.4, pExpt: 31.8, pCalcPaper: 32.48, adpPaper: 2.14 },
  { gas: 'CO2', temperature: 280.5, pExpt: 33.3, pCalcPaper: 33.07, adpPaper: 0.69 },
  { gas: 'CO2', temperature: 281.0, pExpt: 35.5, pCalcPaper: 36.27, adpPaper: 2.17 },
  { gas: 'CO2', temperature: 281.1, pExpt: 37.5, pCalcPaper: 36.96, adpPaper: 1.44 },

  // CH4
  { gas: 'CH4', temperature: 275.3, pExpt: 31.5, pCalcPaper: 31.22, adpPaper: 0.89 },
  { gas: 'CH4', temperature: 276.4, pExpt: 35.3, pCalcPaper: 35.60, adpPaper: 0.85 },
  { gas: 'CH4', temperature: 276.6, pExpt: 37.7, pCalcPaper: 36.47, adpPaper: 3.26 },
  { gas: 'CH4', temperature: 277.9, pExpt: 42.5, pCalcPaper: 42.69, adpPaper: 0.45 },
  { gas: 'CH4', temperature: 278.1, pExpt: 44.0, pCalcPaper: 43.75, adpPaper: 0.57 },
  { gas: 'CH4', temperature: 279.6, pExpt: 53.5, pCalcPaper: 52.70, adpPaper: 1.50 },
];

// Table 7 & 9: CO2 + CH4 Mixture Experimental Points (27 points)
export const MIXTURE_VALIDATION_DATA: MixtureValidationPoint[] = [
  // yCO2 = 0.08 (8%)
  { id: 'm-08-1', yCO2: 0.08, temperature: 277.8, pExpt: 38.3, pCalcPaper: 39.03, adpPaper: 1.91, zCO2Paper: 0.2707, zCH4Paper: 0.7293, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-08-2', yCO2: 0.08, temperature: 280.2, pExpt: 49.1, pCalcPaper: 49.35, adpPaper: 0.51, zCO2Paper: 0.2651, zCH4Paper: 0.7349, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-08-3', yCO2: 0.08, temperature: 283.2, pExpt: 68.0, pCalcPaper: 67.49, adpPaper: 0.75, zCO2Paper: 0.2552, zCH4Paper: 0.7448, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-08-4', yCO2: 0.08, temperature: 285.1, pExpt: 84.0, pCalcPaper: 83.50, adpPaper: 0.60, zCO2Paper: 0.2468, zCH4Paper: 0.7532, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.13 (13%)
  { id: 'm-13-1', yCO2: 0.13, temperature: 276.9, pExpt: 32.4, pCalcPaper: 33.19, adpPaper: 2.44, zCO2Paper: 0.3796, zCH4Paper: 0.6204, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-13-2', yCO2: 0.13, temperature: 279.1, pExpt: 41.8, pCalcPaper: 41.42, adpPaper: 0.91, zCO2Paper: 0.3740, zCH4Paper: 0.6260, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-13-3', yCO2: 0.13, temperature: 281.6, pExpt: 53.8, pCalcPaper: 54.18, adpPaper: 0.71, zCO2Paper: 0.3652, zCH4Paper: 0.6348, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-13-4', yCO2: 0.13, temperature: 284.0, pExpt: 71.7, pCalcPaper: 71.80, adpPaper: 0.14, zCO2Paper: 0.3534, zCH4Paper: 0.6466, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-13-5', yCO2: 0.13, temperature: 287.4, pExpt: 109.5, pCalcPaper: 110.31, adpPaper: 0.74, zCO2Paper: 0.3286, zCH4Paper: 0.6714, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.22 (22%)
  { id: 'm-22-1', yCO2: 0.22, temperature: 279.4, pExpt: 39.6, pCalcPaper: 38.71, adpPaper: 2.25, zCO2Paper: 0.5083, zCH4Paper: 0.4917, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-22-2', yCO2: 0.22, temperature: 283.4, pExpt: 62.3, pCalcPaper: 62.27, adpPaper: 0.05, zCO2Paper: 0.4889, zCH4Paper: 0.5111, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.25 (25%)
  { id: 'm-25-1', yCO2: 0.25, temperature: 273.8, pExpt: 21.2, pCalcPaper: 21.11, adpPaper: 0.42, zCO2Paper: 0.5598, zCH4Paper: 0.4402, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-25-2', yCO2: 0.25, temperature: 287.6, pExpt: 104.4, pCalcPaper: 115.35, adpPaper: 10.49, zCO2Paper: 0.4885, zCH4Paper: 0.5115, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.39 (39%)
  { id: 'm-39-1', yCO2: 0.39, temperature: 283.1, pExpt: 54.3, pCalcPaper: 52.51, adpPaper: 3.30, zCO2Paper: 0.6525, zCH4Paper: 0.3475, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-39-2', yCO2: 0.39, temperature: 285.1, pExpt: 69.4, pCalcPaper: 69.94, adpPaper: 0.78, zCO2Paper: 0.6373, zCH4Paper: 0.3627, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-39-3', yCO2: 0.39, temperature: 287.4, pExpt: 97.8, pCalcPaper: 103.82, adpPaper: 6.16, zCO2Paper: 0.6074, zCH4Paper: 0.3926, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.40 (40%)
  { id: 'm-40-1', yCO2: 0.40, temperature: 280.7, pExpt: 40.3, pCalcPaper: 38.51, adpPaper: 4.44, zCO2Paper: 0.6734, zCH4Paper: 0.3266, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-40-2', yCO2: 0.40, temperature: 280.9, pExpt: 41.1, pCalcPaper: 39.45, adpPaper: 4.01, zCO2Paper: 0.6725, zCH4Paper: 0.3275, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.44 (44%)
  { id: 'm-44-1', yCO2: 0.44, temperature: 273.7, pExpt: 18.1, pCalcPaper: 17.54, adpPaper: 3.09, zCO2Paper: 0.7247, zCH4Paper: 0.2753, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-44-2', yCO2: 0.44, temperature: 285.1, pExpt: 68.4, pCalcPaper: 67.94, adpPaper: 0.67, zCO2Paper: 0.6728, zCH4Paper: 0.3272, reference: 'Adisasmito et al. (1991)' },

  // yCO2 = 0.50 (50%) - Authors' Experimental Study (Haghighi & Haghtalab 2024)
  { id: 'm-50-1', yCO2: 0.50, temperature: 275.0, pExpt: 19.6, pCalcPaper: 19.23, adpPaper: 1.89, zCO2Paper: 0.7602, zCH4Paper: 0.2398, reference: 'This work (Experimental)' },
  { id: 'm-50-2', yCO2: 0.50, temperature: 276.9, pExpt: 24.5, pCalcPaper: 23.50, adpPaper: 4.08, zCO2Paper: 0.7548, zCH4Paper: 0.2452, reference: 'This work (Experimental)' },
  { id: 'm-50-3', yCO2: 0.50, temperature: 278.7, pExpt: 28.1, pCalcPaper: 28.67, adpPaper: 2.03, zCO2Paper: 0.7500, zCH4Paper: 0.2500, reference: 'This work (Experimental)' },
  { id: 'm-50-4', yCO2: 0.50, temperature: 280.0, pExpt: 33.3, pCalcPaper: 33.32, adpPaper: 0.06, zCO2Paper: 0.7450, zCH4Paper: 0.2550, reference: 'This work (Experimental)' },
  { id: 'm-50-5', yCO2: 0.50, temperature: 280.6, pExpt: 36.0, pCalcPaper: 35.80, adpPaper: 0.56, zCO2Paper: 0.7424, zCH4Paper: 0.2576, reference: 'This work (Experimental)' },

  // yCO2 = 0.68 (68%)
  { id: 'm-68-1', yCO2: 0.68, temperature: 278.2, pExpt: 25.8, pCalcPaper: 25.71, adpPaper: 0.35, zCO2Paper: 0.8490, zCH4Paper: 0.1510, reference: 'Adisasmito et al. (1991)' },
  { id: 'm-68-2', yCO2: 0.68, temperature: 280.2, pExpt: 32.8, pCalcPaper: 32.77, adpPaper: 0.09, zCO2Paper: 0.8426, zCH4Paper: 0.1574, reference: 'Adisasmito et al. (1991)' },
];

// Literature benchmark comparison reported in paper (Section 4, Page 440)
export const LITERATURE_COMPARISON = [
  {
    model: 'This Work (Modified Chen-Guo + NRTL + SRK)',
    pureCO2_AADP: 1.34,
    pureCH4_AADP: 1.25,
    mixture_AADP: 1.98,
    highlight: true,
    features: 'Novel I(T, yCO2) function + fitted base fugacity f0(T) + rigorous NRTL aw',
  },
  {
    model: 'Sun & Chen (2005) [27]',
    pureCO2_AADP: null,
    pureCH4_AADP: null,
    mixture_AADP: 2.36,
    highlight: false,
    features: 'Modified Chen-Guo for sour gas and mixtures',
  },
  {
    model: 'Ma et al. (2024) [13]',
    pureCO2_AADP: null,
    pureCH4_AADP: null,
    mixture_AADP: 3.05,
    highlight: false,
    features: 'Empirical model fitting theoretical Chen-Guo and vdW-P',
  },
  {
    model: 'Original Chen-Guo (1998) [3]',
    pureCO2_AADP: null,
    pureCH4_AADP: null,
    mixture_AADP: 6.60,
    highlight: false,
    features: 'Standard constants without composition adjustment',
  },
  {
    model: 'Delavar & Haghtalab (2014) [8] (SRK, aw=1)',
    pureCO2_AADP: 15.00,
    pureCH4_AADP: null,
    mixture_AADP: 8.80,
    highlight: false,
    features: 'Chen-Guo with classical mixing rules and aw = 1 assumption',
  },
];
