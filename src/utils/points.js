// src/utils/points.js

/**
 * Calcula los puntos de una entrada según el sistema mejorado:
 * 
 * Fórmula:
 *   Puntos = Valor_Normalizado × Factor_Peso × Multiplicador × 100
 * 
 * @param {number} valor             – Reps, km, segundos, etc. registrados.
 * @param {number} pesoUsuario       – Peso en kg del participante.
 * @param {number} pesoReferencia    – Peso promedio del reto (refWeight).
 * @param {number} valorMaximo       – Valor máximo de referencia para la actividad.
 * @param {number} multiplicador     – Multiplicador específico del reto (por defecto 1).
 * @returns {number}                 – Puntos finales, redondeados al entero más cercano.
 */
export function calcularPuntos(valor, pesoUsuario, pesoReferencia, valorMaximo, multiplicador = 1) {
  // Paso 1: Normalizar valor
  let valorNormalizado;
  if (valor <= valorMaximo) {
    valorNormalizado = valor / valorMaximo;
  } else {
    valorNormalizado = 1 + (0.1 * Math.log(valor / valorMaximo));
  }

  // Paso 2: Calcular factor de peso
  const ratio = pesoUsuario / pesoReferencia;
  let factorPeso;
  
  if (ratio <= 0.8) {
    factorPeso = 0.85 + (0.15 * (ratio / 0.8));
  } else if (ratio <= 1.2) {
    factorPeso = 1.0 - (0.1 * Math.abs(ratio - 1));
  } else {
    factorPeso = 1.0 + (0.15 * Math.log(ratio));
  }

  // Paso 3: Escalar a base 100 y aplicar multiplicador
  const puntosBase  = valorNormalizado * 100;
  const puntosFinal = puntosBase * factorPeso * multiplicador;

  // Redondear al entero más cercano
  return Math.round(puntosFinal);
}
