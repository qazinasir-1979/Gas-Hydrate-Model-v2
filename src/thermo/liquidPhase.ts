import {
  R_GAS,
  DELTA_U_W,
  NRTL_XI,
  NRTL_ALPHA_JI,
  CRITICAL_PROPS,
  HENRY_PARAMS,
} from './constants';

export interface LiquidPhaseResult {
  pSat_water: number; // bar
  v_sat_w: number; // cm3/mol
  c_parameter: number; // bar
  v_infty_CO2: number; // cm3/mol
  v_infty_CH4: number; // cm3/mol
  H_pSat_CO2: number; // bar
  H_pSat_CH4: number; // bar
  H_CO2: number; // bar
  H_CH4: number; // bar
  x_CO2: number; // liquid solubility
  x_CH4: number;
  x_water: number;
  gamma_water: number; // NRTL activity coeff
  a_water: number; // water activity
}

/**
 * Calculates water saturation pressure (bar) via Eq. (28)
 */
export function calculateWaterPSat(T: number): number {
  // psat_w (bar) = exp[ 12.048399 - 4030.18245 / (T - 38.15) ]
  return Math.exp(12.048399 - 4030.18245 / (T - 38.15));
}

/**
 * Calculates Henry's constant at saturation pressure (Eq. 32)
 */
export function calculateHenryAtPSat(gas: 'CO2' | 'CH4', T: number): number {
  const p = HENRY_PARAMS[gas];
  const term = p.A + p.B / T + p.C * Math.log(T) + p.D * T;
  return 1.01325 * Math.exp((-1.0 / 1.98719) * term);
}

/**
 * Calculates alpha_i for NRTL via Eq. (40)
 * alpha_i = [1 + (0.37464 + 1.54226*omega_i - 0.26992*omega_i^2) * (1 - Tr_i^0.5)]^2
 */
export function calculateNRTLAlpha(T: number, Tc: number, omega: number): number {
  const Tr = T / Tc;
  const m = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
  const term = 1 + m * (1 - Math.sqrt(Tr));
  return term * term;
}

/**
 * Calculates NRTL liquid activity coefficient for water (Eq. 35 - 42)
 */
export function calculateNRTLWaterActivity(
  T: number,
  x_CO2: number,
  x_CH4: number,
  x_w: number
): number {
  // Components: 0 = Water, 1 = CO2, 2 = CH4
  const components = [
    CRITICAL_PROPS.Water,
    CRITICAL_PROPS.CO2,
    CRITICAL_PROPS.CH4,
  ];
  const x = [x_w, x_CO2, x_CH4];
  const R = R_GAS;

  // Eq. 38: A0 = (1 / (2*sqrt(2))) * ln( (xi + 1 + sqrt(2)) / (xi + 1 - sqrt(2)) )
  const sqrt2 = Math.sqrt(2.0);
  const A0 = (1.0 / (2.0 * sqrt2)) * Math.log((NRTL_XI + 1.0 + sqrt2) / (NRTL_XI + 1.0 - sqrt2));

  // Compute a_i and b_i for each component (Eq. 39 & 41)
  const a: number[] = [];
  const b: number[] = [];

  for (let i = 0; i < 3; i++) {
    const comp = components[i];
    const alpha_i = calculateNRTLAlpha(T, comp.Tc, comp.omega);
    const a_i = (0.45724 * alpha_i * R * R * comp.Tc * comp.Tc) / comp.Pc;
    const b_i = (0.0778 * R * comp.Tc) / comp.Pc;
    a.push(a_i);
    b.push(b_i);
  }

  // tau_ji and G_ji matrix (Eq. 36, 37, 42)
  const tau: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const G: number[][] = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];

  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      if (i === j) {
        tau[j][i] = 0.0;
        G[j][i] = 1.0;
      } else {
        const a_ji = Math.sqrt(a[j] * a[i]);
        tau[j][i] = (A0 / (R * T)) * (a_ji / b[j] - a[i] / b[i]);
        G[j][i] = Math.exp(-NRTL_ALPHA_JI * tau[j][i]);
      }
    }
  }

  // Calculate ln(gamma_w) for water (i = 0) via Eq. (35):
  // Term 1: sum_j (tau_j0 * G_j0 * x_j) / sum_j (G_j0 * x_j)
  let num1 = 0;
  let den1 = 0;
  for (let j = 0; j < 3; j++) {
    num1 += tau[j][0] * G[j][0] * x[j];
    den1 += G[j][0] * x[j];
  }
  const term1 = den1 > 0 ? num1 / den1 : 0;

  // Term 2: sum_j [ (G_0j * x_j / sum_k(G_kj * x_k)) * (tau_0j - sum_k(G_kj * x_k * tau_kj) / sum_k(G_kj * x_k)) ]
  let term2 = 0;
  for (let j = 0; j < 3; j++) {
    let den_k = 0;
    let num_k = 0;
    for (let k = 0; k < 3; k++) {
      den_k += G[k][j] * x[k];
      num_k += G[k][j] * x[k] * tau[k][j];
    }
    if (den_k > 0) {
      const avg_tau_j = num_k / den_k;
      term2 += (G[0][j] * x[j] / den_k) * (tau[0][j] - avg_tau_j);
    }
  }

  const lnGamma_w = term1 + term2;
  return Math.exp(lnGamma_w);
}

