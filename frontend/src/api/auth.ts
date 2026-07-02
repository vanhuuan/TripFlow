import { apiClient } from "./client";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: CurrentUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  displayName: string;
  password: string;
};

export async function login(request: LoginRequest) {
  const response = await apiClient.post<AuthResponse>("/api/auth/login", request);
  return response.data;
}

export async function signup(request: SignupRequest) {
  const response = await apiClient.post<AuthResponse>("/api/auth/signup", request);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUser>("/api/auth/me");
  return response.data;
}
