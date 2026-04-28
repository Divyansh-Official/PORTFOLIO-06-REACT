import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import { Main } from './pages/Main';
import { SplashScreen } from './pages/SplashScreen';
import { useStringTunePositionTracker } from './hooks/usePositionTracker';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  // The tracker visibility is strictly bound to the isLoaded state
  useStringTunePositionTracker(isLoaded);

  return (
    <div className="bg-black min-h-screen">
      <AnimatePresence mode="wait">
        {!isLoaded ? (
          // Key is essential for AnimatePresence to track the component
          <SplashScreen key="splash" onReady={() => setIsLoaded(true)} />
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Main />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;