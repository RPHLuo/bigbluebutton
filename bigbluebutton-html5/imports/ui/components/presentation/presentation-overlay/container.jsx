import React from 'react';
import PropTypes from 'prop-types';
import { createContainer } from 'meteor/react-meteor-data';
import PresentationOverlayService from './service';
import PresentationOverlay from './component';

const PresentationOverlayContainer = ({ children, ...rest }) => (
  <PresentationOverlay {...rest}>
    {children}
  </PresentationOverlay>
);

export default createContainer(() => ({
  updateCursor: PresentationOverlayService.updateCursor,
}), PresentationOverlayContainer);

PresentationOverlayContainer.propTypes = {
  children: PropTypes.node,
};

PresentationOverlayContainer.defaultProps = {
  children: undefined,
};
