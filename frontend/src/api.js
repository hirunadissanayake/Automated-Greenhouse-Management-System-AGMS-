const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function fetchZones(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/zones`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw new Error(`Zones request failed (${res.status})`);
  return res.json();
}

export async function createZone(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/zones`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create zone failed (${res.status})`);
  return res.json();
}

export async function fetchCrops(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/crops`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw new Error(`Crops request failed (${res.status})`);
  return res.json();
}

export async function createCrop(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/crops`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create crop failed (${res.status})`);
  return res.json();
}

export async function updateCropStatus(baseUrl, token, cropId, status) {
  const res = await fetch(`${baseUrl}/api/crops/${cropId}/status`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Update crop status failed (${res.status})`);
  return res.json();
}

export async function fetchAutomationLogs(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/automation/logs`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw new Error(`Automation logs request failed (${res.status})`);
  return res.json();
}

export async function fetchLatestSensor(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/sensors/latest`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw new Error(`Sensor latest request failed (${res.status})`);
  return res.json();
}
