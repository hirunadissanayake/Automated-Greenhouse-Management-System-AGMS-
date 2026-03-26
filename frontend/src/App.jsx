import { useEffect, useMemo, useState } from 'react';
import {
  createCrop,
  createZone,
  deleteZone,
  fetchAutomationLogs,
  fetchCrops,
  fetchLatestSensor,
  fetchZones,
  processAutomation,
  updateCropStatus,
  updateZone,
} from './api';
import { buildDevJwt, getJwtExpirationText } from './utils/jwt';
import './App.css';

const TAB_META = {
  zones: {
    label: 'Zones',
    title: 'Climate zone control',
    description: 'Register greenhouse zones, review thresholds, and maintain linked device assignments.',
  },
  crops: {
    label: 'Crops',
    title: 'Crop inventory lifecycle',
    description: 'Track active crop batches and push them through seedling, vegetative, and harvested states.',
  },
  automation: {
    label: 'Automation',
    title: 'Telemetry and automation flow',
    description: 'Inspect live telemetry, review action history, and trigger manual automation events.',
  },
};

const PAGE_SIZE = 5;

function formatRelativeTime(value) {
  if (!value) {
    return 'Waiting for telemetry';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs)) {
    return 'Timestamp unavailable';
  }

  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 1) {
    return 'Updated just now';
  }
  if (Math.abs(diffMinutes) < 60) {
    return `Updated ${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `Updated ${diffHours} hr ago`;
}

function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    totalPages,
    page: safePage,
    start,
    end: Math.min(start + pageSize, items.length),
    items: items.slice(start, start + pageSize),
  };
}

function Pagination({ label, pageData, onPrev, onNext }) {
  if (pageData.totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <span className="pagination-copy">
        {label} {pageData.start + 1}-{pageData.end}
      </span>
      <div className="pagination-actions">
        <button type="button" className="btn btn-ghost pagination-btn" onClick={onPrev} disabled={pageData.page === 1}>
          Previous
        </button>
        <span className="pagination-page">
          Page {pageData.page} / {pageData.totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost pagination-btn"
          onClick={onNext}
          disabled={pageData.page === pageData.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function App() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [token, setToken] = useState(() => buildDevJwt(240, 'agms-ui-user'));
  const [activeTab, setActiveTab] = useState('zones');
  const [zones, setZones] = useState([]);
  const [crops, setCrops] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latestSensor, setLatestSensor] = useState(null);
  const [zoneName, setZoneName] = useState('Tomato Zone');
  const [minTemp, setMinTemp] = useState(20);
  const [maxTemp, setMaxTemp] = useState(30);
  const [editZoneId, setEditZoneId] = useState('');
  const [editZoneName, setEditZoneName] = useState('');
  const [editMinTemp, setEditMinTemp] = useState(0);
  const [editMaxTemp, setEditMaxTemp] = useState(0);
  const [cropName, setCropName] = useState('Lettuce');
  const [cropQty, setCropQty] = useState(100);
  const [manualZoneId, setManualZoneId] = useState('');
  const [manualDeviceId, setManualDeviceId] = useState('');
  const [manualTemp, setManualTemp] = useState(35);
  const [manualHumidity, setManualHumidity] = useState(60);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [statusKind, setStatusKind] = useState('info');
  const [busyAction, setBusyAction] = useState('');
  const [zonePage, setZonePage] = useState(1);
  const [cropPage, setCropPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const canCallApi = useMemo(() => token.trim().length > 10, [token]);
  const tokenHint = useMemo(() => getJwtExpirationText(token), [token]);
  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === manualZoneId),
    [zones, manualZoneId],
  );
  const vegetativeCrops = useMemo(
    () => crops.filter((crop) => crop.status === 'VEGETATIVE').length,
    [crops],
  );
  const harvestedCrops = useMemo(
    () => crops.filter((crop) => crop.status === 'HARVESTED').length,
    [crops],
  );
  const zonePageData = useMemo(() => paginate(zones, zonePage), [zones, zonePage]);
  const cropPageData = useMemo(() => paginate(crops, cropPage), [crops, cropPage]);
  const logPageData = useMemo(() => paginate(logs, logPage), [logs, logPage]);

  const zoneFormValid = zoneName.trim() && Number(minTemp) < Number(maxTemp);
  const cropFormValid = cropName.trim() && Number(cropQty) > 0;
  const manualFormValid =
    manualZoneId.trim() &&
    manualDeviceId.trim() &&
    Number.isFinite(Number(manualTemp)) &&
    Number.isFinite(Number(manualHumidity));

  useEffect(() => {
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    setStatusKind('info');
    setStatusMessage(`${tabLabel} workspace ready.`);
  }, [activeTab]);

  useEffect(() => {
    if (statusKind === 'error') {
      return;
    }
    const timer = setTimeout(() => {
      setStatusKind('info');
      setStatusMessage('Ready');
    }, 2500);
    return () => clearTimeout(timer);
  }, [statusMessage, statusKind]);

  useEffect(() => {
    setZonePage((current) => Math.min(current, Math.max(1, Math.ceil(zones.length / PAGE_SIZE))));
  }, [zones.length]);

  useEffect(() => {
    setCropPage((current) => Math.min(current, Math.max(1, Math.ceil(crops.length / PAGE_SIZE))));
  }, [crops.length]);

  useEffect(() => {
    setLogPage((current) => Math.min(current, Math.max(1, Math.ceil(logs.length / PAGE_SIZE))));
  }, [logs.length]);

  function setInfo(message) {
    setStatusKind('info');
    setStatusMessage(message);
  }

  function setOk(message) {
    setStatusKind('ok');
    setStatusMessage(message);
  }

  function setError(message) {
    setStatusKind('error');
    setStatusMessage(message);
  }

  async function withBusy(action, runner) {
    setBusyAction(action);
    try {
      await runner();
    } finally {
      setBusyAction('');
    }
  }

  function applyDevToken() {
    const next = buildDevJwt(240, 'agms-ui-user');
    setToken(next);
    setOk('Generated development JWT token.');
  }

  async function loadZones() {
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    await withBusy('loadZones', async () => {
      try {
        const data = await fetchZones(baseUrl, token);
        setZones(data);
        setZonePage(1);
        if (data.length > 0 && !manualZoneId) {
          setManualZoneId(data[0].id);
          setManualDeviceId(data[0].deviceId || '');
        }
        setOk(`Zones loaded (${data.length}).`);
      } catch (err) {
        setError(err.message);
      }
    });
  }

  async function submitZone(event) {
    event.preventDefault();
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    if (!zoneFormValid) {
      setError('Zone form is invalid. Ensure name is set and Min Temp < Max Temp.');
      return;
    }
    await withBusy('createZone', async () => {
      try {
        const created = await createZone(baseUrl, token, {
          name: zoneName,
          minTemp: Number(minTemp),
          maxTemp: Number(maxTemp),
        });
        setOk(`Zone created: ${created.id}`);
        await loadZones();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function beginEdit(zone) {
    setEditZoneId(zone.id);
    setEditZoneName(zone.name);
    setEditMinTemp(zone.minTemp);
    setEditMaxTemp(zone.maxTemp);
  }

  function cancelEdit() {
    setEditZoneId('');
    setEditZoneName('');
    setEditMinTemp(0);
    setEditMaxTemp(0);
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editZoneId) {
      return;
    }

    try {
      await updateZone(baseUrl, token, editZoneId, {
        name: editZoneName,
        minTemp: Number(editMinTemp),
        maxTemp: Number(editMaxTemp),
      });
      setOk(`Zone ${editZoneId} updated.`);
      cancelEdit();
      await loadZones();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeZone(zoneId) {
    if (!window.confirm(`Delete zone ${zoneId}?`)) {
      return;
    }
    try {
      await deleteZone(baseUrl, token, zoneId);
      setOk(`Zone ${zoneId} deleted.`);
      if (editZoneId === zoneId) {
        cancelEdit();
      }
      await loadZones();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCrops() {
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    await withBusy('loadCrops', async () => {
      try {
        const data = await fetchCrops(baseUrl, token);
        setCrops(data);
        setCropPage(1);
        setOk(`Crops loaded (${data.length}).`);
      } catch (err) {
        setError(err.message);
      }
    });
  }

  async function submitCrop(event) {
    event.preventDefault();
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    if (!cropFormValid) {
      setError('Crop form is invalid. Enter crop name and quantity > 0.');
      return;
    }
    await withBusy('createCrop', async () => {
      try {
        const created = await createCrop(baseUrl, token, {
          cropName,
          quantity: Number(cropQty),
        });
        setOk(`Crop batch created: ${created.id}`);
        await loadCrops();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  async function markVegetative(cropId) {
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    try {
      await updateCropStatus(baseUrl, token, cropId, 'VEGETATIVE');
      setOk(`Crop ${cropId} moved to VEGETATIVE`);
      await loadCrops();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markHarvested(cropId) {
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    try {
      await updateCropStatus(baseUrl, token, cropId, 'HARVESTED');
      setOk(`Crop ${cropId} moved to HARVESTED`);
      await loadCrops();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadLogsAndSensor() {
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    await withBusy('loadAutomation', async () => {
      try {
        const [logData, sensorData] = await Promise.all([
          fetchAutomationLogs(baseUrl, token),
          fetchLatestSensor(baseUrl, token),
        ]);
        setLogs(logData);
        setLatestSensor(sensorData);
        setLogPage(1);
        setOk('Automation and sensor data loaded.');
      } catch (err) {
        setError(err.message);
      }
    });
  }

  async function submitManualAutomation(event) {
    event.preventDefault();
    if (!canCallApi) {
      setError('Enter a valid JWT first.');
      return;
    }
    if (!manualFormValid) {
      setError('Manual trigger needs zone, device, temperature and humidity.');
      return;
    }
    await withBusy('manualAutomation', async () => {
      try {
        await processAutomation(baseUrl, token, {
          zoneId: manualZoneId,
          deviceId: manualDeviceId,
          temperature: Number(manualTemp),
          humidity: Number(manualHumidity),
          capturedAt: new Date().toISOString(),
        });
        setOk('Manual automation event submitted.');
        await loadLogsAndSensor();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function onManualZoneChange(nextZoneId) {
    setManualZoneId(nextZoneId);
    const zone = zones.find((item) => item.id === nextZoneId);
    if (zone?.deviceId) {
      setManualDeviceId(zone.deviceId);
      setInfo('Device ID auto-filled from selected zone.');
    }
  }

  const activeTabMeta = TAB_META[activeTab];

  return (
    <main className="agms-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Automated Greenhouse Management System</p>
          <h1>AGMS Operations Console</h1>
          <p className="subcopy">
            One control surface for climate zones, crop lifecycle tracking, sensor telemetry, and automation flow.
          </p>
          <div className="hero-pills">
            <span className={`status-pill ${canCallApi ? 'is-live' : 'is-muted'}`}>
              {canCallApi ? 'Gateway authenticated' : 'JWT required'}
            </span>
            <span className="status-pill is-muted">{activeTabMeta.title}</span>
          </div>
        </div>

        <aside className="connection-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Connection</p>
              <h2>Gateway access</h2>
            </div>
            <span className={`badge ${canCallApi ? 'badge-ok' : 'badge-neutral'}`}>
              {canCallApi ? 'Ready' : 'Blocked'}
            </span>
          </div>

          <label>
            Gateway URL
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </label>
          <label>
            JWT Token
            <textarea
              rows={3}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste Bearer token payload here"
            />
          </label>
          <div className="inline-actions">
            <button type="button" onClick={applyDevToken} className="btn btn-accent">Generate Dev Token</button>
          </div>
          <small className="token-hint">{tokenHint}</small>
        </aside>
      </section>

      <section className="overview-grid">
        <article className="overview-card">
          <p className="overview-label">Registered zones</p>
          <strong>{zones.length}</strong>
          <span>{zones.filter((zone) => zone.deviceId).length} zones linked to devices</span>
        </article>
        <article className="overview-card">
          <p className="overview-label">Crop batches</p>
          <strong>{crops.length}</strong>
          <span>{vegetativeCrops} vegetative, {harvestedCrops} harvested</span>
        </article>
        <article className="overview-card">
          <p className="overview-label">Automation logs</p>
          <strong>{logs.length}</strong>
          <span>{logs[0]?.action || 'No actions loaded yet'}</span>
        </article>
        <article className="overview-card">
          <p className="overview-label">Latest telemetry</p>
          <strong>{latestSensor ? `${latestSensor.temperature} C` : '--'}</strong>
          <span>{formatRelativeTime(latestSensor?.capturedAt)}</span>
        </article>
      </section>

      <section className="workspace-header">
        <div>
          <p className="section-kicker">Workspace</p>
          <h2>{activeTabMeta.title}</h2>
          <p className="section-copy">{activeTabMeta.description}</p>
        </div>
        <div className="tabs">
          {Object.entries(TAB_META).map(([key, meta]) => (
            <button
              key={key}
              className={activeTab === key ? 'active' : ''}
              onClick={() => setActiveTab(key)}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        {activeTab === 'zones' && (
          <div className="grid-two">
            <form onSubmit={submitZone} className="card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Create</p>
                  <h2>New greenhouse zone</h2>
                </div>
                <span className="badge badge-neutral">Threshold policy</span>
              </div>
              <label>
                Zone Name
                <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
              </label>
              <label>
                Min Temp
                <input type="number" value={minTemp} onChange={(e) => setMinTemp(e.target.value)} />
              </label>
              <label>
                Max Temp
                <input type="number" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} />
              </label>
              <small className="hint">Keep `minTemp` lower than `maxTemp` so automation rules remain valid.</small>
              <button type="submit" className="btn" disabled={!canCallApi || !zoneFormValid || busyAction === 'createZone'}>
                {busyAction === 'createZone' ? 'Creating...' : 'Create Zone'}
              </button>
            </form>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Monitor</p>
                  <h2>Zone registry</h2>
                  <p className="list-meta">{zones.length} total zones</p>
                </div>
                <button className="btn" onClick={loadZones} disabled={!canCallApi || busyAction === 'loadZones'}>
                  {busyAction === 'loadZones' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {editZoneId && (
                <form className="edit-card" onSubmit={saveEdit}>
                  <h3>Editing zone {editZoneId.slice(0, 8)}...</h3>
                  <label>
                    Zone Name
                    <input value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} />
                  </label>
                  <label>
                    Min Temp
                    <input type="number" value={editMinTemp} onChange={(e) => setEditMinTemp(e.target.value)} />
                  </label>
                  <label>
                    Max Temp
                    <input type="number" value={editMaxTemp} onChange={(e) => setEditMaxTemp(e.target.value)} />
                  </label>
                  <div className="inline-actions">
                    <button type="submit" className="btn">Save Update</button>
                    <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                  </div>
                </form>
              )}
              <Pagination
                label="Showing zones"
                pageData={zonePageData}
                onPrev={() => setZonePage((page) => Math.max(page - 1, 1))}
                onNext={() => setZonePage((page) => Math.min(page + 1, zonePageData.totalPages))}
              />
              <ul className="list">
                {zonePageData.items.map((zone) => (
                  <li key={zone.id}>
                    <div className="list-row">
                      <div>
                        <strong>{zone.name}</strong>
                        <span>{zone.minTemp} - {zone.maxTemp} C</span>
                      </div>
                      <span className={`badge ${zone.deviceId ? 'badge-ok' : 'badge-neutral'}`}>
                        {zone.deviceId ? 'Device linked' : 'Pending'}
                      </span>
                    </div>
                    <small>device: {zone.deviceId || 'pending'}</small>
                    <div className="inline-actions">
                      <button className="btn" onClick={() => beginEdit(zone)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => removeZone(zone.id)}>Delete</button>
                    </div>
                  </li>
                ))}
                {zones.length === 0 && <li className="empty-state">No zones loaded yet. Refresh after creating your first zone.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'crops' && (
          <div className="grid-two">
            <form onSubmit={submitCrop} className="card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Create</p>
                  <h2>Register crop batch</h2>
                </div>
                <span className="badge badge-neutral">Inventory intake</span>
              </div>
              <label>
                Crop Name
                <input value={cropName} onChange={(e) => setCropName(e.target.value)} />
              </label>
              <label>
                Quantity
                <input type="number" value={cropQty} onChange={(e) => setCropQty(e.target.value)} />
              </label>
              <button
                type="submit"
                className="btn btn-stable"
                disabled={!canCallApi || !cropFormValid || busyAction === 'createCrop'}
              >
                {busyAction === 'createCrop' ? 'Creating...' : 'Create Batch'}
              </button>
            </form>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Monitor</p>
                  <h2>Crop inventory</h2>
                  <p className="list-meta">{crops.length} total crop batches</p>
                </div>
                <button className="btn" onClick={loadCrops} disabled={!canCallApi || busyAction === 'loadCrops'}>
                  {busyAction === 'loadCrops' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Pagination
                label="Showing batches"
                pageData={cropPageData}
                onPrev={() => setCropPage((page) => Math.max(page - 1, 1))}
                onNext={() => setCropPage((page) => Math.min(page + 1, cropPageData.totalPages))}
              />
              <ul className="list">
                {cropPageData.items.map((crop) => (
                  <li key={crop.id}>
                    <div className="list-row">
                      <div>
                        <strong>{crop.cropName}</strong>
                        <span>qty: {crop.quantity}</span>
                      </div>
                      <span className={`badge ${
                        crop.status === 'HARVESTED' ? 'badge-ok' : crop.status === 'VEGETATIVE' ? 'badge-warn' : 'badge-neutral'
                      }`}
                      >
                        {crop.status}
                      </span>
                    </div>
                    <div className="inline-actions">
                      {crop.status === 'SEEDLING' && (
                        <button className="btn" onClick={() => markVegetative(crop.id)}>Move to VEGETATIVE</button>
                      )}
                      {crop.status === 'VEGETATIVE' && (
                        <button className="btn" onClick={() => markHarvested(crop.id)}>Move to HARVESTED</button>
                      )}
                    </div>
                  </li>
                ))}
                {crops.length === 0 && <li className="empty-state">No crop batches loaded yet. Create a batch to begin lifecycle tracking.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="grid-two">
            <div className="card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Observe</p>
                  <h2>Latest sensor reading</h2>
                </div>
                <button className="btn" onClick={loadLogsAndSensor} disabled={!canCallApi || busyAction === 'loadAutomation'}>
                  {busyAction === 'loadAutomation' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {latestSensor ? (
                <div className="metric-grid">
                  <div className="metric-card">
                    <span>Zone</span>
                    <strong>{latestSensor.zoneId}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Device</span>
                    <strong>{latestSensor.deviceId}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Temperature</span>
                    <strong>{latestSensor.temperature} C</strong>
                  </div>
                  <div className="metric-card">
                    <span>Humidity</span>
                    <strong>{latestSensor.humidity}%</strong>
                  </div>
                </div>
              ) : (
                <p className="empty-copy">No sensor data loaded yet.</p>
              )}
            </div>

            <div className="card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Operate</p>
                  <h2>Automation queue</h2>
                  <p className="list-meta">{logs.length} total actions</p>
                </div>
                <span className="badge badge-neutral">{logs.length} logs</span>
              </div>
              <form className="edit-card" onSubmit={submitManualAutomation}>
                <h3>Manual process trigger</h3>
                <label>
                  Zone ID
                  <select value={manualZoneId} onChange={(e) => onManualZoneChange(e.target.value)}>
                    <option value="">Select a zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name} ({zone.id.slice(0, 8)}...)</option>
                    ))}
                  </select>
                </label>
                <label>
                  Device ID
                  <input value={manualDeviceId} onChange={(e) => setManualDeviceId(e.target.value)} placeholder="device-id" />
                </label>
                <label>
                  Temperature
                  <input type="number" value={manualTemp} onChange={(e) => setManualTemp(e.target.value)} />
                </label>
                <label>
                  Humidity
                  <input type="number" value={manualHumidity} onChange={(e) => setManualHumidity(e.target.value)} />
                </label>
                <div className="inline-actions">
                  <button type="button" className="btn btn-ghost" onClick={loadZones} disabled={!canCallApi || busyAction === 'loadZones'}>
                    Load Zones
                  </button>
                  <button type="submit" className="btn" disabled={!canCallApi || !manualFormValid || busyAction === 'manualAutomation'}>
                    {busyAction === 'manualAutomation' ? 'Sending...' : 'Send Event'}
                  </button>
                </div>
                {selectedZone && <small className="hint">Selected device: {selectedZone.deviceId || 'not assigned yet'}</small>}
              </form>
              <Pagination
                label="Showing actions"
                pageData={logPageData}
                onPrev={() => setLogPage((page) => Math.max(page - 1, 1))}
                onNext={() => setLogPage((page) => Math.min(page + 1, logPageData.totalPages))}
              />
              <ul className="list">
                {logPageData.items.map((log, idx) => (
                  <li key={`${log.zoneId}-${logPageData.start + idx}`}>
                    <div className="list-row">
                      <strong>{log.action}</strong>
                      <span className="badge badge-neutral">{log.zoneId}</span>
                    </div>
                    <small>temp: {log.temperature}</small>
                  </li>
                ))}
                {logs.length === 0 && <li className="empty-state">No automation logs loaded yet. Refresh after telemetry is available.</li>}
              </ul>
            </div>
          </div>
        )}
      </section>

      <footer className="status-line">
        <span className={`status-text ${statusKind}`}>{statusMessage}</span>
        <span className={`status-chip ${canCallApi ? 'status-chip-ok' : 'status-chip-warn'}`}>
          {canCallApi ? 'JWT ready' : 'JWT required'}
        </span>
      </footer>
    </main>
  );
}

export default App;
