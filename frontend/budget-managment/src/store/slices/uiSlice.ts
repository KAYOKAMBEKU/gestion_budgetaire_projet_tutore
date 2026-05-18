import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "info";

interface UiState {
  sidebarOpen: boolean;
  currentAdminTab: string;
  globalLoading: boolean;
  modalOpen: boolean;
  selectedEntityId?: number;
  toastMessage?: string;
  toastType: ToastType;
}

const initialState: UiState = {
  sidebarOpen: true,
  currentAdminTab: "users",
  globalLoading: false,
  modalOpen: false,
  toastType: "info",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setCurrentAdminTab(state, action: PayloadAction<string>) {
      state.currentAdminTab = action.payload;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    setModalOpen(state, action: PayloadAction<boolean>) {
      state.modalOpen = action.payload;
    },
    setSelectedEntityId(state, action: PayloadAction<number | undefined>) {
      state.selectedEntityId = action.payload;
    },
    showToast(state, action: PayloadAction<{ message: string; type: ToastType }>) {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type;
    },
    clearToast(state) {
      state.toastMessage = undefined;
    },
  },
});

export const { clearToast, setCurrentAdminTab, setGlobalLoading, setModalOpen, setSelectedEntityId, setSidebarOpen, showToast } =
  uiSlice.actions;
export default uiSlice.reducer;
