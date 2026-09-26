import { calculateSRK, calculatePureSRK } from './srk';
import { calculateLiquidPhase } from './liquidPhase';
import {
  calculateHydratePhase,
  calculateLangmuirConstant,
  calculatePureBaseFugacity,
  calculateModificationFunctionI,
  calculateBaseFugacity_sI,
} from './hydrateChenGuo';
import { CalculationResult, PureValidationPoint, MixtureValidationPoint, ValidationSummary } from './types';
import { LINEAR_CORRELATIONS } from './constants';
import { PURE_GAS_VALIDATION_DATA, MIXTURE_VALIDATION_DATA } from './validationData';

export interface SolverOptions {
  tolerance?: number;
  maxIterations?: number;
  initialP?: number;
  modelMode?: 'paper_calibrated' | 'rigorous_chen_guo' | 'literature_aw1';
}

/**
 * Solves hydrate equilibrium pressure for pure gas (CO2 or CH4)
 * Equilibrium condition: f^G = f^H
 */
export function solvePureGasEquilibrium(
  gas: 'CO2' | 'CH4',
  T: number,
  options: SolverOptions = {}
): CalculationResult {
  const tolerance = options.tolerance ?? 1e-4;
  const maxIterations = options.maxIterations ?? 60;
  const isCO2 = gas === 'CO2';

  let pLow = 1.0;
  let pHigh = 200.0;

  function evaluate(P: number) {
    const srk = calculatePureSRK(gas, T, P);
    const fG = srk.fG;

    const liquid = calculateLiquidPhase(
      T,
      P,
      isCO2 ? fG : 0,
      !isCO2 ? fG : 0
    );

    const C = calculateLangmuirConstant(gas, T);
    const oneMinusTheta = 1.0 / (1.0 + C * fG);

    const f0_T = calculatePureBaseFugacity(gas, T);
    const awUsed = options.modelMode === 'literature_aw1' ? 1.0 : liquid.a_water;
    const f0_sI = calculateBaseFugacity_sI(f0_T, awUsed, P, T);
    const fH = f0_sI * Math.pow(oneMinusTheta, 1.0 / 3.0);

    const residual = fG / fH - 1.0;

    return {
      residual,
      srk,
      liquid,
      C,
      theta: (C * fG) / (1.0 + C * fG),
      f0_T,
      f0_sI,
      fH,
      fG,
    };
  }

  // Bracket root
  let evalLow = evaluate(pLow);
  let evalHigh = evaluate(pHigh);

  let iter = 0;
  while (evalLow.residual * evalHigh.residual > 0 && iter < 12) {
    if (evalLow.residual > 0) {
      pLow = Math.max(0.5, pLow / 2.0);
      evalLow = evaluate(pLow);
    } else {
      pHigh = pHigh * 2.0;
      evalHigh = evaluate(pHigh);
    }
    iter++;
  }

  let pMid = options.initialP && options.initialP >= pLow && options.initialP <= pHigh
    ? options.initialP
    : (pLow + pHigh) / 2.0;
  let evalMid = evaluate(pMid);

  for (let i = 0; i < maxIterations; i++) {
    pMid = (pLow + pHigh) / 2.0;
    evalMid = evaluate(pMid);

    if (Math.abs(evalMid.residual) < tolerance || (pHigh - pLow) < 1e-4) {
      break;
    }

    if (evalMid.residual > 0) {
      // fG > fH => reduce P (Fig. 3)
      pHigh = pMid;
    } else {
      // fG < fH => increase P (Fig. 3)
      pLow = pMid;
    }
  }

  return {
    gasType: isCO2 ? 'pure_CO2' : 'pure_CH4',
    temperature: T,
    yCO2: isCO2 ? 1.0 : 0.0,
    yCH4: isCO2 ? 0.0 : 1.0,
    equilibriumPressure: pMid,
    iterations: maxIterations,
    converged: Math.abs(evalMid.residual) < 0.02,

    Z_gas: evalMid.srk.Z,
    phi_CO2: isCO2 ? evalMid.srk.phi : 0,
    phi_CH4: !isCO2 ? evalMid.srk.phi : 0,
    fG_CO2: isCO2 ? evalMid.fG : 0,
    fG_CH4: !isCO2 ? evalMid.fG : 0,

    C_CO2: isCO2 ? evalMid.C : 0,
    C_CH4: !isCO2 ? evalMid.C : 0,
    theta_CO2: isCO2 ? evalMid.theta : 0,
    theta_CH4: !isCO2 ? evalMid.theta : 0,
    theta_total: evalMid.theta,
    I_factor: 1.0,
    f0_CO2: isCO2 ? evalMid.f0_T : 0,
    f0_CH4: !isCO2 ? evalMid.f0_T : 0,
    f0_sI_CO2: isCO2 ? evalMid.f0_sI : 0,
    f0_sI_CH4: !isCO2 ? evalMid.f0_sI : 0,
    z_CO2: isCO2 ? 1.0 : 0.0,
    z_CH4: !isCO2 ? 1.0 : 0.0,

    pSat_water: evalMid.liquid.pSat_water,
    H_CO2: evalMid.liquid.H_CO2,
    H_CH4: evalMid.liquid.H_CH4,
    x_CO2: evalMid.liquid.x_CO2,
    x_CH4: evalMid.liquid.x_CH4,
    x_water: evalMid.liquid.x_water,
    gamma_water: evalMid.liquid.gamma_water,
    a_water: evalMid.liquid.a_water,
  };
}

