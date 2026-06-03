import { type CurrencyCode, useCurrency } from "../../context/CurrencyContext";

const currencies: CurrencyCode[] = ["FC", "USD"];

interface CurrencySelectorProps {
  onChange?: (currency: CurrencyCode) => void;
  value?: CurrencyCode;
  variant?: "sidebar" | "modal";
}

export function CurrencySelector({ onChange, value, variant = "sidebar" }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const isModal = variant === "modal";
  const selectedCurrency = value ?? currency;
  const changeCurrency = onChange ?? setCurrency;

  return (
    <div className={isModal ? "rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3" : "mb-4 rounded-lg border border-white/10 bg-white/5 p-2"}>
      <p className={isModal ? "px-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]" : "px-1 text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]/70"}>Devise</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {currencies.map((item) => (
          <button
            className={
              isModal
                ? `rounded-md px-3 py-2 text-sm font-semibold transition ${
                    selectedCurrency === item ? "bg-[#0F3D5E] text-white shadow-sm" : "bg-white text-[#374151] ring-1 ring-[#E5E7EB] hover:bg-[#EEF6FA]"
                  }`
                : `rounded-md px-3 py-2 text-sm font-semibold transition ${
                    selectedCurrency === item ? "bg-white text-[#0F3D5E] shadow-sm" : "bg-white/10 text-[#DCEAF3] hover:bg-white/20 hover:text-white"
                  }`
            }
            key={item}
            onClick={() => changeCurrency(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
