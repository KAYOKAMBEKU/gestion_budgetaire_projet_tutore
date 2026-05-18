import { apiClient } from "../api/client";
import type { AuthUser, LoginResponse } from "../types/auth";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.set("username", email);
    formData.set("password", password);

    const { data } = await apiClient.post<LoginResponse>("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  },
};
