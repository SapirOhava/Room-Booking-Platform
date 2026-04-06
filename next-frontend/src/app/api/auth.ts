import api from "./axios";

type RegisterData = {
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

export async function registerUser(data: RegisterData) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function loginUser(data: LoginData) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}
