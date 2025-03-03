// src/views/pages/Auth/authForm.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/common/button";
import myImage from "../../../assets/images/pic.jpg";
import SignUpForm from "./signUpForm";
import SignInForm from "./signInForm";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Basic email validation
  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value.trim());
  }

  // Basic password checks
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

  const { hasUppercase, hasNumber, hasSymbol, hasMinLength, isAllValid } =
    checkPasswordRules(password);

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gray-100 px-4"
      // Fade in / slide in the entire screen
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/*
        Outer bounding box:
        - max-w-5xl => about 80% width for large screens
        - h-[650px] => a taller bounding box 
      */}
      <div className="w-full max-w-5xl h-[650px] flex overflow-hidden bg-white shadow-2xl rounded-xl relative">
        {/* LEFT SIDE: sign-in / sign-up */}
        <motion.div
          className="relative w-1/2 flex items-center justify-center"
          animate={{ x: isSignUp ? "100%" : "0%" }}
          transition={{ duration: 0.4 }}
        >
          {/* Container for forms */}
          <div className="relative w-full max-w-sm p-8">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                // SIGN UP
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col justify-center"
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
              ) : (
                // SIGN IN
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col justify-center"
                >
                  <SignInForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* RIGHT SIDE: background image with overlay & toggle button */}
        <motion.div
          className="w-1/2 bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
          style={{ backgroundImage: `url(${myImage})` }}
          animate={{ x: isSignUp ? "-100%" : "0%" }}
          transition={{ duration: 0.4 }}
        >
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          <div className="relative z-10 flex flex-col items-center p-6 text-white">
            <h2 className="text-3xl font-semibold mb-3">
              {isSignUp ? "Welcome Back!" : "Welcome to Login"}
            </h2>
            <p className="text-sm mb-4 text-center">
              {isSignUp
                ? "Already have an account?"
                : "Don’t have an account yet?"}
            </p>
            <Button
              onClick={() => setIsSignUp(!isSignUp)}
              className="
                border-2 border-white text-white bg-transparent
                hover:bg-white hover:text-black
                transition px-5 py-2 rounded-full
              "
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
