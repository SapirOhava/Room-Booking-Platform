import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import type { RegisterFormData } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  async function onSubmit(data: RegisterFormData) {
    try {
      setServerError("");

      await registerUser(data);

      navigate("/login", {
        state: {
          successMessage: "Registration successful. You can now log in.",
        },
      });
    } catch (error: any) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Register</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            className="w-full rounded-md border px-3 py-2"
            {...register("fullName", {
              required: "Full name is required",
            })}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Login
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
