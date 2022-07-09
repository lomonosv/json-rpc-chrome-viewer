import React from 'react';
import ReactDOM from 'react-dom';

interface IComponentProps {
  children: React.ReactElement,
  portalId?: string
}

const Portal = ({ children, portalId = 'portal' }: IComponentProps) => ReactDOM.createPortal(
  children,
  document.getElementById(portalId)
);

export default Portal;
