import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type CurrencyCode = "FC" | "USD";

const STORAGE_KEY = "budgetCurrency";
const CHANGE_EVENT = "budget-currency-change";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "FC" || value === "USD";
}

export function getCurrencyPreference(): CurrencyCode {
  if (typeof window === "undefined") {
    return "FC";
  }

  const storedCurrency = window.localStorage.getItem(STORAGE_KEY);
  return isCurrencyCode(storedCurrency) ? storedCurrency : "FC";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => getCurrencyPreference());

  function setCurrency(nextCurrency: CurrencyCode) {
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
    setCurrencyState(nextCurrency);
    window.dispatchEvent(new CustomEvent<CurrencyCode>(CHANGE_EVENT, { detail: nextCurrency }));
  }

  useEffect(() => {
    function syncCurrency(event: Event) {
      if (event instanceof CustomEvent && isCurrencyCode(event.detail)) {
        setCurrencyState(event.detail);
        return;
      }
      setCurrencyState(getCurrencyPreference());
    }

    window.addEventListener(CHANGE_EVENT, syncCurrency);
    window.addEventListener("storage", syncCurrency);
    return () => {
      window.removeEventListener(CHANGE_EVENT, syncCurrency);
      window.removeEventListener("storage", syncCurrency);
    };
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
