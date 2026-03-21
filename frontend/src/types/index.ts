export type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RegisterResponse = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};
