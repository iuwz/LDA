import { Button } from "../../components/common/button";

export default function SignInForm() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sign In</h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">Username</label>
          <input
            type="text"
            className="
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#C78A00]
            "
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">Password</label>
          <input
            type="password"
            className="
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#C78A00]
            "
          />
        </div>
        <Button
          className="
            w-full bg-[#C78A00] text-white py-2 rounded-lg mt-2
            hover:bg-[#B07800] transition
          "
        >
          Sign In
        </Button>
      </form>
    </>
  );
}
