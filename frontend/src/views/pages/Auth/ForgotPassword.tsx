import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../../api";
import { Button } from "../../components/common/button";
import { FaSpinner } from "react-icons/fa";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSending(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen flex items-center justify-center py-12">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
                        Forgot Password
                    </h2>
                    <p className="text-gray-600 text-base">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                {sent ? (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-600 text-center mb-8"
                    >
                        If that email exists, a reset link has been sent.
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        onSubmit={handleSubmit}
                        className="space-y-5 mb-8"
                    >
                        <div>
                            <label className="block text-gray-700 text-sm mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base
                  focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#C17829]
                  ${error ? "border-red-500" : ""}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
                            >
                                {error}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSending}
                            className="w-full bg-[#C17829] text-white py-3 rounded-full text-base hover:bg-[#ad6823] disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSending && <FaSpinner className="animate-spin mr-2" />}
                            Send Reset Link
                        </Button>
                    </motion.form>
                )}

                <div className="text-center mt-4">
                    <p className="text-gray-600 text-sm">
                        Remembered your password?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#C17829] hover:text-[#ad6823] font-medium"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}
