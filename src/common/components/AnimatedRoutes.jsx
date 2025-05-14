import React from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  
  return (
    // The key is essential for AnimatePresence to detect when routes change
    // mode="wait" ensures exit animations complete before enter animations start
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {children}
        </Routes>
      </AnimatePresence>
    </>
  );
};

AnimatedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AnimatedRoutes;
