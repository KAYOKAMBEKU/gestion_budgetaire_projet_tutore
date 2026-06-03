import { getCurrencyPreference, type CurrencyCode } from "../../../context/CurrencyContext";

export function formatAmount(amount: number, currency: CurrencyCode = getCurrencyPreference()) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: currency === "USD" ? 2 : 0,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount)} ${currency}`;
}
