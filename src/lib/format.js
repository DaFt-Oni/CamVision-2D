export const format = (value, digits = 1) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
