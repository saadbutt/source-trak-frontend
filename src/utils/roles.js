// Display names for backend role strings. The backend values themselves
// (e.g. 'Farm/Producer') must still be sent as-is; these are industry-neutral
// labels for the UI so demos work across industries.
export const ROLE_LABELS = {
  'Farm/Producer': 'Producer (Origin)',
  'Processing/Packaging': 'Processing & Packaging',
  'Logistics & Cold Chain Monitoring': 'Logistics & Transport',
  'Distribution/Retail': 'Distribution & Retail',
  'Consumer Interaction': 'Consumer',
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;
