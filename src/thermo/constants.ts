import { ComponentProps, LangmuirParams, BaseFugacityParams, HenryParams, LinearCorrelation } from './types';

// Universal gas constant: 83.14 bar·cm³ / (mol·K)
export const R_GAS = 83.1446;

// Internal molar energy of water (bar·cm³), Eq. 30
export const DELTA_U_W = 375750.0;

// NRTL parameters, Eq. 38, xi = 1.15, alpha_ji = 0.3
export const NRTL_XI = 1.15;
export const NRTL_ALPHA_JI = 0.3;

// Critical properties from Table 5
export const CRITICAL_PROPS: Record<'CO2' | 'CH4' | 'Water', ComponentProps> = {
  CO2: {
    name: 'Carbon dioxide',
    formula: 'CO2',
    Tc: 304.21, // K
    Pc: 73.831, // bar
    omega: 0.228,
  },
  CH4: {
    name: 'Methane',
    formula: 'CH4',
    Tc: 190.56, // K
    Pc: 45.991, // bar
    omega: 0.0115,
  },
  Water: {
    name: 'Water',
    formula: 'H2O',
    Tc: 373.946, // K (From Table 5 of Haghighi & Haghtalab 2024)
    Pc: 220.64, // bar
    omega: 0.334,
  },
};

// Langmuir constants from Table 2
// C_i = X * exp(Y / (T - Z))
export const LANGMUIR_PARAMS: Record<'CO2' | 'CH4', LangmuirParams> = {
  CO2: {
    X: 1.6464e-6,
    Y: 2799.66,
    Z: 15.90,
  },
  CH4: {
    X: 2.3048e-6,
    Y: 2752.29,
    Z: 23.01,
  },
};

// Base hydrate fugacity constants from Table 3
// f_0^i(T) = A * exp(B * T)
export const BASE_FUGACITY_PARAMS: Record<'CO2' | 'CH4', BaseFugacityParams> = {
  CO2: {
    A: 2703e-18, // 2703 * 10^-18
    B: 0.1316,
  },
  CH4: {
    A: 912e-16, // 912 * 10^-16
    B: 0.1230,
  },
};

// Henry's constant parameters from Table 4
// H_{i,w}(P_w^sat) = 1.01325 * exp[ -1 / 1.98719 * (A + B/T + C*ln(T) + D*T) ]
export const HENRY_PARAMS: Record<'CO2' | 'CH4', HenryParams> = {
  CO2: {
    A: -317.658,
    B: 17371.2,
    C: 43.0607,
    D: -0.002191,
  },
  CH4: {
    A: -365.183,
    B: 18106.7,
    C: 49.7554,
    D: -0.000285,
  },
};

// Table 10: Linear correlations for z_CO2 vs P: z_CO2 = slope * P + intercept
export const LINEAR_CORRELATIONS: LinearCorrelation[] = [
  { yCO2Percent: 68, slope: -0.000914, intercept: 0.873, rSquared: 0.998 },
  { yCO2Percent: 50, slope: -0.001092, intercept: 0.781, rSquared: 0.996774 }, // Eq. 44 in text
  { yCO2Percent: 44, slope: -0.001032, intercept: 0.743, rSquared: 0.997 },
  { yCO2Percent: 39, slope: -0.001039, intercept: 0.709, rSquared: 0.996 },
  { yCO2Percent: 25, slope: -0.000857, intercept: 0.578, rSquared: 0.997 },
  { yCO2Percent: 22, slope: -0.000855, intercept: 0.542, rSquared: 0.997 },
  { yCO2Percent: 13, slope: -0.000665, intercept: 0.401, rSquared: 0.998 },
  { yCO2Percent: 8,  slope: -0.000523, intercept: 0.291, rSquared: 0.996 },
];
