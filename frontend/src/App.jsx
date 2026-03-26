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

function App() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [token, setToken] = useState('');
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

  const canCallApi = useMemo(() => token.trim().length > 10, [token]);
  const tokenHint = useMemo(() => getJwtExpirationText(token), [token]);
  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === manualZoneId),
    [zones, manualZoneId],
  );

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
    if (!confirm(`Delete zone ${zoneId}?`)) {
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

  return (
    <main className="agms-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Automated Greenhouse Management System</p>
          <h1>AGMS Operations Console</h1>
          <p className="subcopy">Monitor greenhouse APIs through one operational dashboard.</p>
        </div>
        <div className="connection-card">
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
        </div>
      </header>

      <section className="tabs">
        <button className={activeTab === 'zones' ? 'active' : ''} onClick={() => setActiveTab('zones')}>Zones</button>
        <button className={activeTab === 'crops' ? 'active' : ''} onClick={() => setActiveTab('crops')}>Crops</button>
        <button className={activeTab === 'automation' ? 'active' : ''} onClick={() => setActiveTab('automation')}>Automation</button>
      </section>

      <section className="panel">
        {activeTab === 'zones' && (
          <div className="grid-two">
            <form onSubmit={submitZone} className="card">
              <h2>Create Zone</h2>
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
              <small className="hint">Tip: keep Min Temp lower than Max Temp.</small>
              <button type="submit" className="btn" disabled={!canCallApi || !zoneFormValid || busyAction === 'createZone'}>
                {busyAction === 'createZone' ? 'Creating...' : 'Create Zone'}
              </button>
            </form>

            <div className="card">
              <div className="card-header">
                <h2>Zone List</h2>
                <button className="btn" onClick={loadZones} disabled={!canCallApi || busyAction === 'loadZones'}>
                  {busyAction === 'loadZones' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {editZoneId && (
                <form className="edit-card" onSubmit={saveEdit}>
                  <h3>Editing Zone: {editZoneId.slice(0, 8)}...</h3>
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
              <ul className="list">
                {zones.map((zone) => (
                  <li key={zone.id}>
                    <strong>{zone.name}</strong>
                    <span>{zone.minTemp} - {zone.maxTemp} C</span>
                    <small>device: {zone.deviceId || 'pending'}</small>
                    <div className="inline-actions">
                      <button className="btn" onClick={() => beginEdit(zone)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => removeZone(zone.id)}>Delete</button>
                    </div>
                  </li>
                ))}
                {zones.length === 0 && <li>No zones loaded yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'crops' && (
          <div className="grid-two">
            <form onSubmit={submitCrop} className="card">
              <h2>Register Crop Batch</h2>
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
                <h2>Crop Inventory</h2>
                <button className="btn" onClick={loadCrops} disabled={!canCallApi || busyAction === 'loadCrops'}>
                  {busyAction === 'loadCrops' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <ul className="list">
                {crops.map((crop) => (
                  <li key={crop.id}>
                    <strong>{crop.cropName}</strong>
                    <span>qty: {crop.quantity}</span>
                    <small>status: {crop.status}</small>
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
                {crops.length === 0 && <li>No crop batches loaded yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="grid-two">
            <div className="card">
              <div className="card-header">
                <h2>Latest Sensor Reading</h2>
                <button className="btn" onClick={loadLogsAndSensor} disabled={!canCallApi || busyAction === 'loadAutomation'}>
                  {busyAction === 'loadAutomation' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {latestSensor ? (
                <div className="metric-stack">
                  <p>Zone: {latestSensor.zoneId}</p>
                  <p>Device: {latestSensor.deviceId}</p>
                  <p>Temperature: {latestSensor.temperature}</p>
                  <p>Humidity: {latestSensor.humidity}</p>
                </div>
              ) : (
                <p>No sensor data loaded yet.</p>
              )}
            </div>

            <div className="card">
              <h2>Automation Logs</h2>
              <form className="edit-card" onSubmit={submitManualAutomation}>
                <h3>Manual Process Trigger</h3>
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
              <ul className="list">
                {logs.map((log, idx) => (
                  <li key={`${log.zoneId}-${idx}`}>
                    <strong>{log.action}</strong>
                    <span>zone: {log.zoneId}</span>
                    <small>temp: {log.temperature}</small>
                  </li>
                ))}
                {logs.length === 0 && <li>No automation logs loaded yet.</li>}
              </ul>
            </div>
          </div>
        )}
      </section>

      <footer className="status-line">
        <span className={`status-text ${statusKind}`}>{statusMessage}</span>
        <span className={canCallApi ? 'ok' : 'warn'}>{canCallApi ? 'JWT ready' : 'JWT required'}</span>
      </footer>
    </main>
  );
}

export default App;
