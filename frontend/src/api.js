const normalizeToken = (token) => (token || '').trim().replace(/^Bearer\s+/i, '');

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${normalizeToken(token)}`,
});

async function buildApiError(prefix, res) {
  const authError = res.headers.get('X-Auth-Error');
  let detail = '';
  try {
    const data = await res.json();
    detail = data?.error || data?.message || '';
  } catch {
    detail = '';
  }

  const suffix = authError || detail;
  return new Error(suffix ? `${prefix} (${res.status}): ${suffix}` : `${prefix} (${res.status})`);
}

export async function fetchZones(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/zones`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw await buildApiError('Zones request failed', res);
  return res.json();
}

export async function createZone(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/zones`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await buildApiError('Create zone failed', res);
  return res.json();
}

export async function updateZone(baseUrl, token, zoneId, payload) {
  const res = await fetch(`${baseUrl}/api/zones/${zoneId}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await buildApiError('Update zone failed', res);
  return res.json();
}

export async function deleteZone(baseUrl, token, zoneId) {
  const res = await fetch(`${baseUrl}/api/zones/${zoneId}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw await buildApiError('Delete zone failed', res);
}

export async function fetchCrops(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/crops`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw await buildApiError('Crops request failed', res);
  return res.json();
}

export async function createCrop(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/crops`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await buildApiError('Create crop failed', res);
  return res.json();
}

export async function updateCropStatus(baseUrl, token, cropId, status) {
  const res = await fetch(`${baseUrl}/api/crops/${cropId}/status`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await buildApiError('Update crop status failed', res);
  return res.json();
}

export async function fetchAutomationLogs(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/automation/logs`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw await buildApiError('Automation logs request failed', res);
  return res.json();
}

export async function processAutomation(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/automation/process`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await buildApiError('Automation process failed', res);
}

export async function fetchLatestSensor(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/sensors/latest`, {
    headers: jsonHeaders(token),
  });
  if (!res.ok) throw await buildApiError('Sensor latest request failed', res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
