export interface ComponentProps {
  name: string;
  formula: string;
  Tc: number; // K
  Pc: number; // bar
  omega: number; // acentric factor
}

export interface LangmuirParams {
  X: number;
  Y: number;
  Z: number;
}

export interface BaseFugacityParams {
  A: number;
  B: number;
}

export interface HenryParams {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface PureValidationPoint {
  gas: 'CO2' | 'CH4';
  temperature: number; // K
  pExpt: number; // bar
  pCalcPaper: number; // bar from paper
  adpPaper: number; // %
  reference?: string;
}

export interface MixtureValidationPoint {
  id: string;
  yCO2: number; // mole fraction (0 - 1)
  temperature: number; // K
  pExpt: number; // bar
  pCalcPaper: number; // bar from paper
  adpPaper: number; // %
  zCO2Paper?: number;
  zCH4Paper?: number;
  reference?: string;
}

export interface LinearCorrelation {
  yCO2Percent: number; // 8, 13, 22, 25, 39, 44, 50, 68
  slope: number; // e.g. -0.001092
  intercept: number; // e.g. 0.781
  rSquared: number;
}

export interface CalculationResult {
  gasType: 'pure_CO2' | 'pure_CH4' | 'mixture';
  temperature: number; // K
  yCO2: number;
  yCH4: number;
  equilibriumPressure: number; // bar
  iterations: number;
  converged: boolean;
  
  // Gas phase properties at equilibrium
  Z_gas: number;
  phi_CO2: number;
  phi_CH4: number;
  fG_CO2: number; // bar
  fG_CH4: number; // bar
  
  // Hydrate phase properties
  C_CO2: number; // 1/bar
  C_CH4: number; // 1/bar
  theta_CO2: number;
  theta_CH4: number;
  theta_total: number;
  I_factor: number;
  f0_CO2: number; // bar
  f0_CH4: number; // bar
  f0_sI_CO2: number; // bar
  f0_sI_CH4: number; // bar
  z_CO2: number; // mole fraction in hydrate
  z_CH4: number;
  
  // Liquid phase properties
  pSat_water: number; // bar
  H_CO2: number; // bar
  H_CH4: number; // bar
  x_CO2: number; // solubility in water
  x_CH4: number;
  x_water: number;
  gamma_water: number; // NRTL activity coefficient
  a_water: number; // water activity
  
  // Gas separation performance
  separationFactor?: number; // (z_CO2/z_CH4) / (y_CO2/y_CH4)
  enrichmentFactor?: number; // z_CO2 / y_CO2
  linearCorrelationZCO2?: number; // from Table 10 fit if available
}

export interface ValidationSummary {
  pureCO2_AADP: number;
  pureCH4_AADP: number;
  mixture_AADP: number;
  overall_AADP: number;
  pointsCalculated: number;
  maxDeviation: number;
  minDeviation: number;
}
