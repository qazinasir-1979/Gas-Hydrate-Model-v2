import {
  LANGMUIR_PARAMS,
  BASE_FUGACITY_PARAMS,
} from './constants';

export interface HydratePhaseResult {
  C_CO2: number; // Langmuir constant (1/bar)
  C_CH4: number;
  theta_CO2: number;
  theta_CH4: number;
  theta_total: number;
  one_minus_theta: number;
  I_factor: number;
  f0_pure_CO2: number; // bar
  f0_pure_CH4: number;
  f0_mixture_CO2: number; // bar
  f0_mixture_CH4: number;
  f0_sI_CO2: number; // bar (with aw and Poynting factor)
  f0_sI_CH4: number;
  z_CO2: number; // mole fraction in hydrate phase
  z_CH4: number;
  sum_z: number;
}

/**
 * Calculates Langmuir constant C_i via Eq. (14)
 * C_i = X * exp(Y / (T - Z))
 */
export function calculateLangmuirConstant(gas: 'CO2' | 'CH4', T: number): number {
  const p = LANGMUIR_PARAMS[gas];
  return p.X * Math.exp(p.Y / (T - p.Z));
}

/**
 * Calculates the modification function I via Eq. (23)
 * I = 484112.8268 * exp(-0.0491 * T) + 1.2416*yCO2^3 - 1.9895*yCO2^2 + 1.3147*yCO2 - 0.1373
 */
export function calculateModificationFunctionI(T: number, yCO2: number): number {
  const termT = 484112.8268 * Math.exp(-0.0491 * T);
  const termY =
    1.2416 * Math.pow(yCO2, 3) -
    1.9895 * Math.pow(yCO2, 2) +
    1.3147 * yCO2 -
    0.1373;
  return termT + termY;
}

/**
 * Calculates pure base hydrate fugacity f_0^i(T) via Eq. (17)
 * f_0^i(T) = A * exp(B * T)
 */
export function calculatePureBaseFugacity(gas: 'CO2' | 'CH4', T: number): number {
  const p = BASE_FUGACITY_PARAMS[gas];
  return p.A * Math.exp(p.B * T);
}

/**
 * Calculates base hydrate fugacity for sI hydrate via Eq. (15)
 * f_{0, sI}^i = f_0^i(T) * (a_w)^(-23/3) * exp(0.4242 * P / T)
 */
export function calculateBaseFugacity_sI(
  f0_T: number,
  a_w: number,
  P: number,
  T: number
): number {
  const aw_term = Math.pow(Math.max(1e-4, a_w), -23.0 / 3.0);
  const poynting_term = Math.exp((0.4242 * P) / T);
  return f0_T * aw_term * poynting_term;
}

/**
 * Calculates hydrate phase properties and mole fractions for pure gas or mixture
 */
export function calculateHydratePhase(
  T: number,
  P: number,
  fG_CO2: number,
  fG_CH4: number,
  yCO2: number,
  a_w: number,
  isMixture: boolean
): HydratePhaseResult {
  // Langmuir constants (Eq. 14)
  const C_CO2 = calculateLangmuirConstant('CO2', T);
  const C_CH4 = calculateLangmuirConstant('CH4', T);

  // Cage occupancies (Eq. 13 & Eq. 19)
  const CF_sum = C_CO2 * fG_CO2 + C_CH4 * fG_CH4;
  const theta_total = CF_sum / (1.0 + CF_sum);
  const one_minus_theta = 1.0 / (1.0 + CF_sum);

  const theta_CO2 = (C_CO2 * fG_CO2) / (1.0 + CF_sum);
  const theta_CH4 = (C_CH4 * fG_CH4) / (1.0 + CF_sum);

  // Pure base fugacities (Eq. 17)
  const f0_pure_CO2 = calculatePureBaseFugacity('CO2', T);
  const f0_pure_CH4 = calculatePureBaseFugacity('CH4', T);

  // Modification function I for mixture (Eq. 23)
  const I_factor = isMixture ? calculateModificationFunctionI(T, yCO2) : 1.0;

  // Mixture base fugacities (Eq. 22: f0_i(T) = [A * exp(BT)] * I)
  const f0_mixture_CO2 = isMixture ? f0_pure_CO2 * I_factor : f0_pure_CO2;
  const f0_mixture_CH4 = isMixture ? f0_pure_CH4 * I_factor : f0_pure_CH4;

  // Structure sI base fugacities with aw and Poynting factor (Eq. 15)
  const f0_sI_CO2 = calculateBaseFugacity_sI(f0_mixture_CO2, a_w, P, T);
  const f0_sI_CH4 = calculateBaseFugacity_sI(f0_mixture_CH4, a_w, P, T);

  // Hydrate mole fractions (Eq. 20)
  // z_i = f_i^G / [ f0_sI_i * (1 - sum theta_j)^(1/3) ]
  const cavityFactor = Math.pow(Math.max(1e-12, one_minus_theta), 1.0 / 3.0);

  let z_CO2 = 0;
  let z_CH4 = 0;

  if (isMixture) {
    z_CO2 = fG_CO2 / (f0_sI_CO2 * cavityFactor);
    z_CH4 = fG_CH4 / (f0_sI_CH4 * cavityFactor);
  } else {
    if (yCO2 > 0.5) {
      z_CO2 = 1.0;
      z_CH4 = 0.0;
    } else {
      z_CO2 = 0.0;
      z_CH4 = 1.0;
    }
  }

  const sum_z = z_CO2 + z_CH4;

  return {
    C_CO2,
    C_CH4,
    theta_CO2,
    theta_CH4,
    theta_total,
    one_minus_theta,
    I_factor,
    f0_pure_CO2,
    f0_pure_CH4,
    f0_mixture_CO2,
    f0_mixture_CH4,
    f0_sI_CO2,
    f0_sI_CH4,
    z_CO2,
    z_CH4,
    sum_z,
  };
}