/**
 * Complete liquid phase calculation according to section 3.3
 */
export function calculateLiquidPhase(
  T: number,
  P: number,
  fG_CO2: number,
  fG_CH4: number
): LiquidPhaseResult {
  const R = R_GAS;
  const pSat_water = calculateWaterPSat(T);

  // Water saturated molar volume vsat_w via Eq. (31)
  const water = CRITICAL_PROPS.Water;
  const Tr_w = T / water.Tc;
  const termTr = Math.pow(Math.max(0, 1.0 - Tr_w), 2.0 / 7.0);
  const exponent = 1.0 + termTr;
  const base = Math.max(1e-6, 0.2905 - 0.08775 * water.omega);
  const v_sat_w = ((R * water.Tc) / water.Pc) * Math.pow(base, exponent);

  // Parameter c via Eq. (30)
  const c_parameter = DELTA_U_W / v_sat_w;

  // Partial molar volume at infinite dilution v_i^infty via Eq. (29)
  const co2 = CRITICAL_PROPS.CO2;
  const ch4 = CRITICAL_PROPS.CH4;

  const v_infty_CO2 =
    ((R * co2.Tc) / co2.Pc) * (0.095 + (2.35 * T * co2.Pc) / (c_parameter * co2.Tc));
  const v_infty_CH4 =
    ((R * ch4.Tc) / ch4.Pc) * (0.095 + (2.35 * T * ch4.Pc) / (c_parameter * ch4.Tc));

  // Henry's constant at saturation pressure
  const H_pSat_CO2 = calculateHenryAtPSat('CO2', T);
  const H_pSat_CH4 = calculateHenryAtPSat('CH4', T);

  // High pressure Henry's constant via Eq. (27)
  const deltaP = Math.max(0, P - pSat_water);
  const H_CO2 = H_pSat_CO2 * Math.exp((v_infty_CO2 * deltaP) / (R * T));
  const H_CH4 = H_pSat_CH4 * Math.exp((v_infty_CH4 * deltaP) / (R * T));

  // Gas solubility in water via Eq. (33)
  const x_CO2 = Math.min(0.2, Math.max(0, fG_CO2 / H_CO2));
  const x_CH4 = Math.min(0.2, Math.max(0, fG_CH4 / H_CH4));

  // Water mole fraction via Eq. (34)
  const x_water = Math.max(0.01, 1.0 - x_CO2 - x_CH4);

  // Water activity coefficient via NRTL Eq. (35)
  const gamma_water = calculateNRTLWaterActivity(T, x_CO2, x_CH4, x_water);

  // Water activity a_w via Eq. (24)
  const a_water = Math.min(1.0, Math.max(0.5, x_water * gamma_water));

  return {
    pSat_water,
    v_sat_w,
    c_parameter,
    v_infty_CO2,
    v_infty_CH4,
    H_pSat_CO2,
    H_pSat_CH4,
    H_CO2,
    H_CH4,
    x_CO2,
    x_CH4,
    x_water,
    gamma_water,
    a_water,
  };
}
