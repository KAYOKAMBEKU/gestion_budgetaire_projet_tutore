import { useEffect } from "react";
import { clearToast } from "../../../store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "../../../store";

export function Toast() {
  const dispatch = useAppDispatch();
  const { toastMessage, toastType } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      dispatch(clearToast());
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [dispatch, toastMessage]);

  if (!toastMessage) {
    return null;
  }

  const tone = toastType === "success" ? "bg-[#16A34A]" : toastType === "error" ? "bg-[#DC2626]" : "bg-[#0F3D5E]";

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-white p-2 shadow-xl ring-1 ring-[#E5E7EB]">
      <div className={`rounded-md px-4 py-3 text-sm font-medium text-white ${tone}`}>
        <div className="flex items-start justify-between gap-4">
          <span>{toastMessage}</span>
          <button className="font-bold text-white/90" onClick={() => dispatch(clearToast())}>
            x
          </button>
        </div>
      </div>
    </div>
  );
}
