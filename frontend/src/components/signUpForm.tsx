// SignUpForm.tsx
import { Button } from "./button";

interface SignUpFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isValidEmail: (val: string) => boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasMinLength: boolean;
  isAllValid: boolean;
}

export default function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  isValidEmail,
  hasUppercase,
  hasNumber,
  hasSymbol,
  hasMinLength,
  isAllValid,
}: SignUpFormProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Sign Up
      </h2>
      <form>
        {/* Username */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-1">
            Username
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
            placeholder="example@example.com"
          />
          {/* Email validation feedback */}
          {email.length > 0 && !isValidEmail(email) && (
            <p className="text-red-600 text-sm mt-1">Invalid email format</p>
          )}
          {email.length > 0 && isValidEmail(email) && (
            <p className="text-green-600 text-sm mt-1">✓ Valid email!</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
          />
          {/* Password Rule Checks */}
          <div className="mt-2 text-sm space-y-1">
            <p className={hasUppercase ? "text-green-600" : "text-red-600"}>
              {hasUppercase ? "✓" : "✗"} Must contain an uppercase letter
            </p>
            <p className={hasNumber ? "text-green-600" : "text-red-600"}>
              {hasNumber ? "✓" : "✗"} Must contain a number
            </p>
            <p className={hasSymbol ? "text-green-600" : "text-red-600"}>
              {hasSymbol ? "✓" : "✗"} Must contain a symbol
            </p>
            <p className={hasMinLength ? "text-green-600" : "text-red-600"}>
              {hasMinLength ? "✓" : "✗"} Must be at least 8 characters
            </p>
          </div>
        </div>

        {/* Sign Up Button */}
        <Button
          disabled={!isValidEmail(email) || !isAllValid}
          className={`w-full py-2 rounded-lg mt-2 transition ${
            isValidEmail(email) && isAllValid
              ? "bg-[#C78A00] hover:bg-[#B07800] text-white"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Sign Up
        </Button>
      </form>
    </div>
  );
}
