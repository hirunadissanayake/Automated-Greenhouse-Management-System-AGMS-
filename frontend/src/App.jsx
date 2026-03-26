import { useMemo, useState } from 'react'
import {
  createCrop,
  createZone,
  fetchAutomationLogs,
  fetchCrops,
  fetchLatestSensor,
  fetchZones,
  updateCropStatus,
} from './api'
import './App.css'

function App() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080')
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState('zones')
  const [zones, setZones] = useState([])
  const [crops, setCrops] = useState([])
  const [logs, setLogs] = useState([])
  const [latestSensor, setLatestSensor] = useState(null)
  const [zoneName, setZoneName] = useState('Tomato Zone')
  const [minTemp, setMinTemp] = useState(20)
  const [maxTemp, setMaxTemp] = useState(30)
  const [cropName, setCropName] = useState('Lettuce')
  const [cropQty, setCropQty] = useState(100)
  const [statusMessage, setStatusMessage] = useState('Ready')

  const canCallApi = useMemo(() => token.trim().length > 10, [token])

  async function loadZones() {
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      const data = await fetchZones(baseUrl, token)
      setZones(data)
      setStatusMessage('Zones loaded.')
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  async function submitZone(event) {
    event.preventDefault()
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      const created = await createZone(baseUrl, token, {
        name: zoneName,
        minTemp: Number(minTemp),
        maxTemp: Number(maxTemp),
      })
      setStatusMessage(`Zone created: ${created.id}`)
      await loadZones()
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  async function loadCrops() {
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      const data = await fetchCrops(baseUrl, token)
      setCrops(data)
      setStatusMessage('Crops loaded.')
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  async function submitCrop(event) {
    event.preventDefault()
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      const created = await createCrop(baseUrl, token, {
        cropName,
        quantity: Number(cropQty),
      })
      setStatusMessage(`Crop batch created: ${created.id}`)
      await loadCrops()
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  async function markVegetative(cropId) {
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      await updateCropStatus(baseUrl, token, cropId, 'VEGETATIVE')
      setStatusMessage(`Crop ${cropId} moved to VEGETATIVE`)
      await loadCrops()
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  async function loadLogsAndSensor() {
    if (!canCallApi) {
      setStatusMessage('Enter a valid JWT first.')
      return
    }
    try {
      const [logData, sensorData] = await Promise.all([
        fetchAutomationLogs(baseUrl, token),
        fetchLatestSensor(baseUrl, token),
      ])
      setLogs(logData)
      setLatestSensor(sensorData)
      setStatusMessage('Automation and sensor data loaded.')
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  return (
    <main className="agms-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Automated Greenhouse Management System</p>
          <h1>AGMS Operations Console</h1>
          <p className="subcopy">
            Monitor live greenhouse state and execute core workflows via API Gateway.
          </p>
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
              <button type="submit">Create Zone</button>
            </form>

            <div className="card">
              <div className="card-header">
                <h2>Zone List</h2>
                <button onClick={loadZones}>Refresh</button>
              </div>
              <ul className="list">
                {zones.map((zone) => (
                  <li key={zone.id}>
                    <strong>{zone.name}</strong>
                    <span>{zone.minTemp} - {zone.maxTemp} C</span>
                    <small>device: {zone.deviceId || 'pending'}</small>
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
              <button type="submit">Create Batch</button>
            </form>

            <div className="card">
              <div className="card-header">
                <h2>Crop Inventory</h2>
                <button onClick={loadCrops}>Refresh</button>
              </div>
              <ul className="list">
                {crops.map((crop) => (
                  <li key={crop.id}>
                    <strong>{crop.cropName}</strong>
                    <span>qty: {crop.quantity}</span>
                    <small>status: {crop.status}</small>
                    {crop.status === 'SEEDLING' && (
                      <button onClick={() => markVegetative(crop.id)}>Move to VEGETATIVE</button>
                    )}
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
                <button onClick={loadLogsAndSensor}>Refresh</button>
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
        <span>{statusMessage}</span>
        <span className={canCallApi ? 'ok' : 'warn'}>
          {canCallApi ? 'JWT ready' : 'JWT required'}
        </span>
      </footer>
    </main>
  )
}

export default App
