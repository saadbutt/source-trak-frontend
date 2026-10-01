import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode.react';
import {
  FiArrowRight, FiCheck, FiCopy, FiCrosshair, FiDownload, FiExternalLink,
  FiGrid, FiInfo, FiLock, FiPrinter,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { ROLE_CONFIGS, QUANTITY_UNITS, STAGES } from './roleConfigs';
import '../../styles/EntryWizard.css';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPLORER_URL = 'https://explorer.sourcetrak.com/#/transactions';

const allFields = (config) => config.steps.flatMap((s) => s.fields);

const optionLabel = (opt) => (typeof opt === 'string' ? opt : opt.label);
const optionValue = (field, opt) => (field.lower ? optionLabel(opt).toLowerCase() : optionLabel(opt));

const formatDate = (v) => {
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatDateTime = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Human-readable value for the preview / review: option labels instead of the
// lower-cased stored value, formatted dates, quantity with its unit.
const displayValue = (field, data) => {
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

const buildInitialData = (config, initialBatchId) => {
  const data = { [config.idKey]: uuidv4(), event_id: uuidv4(), batch_id: initialBatchId || '', ...(config.defaults || {}) };
  allFields(config).forEach((f) => {
    if (data[f.key] === undefined) data[f.key] = '';
  });
  return data;
};

const readDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeDraft = (key, value) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable — drafts are a convenience only */
  }
};

/**
 * Step-by-step data entry for one supply-chain role (see roleConfigs.js).
 * Used on the dashboard (new entry) and on the batch page (initialBatchId set).
 * `onCancel`, when given, adds a Cancel / Done button that hands control back
 * to the embedding page.
 */
const Wizard = ({ role, initialBatchId, onDataSubmit, onCancel }) => {
  const config = ROLE_CONFIGS[role];
  const { user } = useAuth();
  const navigate = useNavigate();
  const draftKey = `sourcetrak_draft:${user?.id || 'anon'}:${role}:${initialBatchId || 'new'}`;

  const [data, setData] = useState(() => {
    const draft = readDraft(draftKey);
    const base = buildInitialData(config, initialBatchId);
    return draft ? { ...base, ...draft.data, batch_id: initialBatchId || draft.data.batch_id || '' } : base;
  });
  const [draftRestored, setDraftRestored] = useState(() => Boolean(readDraft(draftKey)));
  const [step, setStep] = useState(0); // 0..steps.length-1, steps.length = review
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [copied, setCopied] = useState(false);

  const steps = config.steps;
  const reviewIndex = steps.length;
  const isReview = step === reviewIndex;
  const totalSteps = steps.length + 1;
  const isDirty = useMemo(
    () => allFields(config).some((f) => f.type !== 'batch' && data[f.key] && data[f.key] !== (config.defaults || {})[f.key]),
    [config, data]
  );

  // Autosave the draft while the user works; cleared on submit / start over.
  useEffect(() => {
    if (submitted) return;
    writeDraft(draftKey, isDirty ? { data, savedAt: Date.now() } : null);
  }, [data, isDirty, draftKey, submitted]);

  const setValue = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep = (index) => {
    const next = {};
    steps[index].fields.forEach((f) => {
      const v = (data[f.key] || '').toString().trim();
      if (f.type === 'batch' && initialBatchId) return;
      if (f.required && !v) {
        next[f.key] = 'This field is required.';
      } else if (f.type === 'batch' && v && !UUID_RE.test(v)) {
        next[f.key] = "That doesn't look like a batch ID. It's a 36-character code like 7f3a2c19-….";
      } else if (f.type === 'quantity' && v && !(Number(v) > 0)) {
        next[f.key] = 'Enter a quantity greater than 0.';
      } else if (f.after && v && data[f.after] && new Date(v) < new Date(data[f.after])) {
        next[f.key] = 'Arrival must be after departure.';
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goTo = (index) => {
    setStep(index);
    setFurthest((f) => Math.max(f, index));
    setSubmitError('');
  };

  const handleContinue = () => {
    if (validateStep(step)) goTo(step + 1);
  };

  const handleStartOver = () => {
    writeDraft(draftKey, null);
    setData(buildInitialData(config, initialBatchId));
    setErrors({});
    setSubmitError('');
    setDraftRestored(false);
    setStep(0);
    setFurthest(0);
  };

  const handleSaveDraft = () => {
    writeDraft(draftKey, { data, savedAt: Date.now() });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser. Enter coordinates manually.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('location_coordinates', `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was blocked. Allow location for this site in your browser settings, or enter coordinates manually.'
            : 'Could not get your location. Try again or enter coordinates manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    for (let i = 0; i < steps.length; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      let batchId = initialBatchId || data.batch_id;
      if (config.createsBatch && !initialBatchId) {
        const batch = await apiService.createBatch(user.id);
        batchId = batch.batch_id;
      }
      const payload = { ...data, batch_id: batchId };
      if (config.createsBatch) await apiService.submitData(payload);
      else await apiService.submitTraceabilityData(role, payload);

      const record = { ...payload, id: uuidv4(), timestamp: new Date().toISOString(), status: 'pending', txHash: 'pending', user_role: role };
      writeDraft(draftKey, null);
      setSubmitted(record);
      if (onDataSubmit) onDataSubmit(record);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qrValue = submitted ? `${window.location.origin}/batch/${submitted.batch_id}` : '';
  const qrCanvasId = `ew-qr-${submitted?.event_id || 'none'}`;

  const handleDownloadQR = () => {
    const canvas = document.getElementById(qrCanvasId);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sourcetrak-${submitted.batch_id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrintQR = () => {
    const canvas = document.getElementById(qrCanvasId);
    if (!canvas) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<html><head><title>Batch QR code</title></head><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Arial,sans-serif">` +
      `<img src="${canvas.toDataURL('image/png')}" style="width:320px;height:320px" alt="Batch QR code">` +
      `<p style="font-size:12px;color:#42566B">Batch ${submitted.batch_id}</p></body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const handleCopyBatchId = async () => {
    try {
      await navigator.clipboard.writeText(submitted.batch_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Step summaries in the rail read option labels, not the lower-cased stored values.
  const labelled = { ...data };
  allFields(config).forEach((f) => {
    if (f.options && f.lower && data[f.key]) labelled[f.key] = displayValue(f, data);
  });

  const RoleIcon = config.icon;
  const stageIndex = STAGES.findIndex((s) => s.role === role);
  const title = config.createsBatch && initialBatchId ? 'Add origin data to batch' : config.title;

  // ---------- field rendering ----------
  const renderField = (f) => {
    const err = errors[f.key];
    const id = `ew-${f.key}`;
    const labelEl = (
      <label htmlFor={id} className="form-label">
        {f.label}
        {f.required ? <span className="mandatory-indicator">*</span> : <span className="optional-indicator">Optional</span>}
        {f.hint && <span className="optional-indicator">{f.hint}</span>}
      </label>
    );
    const errClass = err ? ' ew-invalid' : '';
    let control;

    switch (f.type) {
      case 'textarea':
        control = <textarea id={id} className={`form-textarea${errClass}`} value={data[f.key]} placeholder={f.placeholder} rows={3} onChange={(e) => setValue(f.key, e.target.value)} />;
        break;
      case 'date':
      case 'datetime':
      case 'number':
      case 'text':
        control = (
          <input
            id={id}
            type={f.type === 'datetime' ? 'datetime-local' : f.type}
            className={`form-input${errClass}`}
            value={data[f.key]}
            placeholder={f.placeholder}
            onChange={(e) => setValue(f.key, e.target.value)}
          />
        );
        break;
      case 'batch':
        control = (
          <input
            id={id}
            type="text"
            className={`form-input mono${errClass}`}
            value={data.batch_id}
            placeholder={f.placeholder}
            readOnly={Boolean(initialBatchId)}
            onChange={(e) => setValue('batch_id', e.target.value.trim())}
          />
        );
        break;
      case 'quantity':
        control = (
          <div className="ew-qty">
            <input id={id} type="number" min="0" step="any" className={`form-input${errClass}`} value={data[f.key]} placeholder={f.placeholder} onChange={(e) => setValue(f.key, e.target.value)} />
            <select className="form-select" aria-label="Unit" value={data[f.unitKey]} onChange={(e) => setValue(f.unitKey, e.target.value)}>
              {QUANTITY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        );
        break;
      case 'location':
        control = (
          <div className="ew-location">
            <input id={id} type="text" className={`form-input mono${errClass}`} value={data[f.key]} placeholder={f.placeholder} onChange={(e) => setValue(f.key, e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleLocate} disabled={locating}>
              {locating ? <span className="spinner" /> : <FiCrosshair />}
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
          </div>
        );
        break;
      case 'tiles':
        control = (
          <div className="ew-tiles" role="radiogroup" aria-labelledby={`${id}-l`}>
            {f.options.map((o) => {
              const value = optionValue(f, o);
              const on = data[f.key] === value;
              const Icon = o.icon;
              return (
                <button type="button" key={value} role="radio" aria-checked={on} className={`ew-tile${on ? ' on' : ''}`} onClick={() => setValue(f.key, on && !f.required ? '' : value)}>
                  <span className="ew-tile-ic">{Icon && <Icon />}</span>
                  {o.label}
                  {on && <span className="ew-tile-check"><FiCheck /></span>}
                </button>
              );
            })}
          </div>
        );
        break;
      case 'chips':
      case 'multichips': {
        const multi = f.type === 'multichips';
        const selected = multi ? (data[f.key] ? data[f.key].split(', ') : []) : [data[f.key]];
        const toggle = (value) => {
          if (!multi) return setValue(f.key, data[f.key] === value && !f.required ? '' : value);
          let next;
          if (selected.includes(value)) next = selected.filter((s) => s !== value);
          else if (value === 'None') next = ['None'];
          else next = [...selected.filter((s) => s !== 'None'), value];
          return setValue(f.key, next.join(', '));
        };
        control = (
          <div className="ew-chips" role={multi ? 'group' : 'radiogroup'}>
            {f.options.map((o) => {
              const value = optionValue(f, o);
              const on = selected.includes(value);
              return (
                <button type="button" key={value} role={multi ? 'checkbox' : 'radio'} aria-checked={on} className={`ew-chip${on ? ' on' : ''}`} onClick={() => toggle(value)}>
                  {on && <FiCheck />}
                  {optionLabel(o)}
                </button>
              );
            })}
          </div>
        );
        break;
      }
      default:
        control = null;
    }

    const help = f.type === 'batch' && initialBatchId ? 'Adding to this batch.' : f.help;
    return (
      <div key={f.key} className={`ew-field${f.half ? ' half' : ''}`}>
        {React.cloneElement(labelEl, { id: `${id}-l` })}
        {control}
        {err ? <p className="ew-error">{err}</p> : help && <p className="form-helper">{help}</p>}
        {f.type === 'location' && locationError && <p className="ew-error">{locationError}</p>}
      </div>
    );
  };

  // ---------- submitted ----------
  if (submitted) {
    return (
      <div className="ew">
        <div className="ew-success">
          <div className="ew-card ew-success-main">
            <div className="ew-success-head">
              <div className="ew-success-badge"><FiCheck /></div>
              <div>
                <h2>{config.successTitle}</h2>
                <p>
                  {config.createsBatch
                    ? `${submitted.product_type}${submitted.quantity ? ` · ${submitted.quantity} ${submitted.quantity_unit}` : ''} is now stage 1 of its journey.`
                    : `Your ${STAGES[stageIndex]?.label.toLowerCase() || 'stage'} data is now part of this batch's journey.`}
                </p>
              </div>
              <span className="chip chip-wait ew-success-status">Confirming on blockchain…</span>
            </div>

            <div className="ew-ids">
              <div>
                <span>Batch ID</span>
                <div className="ew-id-row">
                  <b className="mono">{submitted.batch_id}</b>
                  <button type="button" className="ew-icon-btn" onClick={handleCopyBatchId} aria-label="Copy batch ID">{copied ? <FiCheck /> : <FiCopy />}</button>
                </div>
              </div>
              <div><span>{config.idLabel}</span><b className="mono">{submitted[config.idKey].slice(0, 8)}…</b></div>
              <div><span>Transaction</span><b className="ew-pending">Pending</b></div>
            </div>

            <div className="ew-next">
              <h3>What happens next</h3>
              <div className="ew-journey">
                <div className="ok"><i />{STAGES[stageIndex]?.label} recorded by you</div>
                {config.nextSteps.map((s) => <div key={s}><i />{s}</div>)}
              </div>
            </div>

            <div className="ew-success-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate(`/batch/${submitted.batch_id}`)}>View batch</button>
              {onCancel ? (
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Done</button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={() => { setSubmitted(null); handleStartOver(); }}>
                  Record another
                </button>
              )}
              <a className="btn btn-outline ew-push" href={EXPLORER_URL} target="_blank" rel="noopener noreferrer"><FiExternalLink />Blockchain explorer</a>
            </div>
          </div>

          <div className="ew-card ew-qr-card">
            <h3>Batch QR code</h3>
            <p>Print it on packaging or share it with the next stage.</p>
            <div className="ew-qr"><QRCode id={qrCanvasId} value={qrValue} size={200} level="M" includeMargin renderAs="canvas" /></div>
            <div className="ew-qr-actions">
              <button type="button" className="btn btn-secondary" onClick={handleDownloadQR}><FiDownload />Download</button>
              <button type="button" className="btn btn-outline" onClick={handlePrintQR}><FiPrinter />Print</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- steps ----------
  const current = isReview
    ? { question: 'Check the details', sub: 'Everything below will be recorded for this batch.' }
    : steps[step];

  const previewRows = config.preview.map(([label, src]) => {
    const value = typeof src === 'function'
      ? src(data)
      : displayValue(allFields(config).find((f) => f.key === src) || { key: src }, data);
    return { label, value };
  });

  return (
    <div className="ew">
      <div className="ew-head">
        <div>
          <h2 className="ew-title">{title}</h2>
          <p className="ew-subtitle">{STAGES[stageIndex] ? `Stage ${stageIndex + 1} of 4 · ${STAGES[stageIndex].label}` : ''}</p>
        </div>
        <div className="ew-head-actions">
          {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
          {!onCancel && (isDirty || step > 0) && <button type="button" className="btn btn-outline" onClick={handleStartOver}>Start over</button>}
          <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={!isDirty}>
            {savedFlash ? <><FiCheck />Saved</> : 'Save draft'}
          </button>
        </div>
      </div>

      {draftRestored && (
        <div className="info-message ew-banner">
          <span>We restored your unsaved draft.</span>
          <button type="button" className="auth-link link-button" onClick={handleStartOver}>Discard it</button>
          <button type="button" className="ew-banner-x link-button" onClick={() => setDraftRestored(false)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="ew-grid">
        {/* Step rail */}
        <aside className="ew-rail">
          <ol className="ew-card ew-steps">
            {[...steps, { name: 'Review & submit' }].map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'on' : '';
              const reachable = i <= furthest;
              const summary = i === reviewIndex
                ? (i === step ? 'In progress' : 'Check before recording')
                : i < step ? (s.summary(labelled) || 'Done') : i === step ? 'In progress' : 'Not started';
              return (
                <li key={s.name}>
                  <button type="button" className={`ew-step ${state}`} onClick={() => reachable && goTo(i)} disabled={!reachable} aria-current={i === step ? 'step' : undefined}>
                    <span className="ew-step-n">{i < step ? <FiCheck /> : i + 1}</span>
                    <span className="ew-step-t"><b>{s.name}</b><small>{summary}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ew-card ew-note">
            <FiInfo />
            <p>{config.idLabel}{config.createsBatch && !initialBatchId ? ' and Batch ID are' : ' is'} generated for you. Your progress is saved as a draft until you submit.</p>
          </div>
        </aside>

        {/* Current step */}
        <section className="ew-card ew-panel">
          <div className="ew-panel-h">
            <div className="ew-eyebrow">Step {step + 1} of {totalSteps}</div>
            <h3>{current.question}</h3>
            <p>{current.sub}</p>
            <div className="ew-progress"><div style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
          </div>

          {!isReview ? (
            <div className="ew-panel-b">{current.fields.map(renderField)}</div>
          ) : (
            <div className="ew-panel-b ew-review">
              {steps.map((s, i) => (
                <div className="ew-rev" key={s.name}>
                  <div className="ew-rev-h"><b>{s.name}</b><button type="button" className="auth-link link-button" onClick={() => goTo(i)}>Edit</button></div>
                  <div className="ew-rev-b">
                    {s.fields.map((f) => (
                      <div key={f.key}>
                        <span>{f.label}</span>
                        <b className={f.type === 'batch' || f.type === 'location' ? 'mono' : ''}>{displayValue(f, data) || '—'}</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="ew-consent"><FiLock />This record is written to the blockchain and can't be edited after you submit. Check the details above first.</div>
              {submitError && <div className="error-message">{submitError}</div>}
            </div>
          )}

          <div className="ew-panel-f">
            <button type="button" className="btn btn-outline" onClick={() => goTo(step - 1)} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>Back</button>
            {!isReview ? (
              <button type="button" className="btn btn-primary ew-cta" onClick={handleContinue}>
                {step + 1 === reviewIndex ? 'Review' : `Continue to ${steps[step + 1].name.toLowerCase()}`}
                <FiArrowRight />
              </button>
            ) : (
              <button type="button" className="btn btn-primary ew-cta" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><span className="spinner" />Submitting…</> : 'Submit Data'}
              </button>
            )}
          </div>
        </section>

        {/* Live preview */}
        <aside className="ew-side">
          <div className="ew-card">
            <div className="ew-preview-h">
              <div className="ew-preview-ic"><RoleIcon /></div>
              <div><small>{config.entityLabel} preview</small><b>{config.previewTitle(data)}</b></div>
            </div>
            <div className="ew-preview-b">
              {previewRows.map((r) => (
                <div className="ew-row" key={r.label}><span>{r.label}</span><span className={r.value ? '' : 'empty'}>{r.value || '—'}</span></div>
              ))}
              {config.createsBatch && !initialBatchId && (
                <div className="ew-row"><span>Batch ID</span><span className="chip chip-primary">Auto-generated</span></div>
              )}
            </div>
          </div>

          <div className="ew-card ew-journey-card">
            <h4>Journey of this batch</h4>
            <div className="ew-journey">
              {STAGES.map((s, i) => (
                <div key={s.role} className={i === stageIndex ? 'on' : ''}>
                  <i />{s.label}{i === stageIndex && <em>You are here</em>}
                </div>
              ))}
            </div>
          </div>

          <div className="ew-qr-hint">
            <span><FiGrid /></span>
            <p>The batch QR code appears after you submit.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Roles without a step-by-step config (e.g. Consumer) render nothing here.
const EntryWizard = (props) => (ROLE_CONFIGS[props.role] ? <Wizard {...props} /> : null);

export default EntryWizard;