/**
 * Solves hydrate equilibrium pressure for CO2 + CH4 gas mixture
 * Equilibrium condition: sum z_i = z_CO2 + z_CH4 = 1
 */
export function solveMixtureEquilibrium(
  T: number,
  yCO2: number,
  options: SolverOptions = {}
): CalculationResult {
  const yCH4 = Math.max(0, 1.0 - yCO2);

  if (yCO2 >= 0.999) {
    return solvePureGasEquilibrium('CO2', T, options);
  }
  if (yCO2 <= 0.001) {
    return solvePureGasEquilibrium('CH4', T, options);
  }

  const tolerance = options.tolerance ?? 1e-4;
  const maxIterations = options.maxIterations ?? 70;
  const isPaperCalibrated = options.modelMode !== 'rigorous_chen_guo' && options.modelMode !== 'literature_aw1';

  // In the paper, for gas mixtures, f0_CO2(T) incorporates the novel I(T, yCO2) function
  function evaluate(P: number) {
    const srk = calculateSRK(T, P, yCO2);
    const liquid = calculateLiquidPhase(T, P, srk.fG_CO2, srk.fG_CH4);
    const awUsed = options.modelMode === 'literature_aw1' ? 1.0 : liquid.a_water;

    const C_CO2 = calculateLangmuirConstant('CO2', T);
    const C_CH4 = calculateLangmuirConstant('CH4', T);

    const CF_sum = C_CO2 * srk.fG_CO2 + C_CH4 * srk.fG_CH4;
    const cavityFactor = Math.pow(1.0 / (1.0 + CF_sum), 1.0 / 3.0);

    const f0_pure_CO2 = calculatePureBaseFugacity('CO2', T);
    const f0_pure_CH4 = calculatePureBaseFugacity('CH4', T);

    const I_factor = options.modelMode === 'literature_aw1'
      ? 1.0
      : calculateModificationFunctionI(T, yCO2);

    // Apply modification function to CO2 component base fugacity in mixture
    const f0_mixture_CO2 = f0_pure_CO2 * I_factor;
    const f0_mixture_CH4 = f0_pure_CH4;

    const f0_sI_CO2 = calculateBaseFugacity_sI(f0_mixture_CO2, awUsed, P, T);
    const f0_sI_CH4 = calculateBaseFugacity_sI(f0_mixture_CH4, awUsed, P, T);

    const z_CO2_raw = srk.fG_CO2 / (f0_sI_CO2 * cavityFactor);
    const z_CH4_raw = srk.fG_CH4 / (f0_sI_CH4 * cavityFactor);
    const sum_z = z_CO2_raw + z_CH4_raw;

    const residual = sum_z - 1.0;

    return {
      residual,
      srk,
      liquid,
      C_CO2,
      C_CH4,
      theta_CO2: (C_CO2 * srk.fG_CO2) / (1.0 + CF_sum),
      theta_CH4: (C_CH4 * srk.fG_CH4) / (1.0 + CF_sum),
      theta_total: CF_sum / (1.0 + CF_sum),
      I_factor,
      f0_pure_CO2,
      f0_pure_CH4,
      f0_mixture_CO2,
      f0_mixture_CH4,
      f0_sI_CO2,
      f0_sI_CH4,
      z_CO2: sum_z > 0 ? z_CO2_raw / sum_z : 0.5,
      z_CH4: sum_z > 0 ? z_CH4_raw / sum_z : 0.5,
      sum_z,
    };
  }

  let pLow = 2.0;
  let pHigh = 220.0;

  let evalLow = evaluate(pLow);
  let evalHigh = evaluate(pHigh);

  let iter = 0;
  while (evalLow.residual * evalHigh.residual > 0 && iter < 12) {
    if (evalLow.residual > 0) {
      pLow = Math.max(1.0, pLow * 0.5);
      evalLow = evaluate(pLow);
    } else {
      pHigh = pHigh * 1.8;
      evalHigh = evaluate(pHigh);
    }
    iter++;
  }

  let pMid = options.initialP && options.initialP >= pLow && options.initialP <= pHigh
    ? options.initialP
    : (pLow + pHigh) / 2.0;
  let evalMid = evaluate(pMid);

  for (let i = 0; i < maxIterations; i++) {
    pMid = (pLow + pHigh) / 2.0;
    evalMid = evaluate(pMid);

    if (Math.abs(evalMid.residual) < tolerance || (pHigh - pLow) < 1e-4) {
      break;
    }

    if (evalMid.residual > 0) {
      // sum_z > 1 => reduce P (Fig. 4)
      pHigh = pMid;
    } else {
      // sum_z < 1 => increase P (Fig. 4)
      pLow = pMid;
    }
  }

  // Calculate separation factor and linear correlation
  const z_CO2 = evalMid.z_CO2;
  const z_CH4 = evalMid.z_CH4;
  const separationFactor =
    yCH4 > 0 && z_CH4 > 0 ? (z_CO2 / z_CH4) / (yCO2 / yCH4) : undefined;
  const enrichmentFactor = yCO2 > 0 ? z_CO2 / yCO2 : undefined;

  let linearZ: number | undefined = undefined;
  const yPercent = Math.round(yCO2 * 100);
  const matchCorr = LINEAR_CORRELATIONS.find(
    (c) => Math.abs(c.yCO2Percent - yPercent) <= 1
  );
  if (matchCorr) {
    linearZ = matchCorr.slope * pMid + matchCorr.intercept;
  }

  return {
    gasType: 'mixture',
    temperature: T,
    yCO2,
    yCH4,
    equilibriumPressure: pMid,
    iterations: maxIterations,
    converged: Math.abs(evalMid.residual) < 0.05,

    Z_gas: evalMid.srk.Z,
    phi_CO2: evalMid.srk.phi_CO2,
    phi_CH4: evalMid.srk.phi_CH4,
    fG_CO2: evalMid.srk.fG_CO2,
    fG_CH4: evalMid.srk.fG_CH4,

    C_CO2: evalMid.C_CO2,
    C_CH4: evalMid.C_CH4,
    theta_CO2: evalMid.theta_CO2,
    theta_CH4: evalMid.theta_CH4,
    theta_total: evalMid.theta_total,
    I_factor: evalMid.I_factor,
    f0_CO2: evalMid.f0_mixture_CO2,
    f0_CH4: evalMid.f0_mixture_CH4,
    f0_sI_CO2: evalMid.f0_sI_CO2,
    f0_sI_CH4: evalMid.f0_sI_CH4,
    z_CO2,
    z_CH4,

    pSat_water: evalMid.liquid.pSat_water,
    H_CO2: evalMid.liquid.H_CO2,
    H_CH4: evalMid.liquid.H_CH4,
    x_CO2: evalMid.liquid.x_CO2,
    x_CH4: evalMid.liquid.x_CH4,
    x_water: evalMid.liquid.x_water,
    gamma_water: evalMid.liquid.gamma_water,
    a_water: evalMid.liquid.a_water,

    separationFactor,
    enrichmentFactor,
    linearCorrelationZCO2: linearZ,
  };
}

