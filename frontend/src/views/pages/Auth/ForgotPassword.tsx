import { useState } from "react";
import { forgotPassword } from "../../../api";
import { Button } from "../../components/common/button";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24 bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
            {sent ? (
                <p className="text-green-600">
                    If that email exists, a reset link has been sent.
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2">Email address</label>
                    <input
                        type="email"
                        className="w-full border px-3 py-2 rounded mb-4"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    {error && <p className="text-red-600 mb-2">{error}</p>}
                    <Button type="submit" className="w-full bg-[#C17829] text-white py-2 rounded">
                        Send Reset Link
                    </Button>
                </form>
            )}
        </div>
    );
}