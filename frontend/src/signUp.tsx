import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  const pageVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0
    })
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        className="relative w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Wrapping container for form transitions */}
        <div className="relative w-full h-[400px] overflow-hidden">
          <AnimatePresence initial={false} custom={isSignUp ? 1 : -1}>
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              custom={isSignUp ? 1 : -1}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              className="absolute w-full h-full"
            >
              {!isSignUp ? (
                // Sign In Form
                <motion.div
                  className="w-full p-8"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sign In</h2>
                  <form>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm">Username</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm">Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      />
                    </div>
                    
                    <Button className="w-full bg-yellow-600 text-white py-2 rounded-lg mt-4 hover:bg-yellow-700">
                      Sign In
                    </Button>
                  </form>
                </motion.div>
              ) : (
                // Sign Up Form
                <motion.div
                  className="w-full p-8"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sign Up</h2>
                  <form>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm">Username</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-sm">Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      />
                    </div>
                    <Button className="w-full bg-yellow-600 text-white py-2 rounded-lg mt-4 hover:bg-yellow-700">
                      Sign Up
                    </Button>
                  </form>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Switch Panel */}
        <motion.div 
          className="w-full flex flex-col justify-center items-center bg-white p-8 border-t-2 border-yellow-600"
          initial="hidden"
          animate="visible"
          variants={contentVariants}
        >
          <motion.h2 
            className="text-2xl font-semibold text-yellow-600 mb-2"
            key={isSignUp ? "welcome-back" : "welcome"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isSignUp ? "Welcome Back!" : "Welcome to Login"}
          </motion.h2>
          <motion.p 
            className="text-sm mb-4 text-gray-600"
            key={isSignUp ? "signin-text" : "signup-text"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsSignUp(!isSignUp)}
              className="border-2 border-yellow-600 text-yellow-600 bg-white hover:bg-yellow-600 hover:text-white transition duration-300 px-4 py-2 rounded-lg"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}