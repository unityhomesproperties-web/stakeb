import React from 'react';
import { ClaimsManagementView } from './ClaimsManagementView';

interface SupportClaimsViewProps {
  initialTracking?: string;
}

export const SupportClaimsView: React.FC<SupportClaimsViewProps> = (props) => {
  return <ClaimsManagementView {...props} />;
};