/**
 * Universal dispatcher
 */
export function solveHydrateEquilibrium(
  T: number,
  yCO2: number,
  options: SolverOptions = {}
): CalculationResult {
  if (yCO2 >= 0.999) {
    return solvePureGasEquilibrium('CO2', T, options);
  }
  if (yCO2 <= 0.001) {
    return solvePureGasEquilibrium('CH4', T, options);
  }
  return solveMixtureEquilibrium(T, yCO2, options);
}

/**
 * Evaluates live validation results against Table 6 & Table 7 experimental points
 */
export function runValidationSuite(mode: SolverOptions['modelMode'] = 'paper_calibrated') {
  // Pure CO2 validation
  const pureCO2Results = PURE_GAS_VALIDATION_DATA.filter((p) => p.gas === 'CO2').map((pt) => {
    const calc = solvePureGasEquilibrium('CO2', pt.temperature, { modelMode: mode });
    const pCalcLive = calc.equilibriumPressure;
    const adpLive = (Math.abs(pCalcLive - pt.pExpt) / pt.pExpt) * 100;
    return {
      ...pt,
      pCalcLive,
      adpLive,
      calcResult: calc,
    };
  });

  // Pure CH4 validation
  const pureCH4Results = PURE_GAS_VALIDATION_DATA.filter((p) => p.gas === 'CH4').map((pt) => {
    const calc = solvePureGasEquilibrium('CH4', pt.temperature, { modelMode: mode });
    const pCalcLive = calc.equilibriumPressure;
    const adpLive = (Math.abs(pCalcLive - pt.pExpt) / pt.pExpt) * 100;
    return {
      ...pt,
      pCalcLive,
      adpLive,
      calcResult: calc,
    };
  });

  // Mixture validation (27 points)
  const mixtureResults = MIXTURE_VALIDATION_DATA.map((pt) => {
    const calc = solveMixtureEquilibrium(pt.temperature, pt.yCO2, { modelMode: mode });
    const pCalcLive = calc.equilibriumPressure;
    const adpLive = (Math.abs(pCalcLive - pt.pExpt) / pt.pExpt) * 100;
    return {
      ...pt,
      pCalcLive,
      adpLive,
      zCO2Live: calc.z_CO2,
      zCH4Live: calc.z_CH4,
      calcResult: calc,
    };
  });

  // Calculate AADP%
  const pureCO2_AADP =
    pureCO2Results.reduce((acc, curr) => acc + curr.adpLive, 0) / pureCO2Results.length;
  const pureCH4_AADP =
    pureCH4Results.reduce((acc, curr) => acc + curr.adpLive, 0) / pureCH4Results.length;
  const mixture_AADP =
    mixtureResults.reduce((acc, curr) => acc + curr.adpLive, 0) / mixtureResults.length;

  const allPoints = [...pureCO2Results, ...pureCH4Results, ...mixtureResults];
  const overall_AADP =
    allPoints.reduce((acc, curr) => acc + curr.adpLive, 0) / allPoints.length;

  const allDeviations = allPoints.map((p) => p.adpLive);
  const maxDeviation = Math.max(...allDeviations);
  const minDeviation = Math.min(...allDeviations);

  const summary: ValidationSummary = {
    pureCO2_AADP,
    pureCH4_AADP,
    mixture_AADP,
    overall_AADP,
    pointsCalculated: allPoints.length,
    maxDeviation,
    minDeviation,
  };

  return {
    pureCO2Results,
    pureCH4Results,
    mixtureResults,
    summary,
  };
}

/**
 * Generate P-T equilibrium curve points for a given gas composition
 */
export function generatePTCurve(
  yCO2: number,
  tMinK: number = 273.15,
  tMaxK: number = 288.0,
  stepCount: number = 25
): { T: number; TCelsius: number; P: number; zCO2: number; zCH4: number; SF?: number }[] {
  const points: { T: number; TCelsius: number; P: number; zCO2: number; zCH4: number; SF?: number }[] = [];
  const dt = (tMaxK - tMinK) / (stepCount - 1);

  for (let i = 0; i < stepCount; i++) {
    const T = tMinK + i * dt;
    try {
      const res = solveHydrateEquilibrium(T, yCO2);
      points.push({
        T,
        TCelsius: T - 273.15,
        P: res.equilibriumPressure,
        zCO2: res.z_CO2,
        zCH4: res.z_CH4,
        SF: res.separationFactor,
      });
    } catch {
      // skip unconverged edge
    }
  }

  return points;
}
