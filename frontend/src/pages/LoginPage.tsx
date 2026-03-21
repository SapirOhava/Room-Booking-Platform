import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { setToken } from "../utils/token";
import type { LoginFormData } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const successMessage = location.state?.successMessage || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  async function onSubmit(data: LoginFormData) {
    try {
      setServerError("");

      const response = await loginUser(data);
      setToken(response.accessToken);

      navigate("/rooms");
    } catch (error: any) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>

      {successMessage && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border px-3 py-2"
            {...register("email", {
              required: "Email is required",
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-md border px-3 py-2"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
