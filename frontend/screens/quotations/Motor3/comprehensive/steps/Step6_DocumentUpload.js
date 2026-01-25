/**
 * Step6_DocumentUpload - Comprehensive Flow
 *
 * Comprehensive previously used a shared DocumentsUpload component but it was
 * mis-wired (wrong props + relied on a non-existent `documents` field in context).
 * Reuse the working Motor3 Step5 document upload implementation instead.
 */

import React from 'react';
import Step5_DocumentUpload from '../../third-party/steps/Step5_DocumentUpload';

const Step6_DocumentUpload = (props) => {
  return <Step5_DocumentUpload {...props} />;
};

export default Step6_DocumentUpload;
