import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import QRCode from 'qrcode.react';
import {
  FiAlertCircle, FiCheck, FiChevronLeft, FiClock, FiCopy, FiDownload, FiExternalLink,
  FiLink, FiMapPin, FiMaximize, FiPlus, FiUser,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Header from './Header';
import Footer from './Footer';
import QRCodeModal from './QRCodeModal';
import EntryWizard from './entry/EntryWizard';
import ConsumerEntryForm from './ConsumerEntryForm';
import { ROLE_CONFIGS, STAGES } from './entry/roleConfigs';
import { displayValue, formatDate, formatDateTime } from './entry/format';
import '../styles/DataDetailView.css';

const EXPLORER_URL = 'https://explorer.sourcetrak.com/#/transactions';
const isRealHash = (h) => h && h !== 'pending' && h !== 'pending-blockchain-connection';

// Every configured field of a role except the batch link, for showing a stage's details.
const roleFields = (role) => (ROLE_CONFIGS[role]?.steps || []).flatMap((s) => s.fields).filter((f) => f.type !== 'batch');

// History entries come from the API ({ data, created_at, tx_status, ... }) or,
// right after a submit, from the entry wizard (fields at the top level).
const entryData = (entry) => entry.data || entry;
const entryTime = (entry) => entry.created_at || entry.timestamp;
const entryVerified = (entry) => entry.tx_status === true;

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
};

