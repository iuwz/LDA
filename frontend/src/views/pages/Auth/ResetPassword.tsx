import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../../api";
import { Button } from "../../components/common/button";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Password checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;

  const valid = hasUppercase && hasNumber && hasSymbol && hasMinLength;

  const strengthScore = [hasUppercase, hasNumber, hasSymbol, hasMinLength].filter(Boolean).length;
  const strengthColor =
    strengthScore === 4
      ? "bg-green-500"
      : strengthScore === 3
      ? "bg-yellow-400"
      : strengthScore === 2
      ? "bg-orange-400"
      : "bg-red-400";
  const strengthWidth = `${(strengthScore / 4) * 100}%`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!valid) {
      setError(
        "Password must include at least 8 characters, one uppercase letter, one number, and one special character."
      );
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-24 text-red-600">
        Invalid or missing token.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      {success ? (
        <p className="text-green-600">Password reset! Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <label className="block mb-2">New Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Rule checklist */}
          <div className="mt-3 text-sm space-y-1.5 bg-gray-50 p-3 rounded-lg">
            <p className={`${hasUppercase ? "text-green-600" : "text-gray-500"} flex items-center`}>
              <span className="mr-2">{hasUppercase ? "✓" : "○"}</span> Uppercase letter
            </p>
            <p className={`${hasNumber ? "text-green-600" : "text-gray-500"} flex items-center`}>
              <span className="mr-2">{hasNumber ? "✓" : "○"}</span> Number
            </p>
            <p className={`${hasSymbol ? "text-green-600" : "text-gray-500"} flex items-center`}>
              <span className="mr-2">{hasSymbol ? "✓" : "○"}</span> Special character
            </p>
            <p className={`${hasMinLength ? "text-green-600" : "text-gray-500"} flex items-center`}>
              <span className="mr-2">{hasMinLength ? "✓" : "○"}</span> At least 8 characters
            </p>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-3 h-2 w-full bg-gray-200 rounded">
              <div className={`h-full rounded ${strengthColor}`} style={{ width: strengthWidth }} />
            </div>
          )}

          {/* Confirm Password */}
          <label className="block mt-4 mb-2">Confirm Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded mb-1"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {/* Match bar */}
          {confirm.length > 0 && (
            <>
              <div className="mt-1 h-2 w-full bg-gray-200 rounded">
                <div
                  className={`h-full rounded ${password === confirm ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Inline mismatch message */}
              {password !== confirm && (
                <p className="text-sm text-red-600 mt-1 ml-1">Passwords do not match</p>
              )}
            </>
          )}

          {/* Error Message */}
          {error && <p className="text-red-600 mt-3">{error}</p>}

          <Button type="submit" className="w-full bg-[#C17829] text-white py-2 rounded mt-4">
            Reset Password
          </Button>
        </form>
      )}
    </div>
  );
}
