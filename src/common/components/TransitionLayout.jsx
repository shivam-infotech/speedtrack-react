import React from 'react';
import PropTypes from 'prop-types';
import PageTransition from './PageTransition';

const TransitionLayout = ({ children }) => {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
};

TransitionLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default TransitionLayout;
