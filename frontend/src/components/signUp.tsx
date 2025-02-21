import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      {/* Outer container */}
      <motion.div
        className="relative w-full max-w-4xl bg-white shadow-2xl rounded-3xl overflow-hidden flex min-h-[450px]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* LEFT SIDE: Form container */}
        <motion.div
          className="w-1/2 p-8 flex items-center justify-center relative"
          animate={{ x: isSignUp ? "100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="relative w-full max-w-sm min-h-[300px] flex items-center">
            <AnimatePresence mode="wait">
              {/* SIGN UP FORM */}
              {isSignUp && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Sign Up
                  </h2>
                  <form>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
                      />
                    </div>
                    <Button className="w-full bg-[#C78A00] text-white py-2 rounded-lg mt-2 hover:bg-[#B07800] transition">
                      Sign Up
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* SIGN IN FORM */}
              {!isSignUp && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Sign In
                  </h2>
                  <form>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C78A00]"
                      />
                    </div>
                    <Button className="w-full bg-[#C78A00] text-white py-2 rounded-lg mt-2 hover:bg-[#B07800] transition">
                      Sign In
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Sliding Welcome & Toggle */}
        <motion.div
          className="w-1/2 flex flex-col justify-center items-center text-white p-8 rounded-tr-3xl rounded-br-3xl"
          initial={{ x: 0 }}
          animate={{ x: isSignUp ? "-100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            backgroundColor: "#C78A00", // Matching golden brown color
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
          }}
        >
          <h2 className="text-2xl font-semibold mb-2">
            {isSignUp ? "Welcome Back!" : "Welcome to Login"}
          </h2>
          <p className="text-sm mb-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </p>
          <Button
            onClick={() => setIsSignUp(!isSignUp)}
            className="border-2 border-white text-white bg-transparent hover:bg-white  transition duration-300 px-4 py-2 rounded-full"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
