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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
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
        return <div className="max-w-md mx-auto mt-24 text-red-600">Invalid or missing token.</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-24 bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            {success ? (
                <p className="text-green-600">Password reset! Redirecting to login...</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2">New Password</label>
                    <input
                        type="password"
                        className="w-full border px-3 py-2 rounded mb-4"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <label className="block mb-2">Confirm Password</label>
                    <input
                        type="password"
                        className="w-full border px-3 py-2 rounded mb-4"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                    />
                    {error && <p className="text-red-600 mb-2">{error}</p>}
                    <Button type="submit" className="w-full bg-[#C17829] text-white py-2 rounded">
                        Reset Password
                    </Button>
                </form>
            )}
        </div>
    );
}