const DataDetailView = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [blockchainError, setBlockchainError] = useState('');
  const [showAddDataForm, setShowAddDataForm] = useState(false);
  const [addedData, setAddedData] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [batchHistory, setBatchHistory] = useState([]);
  const [copied, setCopied] = useState('');

  const loadBatchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.getBatchData(batchId);

      if (response && response.batch && response.data && response.data.length > 0) {
        const firstDataEntry = response.data[0];
        const batchInfo = response.batch;
        const parsedData = typeof firstDataEntry.data === 'string'
          ? JSON.parse(firstDataEntry.data)
          : firstDataEntry.data;

        setData({
          id: batchInfo.batch_id,
          farm_id: parsedData.farm_id,
          farm_name: parsedData.farm_name,
          location_coordinates: parsedData.location_coordinates,
          harvest_date: parsedData.harvest_date,
          product_type: parsedData.product_type,
          batch_id: batchInfo.batch_id,
          farming_method: parsedData.farming_method,
          quantity: parsedData.quantity,
          quantity_unit: parsedData.quantity_unit,
          certifications: parsedData.certifications,
          timestamp: firstDataEntry.created_at,
          status: firstDataEntry.tx_status ? 'verified' : 'pending',
          txHash: firstDataEntry.txhash,
        });

        const transformedHistory = await Promise.all(response.data.map(async (entry) => {
          const parsed = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
          let userRole = entry.user_role;
          let userName = entry.user_name;
          if (!userRole) {
            try {
              const userResponse = await apiService.getUser(entry.user_id);
              if (userResponse && userResponse.role) {
                userRole = userResponse.role;
                userName = userResponse.name;
              } else {
                userRole = 'Unknown Role';
              }
            } catch {
              userRole = 'Unknown Role';
            }
          }
          return { ...entry, data: parsed, user_role: userRole, user_name: userName };
        }));
        setBatchHistory(transformedHistory);
      } else if (response && response.batch) {
        setError('Batch exists but no data entries found. This batch may be empty.');
      } else {
        setError('Batch not found');
      }
    } catch (err) {
      console.error('Error loading batch data:', err);
      setError(`Failed to load batch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Data passed via navigation state (legacy support)
    if (location.state?.data) {
      setData(location.state.data);
      setLoading(false);
      return;
    }

    if (batchId) {
      loadBatchData();
    } else {
      setError('No batch ID provided');
      setLoading(false);
    }
  }, [batchId, isAuthenticated, navigate, location.state, loadBatchData]);

  const flashCopied = (what) => {
    setCopied(what);
    setTimeout(() => setCopied(''), 1800);
  };

  const shareUrl = data ? `${window.location.origin}/batch/${data.batch_id}` : '';

  const handleShareLink = async () => {
    await copyText(shareUrl);
    setSuccessMessage('Shareable link copied to clipboard.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleViewBlockchain = () => {
    if (isRealHash(data.txHash)) {
      window.open(`${EXPLORER_URL}/${data.txHash}`, '_blank', 'noopener');
      setBlockchainError('');
    } else {
      setBlockchainError('Blockchain transaction is still pending or not available.');
    }
  };

  const handleDownloadQRCode = () => {
    const canvas = document.getElementById('batch-qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sourcetrak-qr-${data.batch_id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDataSubmit = (newData) => {
    // Shown immediately; the full history is reloaded when the wizard closes.
    setBatchHistory((prev) => [...prev, newData]);
    setAddedData(true);
  };

  const handleCloseAddData = () => {
    setShowAddDataForm(false);
    if (addedData) {
      setAddedData(false);
      loadBatchData();
    }
  };

  // Only non-producer roles add to an existing batch, and each user only once.
  const canAddData = () => {
    if (!user || !user.role || user.role === 'Farm/Producer') return false;
    if (!batchHistory || batchHistory.length === 0) return false;
    return !batchHistory.some((entry) => String(entry.user_id) === String(user.id));
  };

  const alreadyContributed = user && user.role !== 'Farm/Producer'
    && batchHistory.some((entry) => String(entry.user_id) === String(user.id));

  if (loading) {
    return (
      <div className="data-detail-page">
        <Header />
        <main className="data-detail-main">
          <div className="data-detail-container">
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Loading batch…</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="data-detail-page">
        <Header />
        <main className="data-detail-main">
          <div className="data-detail-container">
            <div className="bd-card bd-empty">
              <div className="bd-empty-ic"><FiAlertCircle /></div>
              <h2>Batch not available</h2>
              <p>{error || 'The requested batch could not be found.'}</p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Back to dashboard</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Journey: one slot per supply-chain stage, filled by the matching history entry.
  const stageEntries = STAGES.map((stage) => ({
    ...stage,
    entry: batchHistory.find((e) => e.user_role === stage.role),
  }));
  const extraEntries = batchHistory.filter((e) => !STAGES.some((s) => s.role === e.user_role));
  const completed = stageEntries.filter((s) => s.entry).length;
  const latest = [...stageEntries].reverse().find((s) => s.entry);
  const verified = data.status === 'verified';
  const certifications = data.certifications ? data.certifications.split(', ').filter((c) => c && c !== 'None') : [];
  const producerFields = roleFields('Farm/Producer');
  const methodLabel = displayValue(producerFields.find((f) => f.key === 'farming_method') || { key: 'farming_method' }, data);

  const renderEntryDetails = (role, entry) => {
    const d = entryData(entry);
    const fields = roleFields(role).filter((f) => d[f.key] && f.key !== 'product_type');
    if (fields.length === 0) return null;
    return (
      <dl className="bd-details">
        {fields.map((f) => (
          <div key={f.key} className={f.type === 'textarea' ? 'wide' : ''}>
            <dt>{f.label}</dt>
            <dd className={f.type === 'location' ? 'mono' : ''}>{displayValue(f, d)}</dd>
          </div>
        ))}
      </dl>
    );
  };

  return (
    <div className="data-detail-page">
      <Header />
      <main className="data-detail-main">
        <div className="data-detail-container">

          {/* Page header */}
          <button type="button" className="bd-back" onClick={() => navigate('/dashboard')}>
            <FiChevronLeft />Dashboard
          </button>
          <div className="bd-head">
            <div className="bd-head-t">
              <div className="bd-title-row">
                <h1>{data.product_type || 'Batch'}</h1>
                {verified
                  ? <span className="chip chip-ok"><FiCheck />Verified on chain</span>
                  : <span className="chip chip-wait"><FiClock />Pending</span>}
              </div>
              <div className="bd-id">
                <span>Batch</span>
                <code>{data.batch_id}</code>
                <button type="button" className="bd-icon-btn" aria-label="Copy batch ID" onClick={async () => { await copyText(data.batch_id); flashCopied('batch'); }}>
                  {copied === 'batch' ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
            <div className="bd-head-actions">
              <button type="button" className="btn btn-outline" onClick={handleShareLink}><FiLink />Copy link</button>
              {canAddData() && !showAddDataForm && (
                <button type="button" className="btn btn-primary" onClick={() => setShowAddDataForm(true)}><FiPlus />Add data to batch</button>
              )}
            </div>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}

          {showAddDataForm ? (
            <div className="bd-add">
              {user.role === 'Consumer Interaction' ? (
                <div className="bd-card bd-pad">
                  <ConsumerEntryForm onDataSubmit={handleDataSubmit} initialBatchId={data.batch_id} userRole={user.role} />
                  <button onClick={handleCloseAddData} className="btn btn-outline">Cancel</button>
                </div>
              ) : (
                <EntryWizard role={user.role} initialBatchId={data.batch_id} onDataSubmit={handleDataSubmit} onCancel={handleCloseAddData} />
              )}
            </div>
          ) : (
            <div className="bd-grid">
              <div className="bd-main">

                {/* Summary */}
                <section className="bd-card bd-summary">
                  <div className="bd-summary-h">
                    <div>
                      <small>Origin</small>
                      <b>{data.farm_name || 'Producer'}</b>
                    </div>
                    <div className="bd-progress">
                      <span>{completed} of {STAGES.length} stages</span>
                      <div className="bd-dots">{STAGES.map((s, i) => <i key={s.role} className={i < completed ? 'on' : ''} />)}</div>
                    </div>
                  </div>
                  <div className="bd-stats">
                    <div><span>Quantity</span><b>{data.quantity ? `${data.quantity} ${data.quantity_unit || ''}` : '—'}</b></div>
                    <div><span>Produced</span><b>{formatDate(data.harvest_date) || '—'}</b></div>
                    <div><span>Method</span><b>{methodLabel || '—'}</b></div>
                    <div><span>Current stage</span><b>{latest ? latest.label : '—'}</b></div>
                  </div>
                  {certifications.length > 0 && (
                    <div className="bd-certs">
                      {certifications.map((c) => <span key={c} className="chip chip-primary"><FiCheck />{c}</span>)}
                    </div>
                  )}
                </section>

                {/* Journey */}
                <section className="bd-card bd-journey">
                  <div className="bd-section-h">
                    <h2>Journey</h2>
                    <span>Every stage is recorded on the blockchain by the party who handled it.</span>
                  </div>

                  <ol className="bd-timeline">
                    {stageEntries.map((stage, i) => {
                      const RoleIcon = ROLE_CONFIGS[stage.role]?.icon;
                      const entry = stage.entry;
                      const isMine = entry && user && String(entry.user_id) === String(user.id);
                      return (
                        <li key={stage.role} className={`bd-stage ${entry ? 'done' : 'todo'}`}>
                          <div className="bd-stage-rail">
                            <span className="bd-stage-ic">{RoleIcon && <RoleIcon />}</span>
                          </div>
                          <div className="bd-stage-body">
                            <div className="bd-stage-h">
                              <div>
                                <small>Stage {i + 1}</small>
                                <h3>{stage.label}</h3>
                              </div>
                              {entry ? (
                                entryVerified(entry)
                                  ? <span className="chip chip-ok"><FiCheck />Verified</span>
                                  : <span className="chip chip-wait"><FiClock />Pending</span>
                              ) : (
                                <span className="chip bd-chip-muted">Waiting</span>
                              )}
                            </div>

                            {entry ? (
                              <>
                                <div className="bd-stage-meta">
                                  <span><FiUser />{entry.user_name || 'Unknown'}{isMine && ' (you)'}</span>
                                  {entryTime(entry) && <span><FiClock />{formatDateTime(entryTime(entry))}</span>}
                                </div>
                                {renderEntryDetails(stage.role, entry)}
                              </>
                            ) : (
                              <p className="bd-stage-wait">
                                {canAddData() && user.role === stage.role
                                  ? 'This is your stage. Add your data when the batch reaches you.'
                                  : `Waiting for the ${stage.label.toLowerCase()} partner to add their data.`}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {extraEntries.length > 0 && (
                    <div className="bd-extra">
                      <h3>Other activity</h3>
                      {extraEntries.map((e, i) => (
                        <div key={e.event_id || i} className="bd-extra-row">
                          <b>{e.user_role}</b>
                          <span>{e.user_name || 'Unknown'} · {formatDateTime(entryTime(e))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {alreadyContributed && (
                    <div className="bd-note-ok"><FiCheck />You have already added your data to this batch.</div>
                  )}
                </section>
              </div>

              {/* Side column */}
              <aside className="bd-side">
                <section className="bd-card bd-qr">
                  <h2>Batch QR code</h2>
                  <p>Buyers and partners scan this to open the batch.</p>
                  <div className="bd-qr-box">
                    <QRCode id="batch-qr-canvas" value={shareUrl} size={176} level="M" includeMargin renderAs="canvas" />
                  </div>
                  <div className="bd-qr-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleDownloadQRCode}><FiDownload />Download</button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowQRModal(true)}><FiMaximize />Enlarge</button>
                  </div>
                </section>

                <section className="bd-card bd-chain">
                  <h2>Blockchain record</h2>
                  <div className="bd-kv">
                    <span>Status</span>
                    {verified ? <span className="chip chip-ok"><FiCheck />Verified</span> : <span className="chip chip-wait"><FiClock />Pending</span>}
                  </div>
                  <div className="bd-kv col">
                    <span>Transaction hash</span>
                    {isRealHash(data.txHash) ? (
                      <div className="bd-hash">
                        <code>{data.txHash}</code>
                        <button type="button" className="bd-icon-btn" aria-label="Copy transaction hash" onClick={async () => { await copyText(data.txHash); flashCopied('hash'); }}>
                          {copied === 'hash' ? <FiCheck /> : <FiCopy />}
                        </button>
                      </div>
                    ) : (
                      <b className="bd-muted">Waiting for confirmation</b>
                    )}
                  </div>
                  <button type="button" className="btn btn-outline bd-full" onClick={handleViewBlockchain}><FiExternalLink />View in explorer</button>
                  {blockchainError && <p className="bd-error">{blockchainError}</p>}
                </section>

                <section className="bd-card bd-info">
                  <h2>Batch info</h2>
                  <div className="bd-kv"><span>Created</span><b>{formatDateTime(data.timestamp) || '—'}</b></div>
                  <div className="bd-kv"><span>Origin ID</span><b className="mono">{data.farm_id ? `${data.farm_id.slice(0, 8)}…` : '—'}</b></div>
                  <div className="bd-kv">
                    <span>Location</span>
                    {data.location_coordinates ? (
                      <a className="bd-map-link" href={`https://www.google.com/maps?q=${encodeURIComponent(data.location_coordinates)}`} target="_blank" rel="noopener noreferrer">
                        <FiMapPin />{data.location_coordinates}
                      </a>
                    ) : <b className="bd-muted">Not shared</b>}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} data={data} />
    </div>
  );
};

export default DataDetailView;
