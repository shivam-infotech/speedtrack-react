import React from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  
  // Using standard Routes without animation wrapper for better performance
  return (
    <Routes location={location}>
      {children}
    </Routes>
  );
};

AnimatedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AnimatedRoutes;
