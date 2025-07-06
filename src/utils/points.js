export function calcularPuntos(reps, multiplier, weight, refWeight = 73.5) {
  const coeff = weight / refWeight;
  return reps * multiplier * coeff;
}
