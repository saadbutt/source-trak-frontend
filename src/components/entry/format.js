// Display helpers shared by the entry wizard and the batch page.

export const optionLabel = (opt) => (typeof opt === 'string' ? opt : opt.label);
export const optionValue = (field, opt) => (field.lower ? optionLabel(opt).toLowerCase() : optionLabel(opt));

export const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Human-readable value for a configured field: option labels instead of the
// lower-cased stored value, formatted dates, quantity with its unit.
export const displayValue = (field, data) => {
  const v = data[field.key];
  if (!v) return '';
  if (field.type === 'date') return formatDate(v);
  if (field.type === 'datetime') return formatDateTime(v);
  if (field.type === 'quantity') return `${v} ${data[field.unitKey] || ''}`.trim();
  if (field.options && field.lower) {
    const match = field.options.find((o) => optionValue(field, o) === v);
    return match ? optionLabel(match) : v;
  }
  return v;
};
