// AuthForm.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import myImage from "./pic.jpg";
import SignUpForm from "./signUpForm";
import SignInForm from "./signInForm";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value.trim());
  }
  function checkPasswordRules(pass: string) {
    const hasUppercase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);
    const hasMinLength = pass.length >= 8;
    return {
      hasUppercase,
      hasNumber,
      hasSymbol,
      hasMinLength,
      isAllValid: hasUppercase && hasNumber && hasSymbol && hasMinLength,
    };
  }

  const {
    hasUppercase,
    hasNumber,
    hasSymbol,
    hasMinLength,
    isAllValid,
  } = checkPasswordRules(password);

  return (
    // Move your fade/slide in to the topmost <motion.div>
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gray-100 px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        className="relative w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden flex min-h-[550px]"
        // Remove initial/animate here so we only do the top-level fade in
      >
        {/* Left + Right sides, same as your code */}
        <motion.div
          className="w-1/2 p-8 flex items-center justify-center relative"
          animate={{ x: isSignUp ? "100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="relative w-full max-w-sm min-h-[300px] flex items-center">
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <SignUpForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    isValidEmail={isValidEmail}
                    hasUppercase={hasUppercase}
                    hasNumber={hasNumber}
                    hasSymbol={hasSymbol}
                    hasMinLength={hasMinLength}
                    isAllValid={isAllValid}
                  />
                </motion.div>
              )}

              {!isSignUp && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <SignInForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          className="w-1/2 flex flex-col justify-center items-center text-white p-8 bg-cover bg-center bg-no-repeat"
          animate={{ x: isSignUp ? "-100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            backgroundImage: `url(${myImage})`,
          }}
        >
          <h2 className="text-3xl font-semibold mb-2">
            {isSignUp ? "Welcome Back!" : "Welcome to Login"}
          </h2>
          <p className="text-sm mb-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </p>
          <Button
            onClick={() => setIsSignUp(!isSignUp)}
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-black transition px-4 py-2 rounded-full"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
