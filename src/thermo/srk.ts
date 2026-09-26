import { R_GAS, CRITICAL_PROPS } from './constants';

export interface SRKResult {
  Z: number;
  phi_CO2: number;
  phi_CH4: number;
  fG_CO2: number; // bar
  fG_CH4: number; // bar
  A: number;
  B: number;
  aa: number;
}

/**
 * Calculates SRK alpha_i according to Eq. (7):
 * alpha_i = [1 + (0.48508 + 1.55171*omega_i - 0.15613*omega_i^2) * (1 - Tr_i^0.5)]^2
 */
export function calculateSRKAlpha(T: number, Tc: number, omega: number): number {
  const Tr = T / Tc;
  const m = 0.48508 + 1.55171 * omega - 0.15613 * omega * omega;
  const term = 1 + m * (1 - Math.sqrt(Tr));
  return term * term;
}

/**
 * Solves cubic equation Z^3 - Z^2 + (A - B - B^2)*Z - A*B = 0 for gas phase root (largest real root Z > B).
 */
export function solveCubicSRK(A: number, B: number): number {
  const a2 = -1.0;
  const a1 = A - B - B * B;
  const a0 = -A * B;

  // Substitute Z = x - a2/3 = x + 1/3
  const p = a1 - (a2 * a2) / 3.0;
  const q = (2.0 * a2 * a2 * a2) / 27.0 - (a2 * a1) / 3.0 + a0;

  const discriminant = (q * q) / 4.0 + (p * p * p) / 27.0;

  let root = 1.0;

  if (discriminant > 0) {
    // One real root
    const sqrtDisc = Math.sqrt(discriminant);
    const u = Math.cbrt(-q / 2.0 + sqrtDisc);
    const v = Math.cbrt(-q / 2.0 - sqrtDisc);
    root = u + v - a2 / 3.0;
  } else if (discriminant === 0) {
    const u = Math.cbrt(-q / 2.0);
    const r1 = 2 * u - a2 / 3.0;
    const r2 = -u - a2 / 3.0;
    root = Math.max(r1, r2);
  } else {
    // Three real roots: trigonometric form
    const m = 2.0 * Math.sqrt(-p / 3.0);
    const theta = Math.acos(-q / (2.0 * Math.sqrt(-Math.pow(p / 3.0, 3))));
    const r1 = m * Math.cos(theta / 3.0) - a2 / 3.0;
    const r2 = m * Math.cos((theta + 2.0 * Math.PI) / 3.0) - a2 / 3.0;
    const r3 = m * Math.cos((theta + 4.0 * Math.PI) / 3.0) - a2 / 3.0;
    root = Math.max(r1, r2, r3);
  }

  // Newton-Raphson refinement
  let z = Math.max(root, B + 1e-4);
  for (let iter = 0; iter < 10; iter++) {
    const f = z * z * z - z * z + (A - B - B * B) * z - A * B;
    const df = 3 * z * z - 2 * z + (A - B - B * B);
    if (Math.abs(df) < 1e-12) break;
    const dz = f / df;
    z -= dz;
    if (Math.abs(dz) < 1e-9) break;
  }

  return Math.max(z, B + 1e-6);
}

/**
 * Calculates SRK gas phase properties for pure gas or CO2+CH4 binary mixture.
 * @param T Temperature in K
 * @param P Pressure in bar
 * @param yCO2 Mole fraction of CO2 (0 to 1)
 */
export function calculateSRK(T: number, P: number, yCO2: number): SRKResult {
  const yCH4 = Math.max(0, 1.0 - yCO2);
  const R = R_GAS;

  const co2 = CRITICAL_PROPS.CO2;
  const ch4 = CRITICAL_PROPS.CH4;

  // Pure component a_i, b_i
  const a_CO2 = 0.42747 * (R * R * co2.Tc * co2.Tc) / co2.Pc;
  const b_CO2 = 0.08664 * (R * co2.Tc) / co2.Pc;

  const a_CH4 = 0.42747 * (R * R * ch4.Tc * ch4.Tc) / ch4.Pc;
  const b_CH4 = 0.08664 * (R * ch4.Tc) / ch4.Pc;

  // Temperature dependency alpha_i
  const alpha_CO2 = calculateSRKAlpha(T, co2.Tc, co2.omega);
  const alpha_CH4 = calculateSRKAlpha(T, ch4.Tc, ch4.omega);

  const a_alpha_CO2 = a_CO2 * alpha_CO2;
  const a_alpha_CH4 = a_CH4 * alpha_CH4;

  // Binary interactions (aa)_ij = sqrt( (a_i*alpha_i) * (a_j*alpha_j) )
  const aa_11 = a_alpha_CO2;
  const aa_22 = a_alpha_CH4;
  const aa_12 = Math.sqrt(aa_11 * aa_22);

  // Mixture aa and b
  const aa = yCO2 * yCO2 * aa_11 + 2 * yCO2 * yCH4 * aa_12 + yCH4 * yCH4 * aa_22;
  const b_mix = yCO2 * b_CO2 + yCH4 * b_CH4;

  // Dimensionless A, B, and B_i
  const A = (aa * P) / (R * R * T * T);
  const B = (b_mix * P) / (R * T);

  const B_CO2 = (b_CO2 * P) / (R * T);
  const B_CH4 = (b_CH4 * P) / (R * T);

  // Compressibility factor Z
  const Z = solveCubicSRK(A, B);

  // Fugacity coefficients phi_i from Eq. (3)
  // For component 1 (CO2):
  // sum_k y_k * (aa)_{1k} = yCO2 * aa_11 + yCH4 * aa_12
  const sum_aa_CO2 = yCO2 * aa_11 + yCH4 * aa_12;
  const termCO2 = aa > 0 ? (2.0 * sum_aa_CO2) / aa - B_CO2 / B : 1.0;
  const logZratio = Math.log((Z + B) / Z);
  const lnPhi_CO2 =
    (B_CO2 / B) * (Z - 1.0) -
    Math.log(Math.max(1e-12, Z - B)) -
    (A / B) * termCO2 * logZratio;

  // For component 2 (CH4):
  const sum_aa_CH4 = yCO2 * aa_12 + yCH4 * aa_22;
  const termCH4 = aa > 0 ? (2.0 * sum_aa_CH4) / aa - B_CH4 / B : 1.0;
  const lnPhi_CH4 =
    (B_CH4 / B) * (Z - 1.0) -
    Math.log(Math.max(1e-12, Z - B)) -
    (A / B) * termCH4 * logZratio;

  const phi_CO2 = Math.exp(lnPhi_CO2);
  const phi_CH4 = Math.exp(lnPhi_CH4);

  // Gas fugacity f_i^G = y_i * phi_i * P (Eq. 2)
  const fG_CO2 = yCO2 * phi_CO2 * P;
  const fG_CH4 = yCH4 * phi_CH4 * P;

  return {
    Z,
    phi_CO2,
    phi_CH4,
    fG_CO2,
    fG_CH4,
    A,
    B,
    aa,
  };
}

/**
 * Pure gas SRK fugacity calculator helper
 */
export function calculatePureSRK(gas: 'CO2' | 'CH4', T: number, P: number): { Z: number; phi: number; fG: number } {
  const yCO2 = gas === 'CO2' ? 1.0 : 0.0;
  const res = calculateSRK(T, P, yCO2);
  const phi = gas === 'CO2' ? res.phi_CO2 : res.phi_CH4;
  return {
    Z: res.Z,
    phi,
    fG: phi * P,
  };
}
