import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AdminState {
  selectedUserId?: number;
  selectedRoleId?: number;
  selectedDepartementId?: number;
  selectedExerciceId?: number;
  activeAdminSection: string;
}

const initialState: AdminState = {
  activeAdminSection: "dashboard",
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setSelectedUserId(state, action: PayloadAction<number | undefined>) {
      state.selectedUserId = action.payload;
    },
    setSelectedRoleId(state, action: PayloadAction<number | undefined>) {
      state.selectedRoleId = action.payload;
    },
    setSelectedDepartementId(state, action: PayloadAction<number | undefined>) {
      state.selectedDepartementId = action.payload;
    },
    setSelectedExerciceId(state, action: PayloadAction<number | undefined>) {
      state.selectedExerciceId = action.payload;
    },
    setActiveAdminSection(state, action: PayloadAction<string>) {
      state.activeAdminSection = action.payload;
    },
  },
});

export const { setActiveAdminSection, setSelectedDepartementId, setSelectedExerciceId, setSelectedRoleId, setSelectedUserId } =
  adminSlice.actions;
export default adminSlice.reducer;
