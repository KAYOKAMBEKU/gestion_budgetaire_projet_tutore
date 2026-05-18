import { clearToast } from "../../../store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "../../../store";

export function Toast() {
  const dispatch = useAppDispatch();
  const { toastMessage, toastType } = useAppSelector((state) => state.ui);

  if (!toastMessage) {
    return null;
  }

  const tone = toastType === "success" ? "bg-emerald-600" : toastType === "error" ? "bg-rose-600" : "bg-slate-900";

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-white p-2 shadow-xl ring-1 ring-slate-200">
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
