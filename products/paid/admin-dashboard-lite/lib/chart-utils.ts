export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value)
}

export const generateRandomData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }))
}
