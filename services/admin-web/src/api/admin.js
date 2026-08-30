import { supabase } from '../lib/supabase'

// Thin API client for the CamTech admin endpoints exposed by the
// AI Orchestrator API. Every call attaches the current Supabase JWT.
async function authHeaders(extra = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token ?? ''}`,
    ...extra,
  }
}

async function handle(resp) {
  if (!resp.ok) {
    let detail = `Request failed (${resp.status})`
    try {
      const body = await resp.json()
      if (body?.detail) detail = body.detail
    } catch { /* ignore parse errors */ }
    throw new Error(detail)
  }
  if (resp.status === 204) return null
  return resp.json()
}

export const adminApi = {
  // --- Tokens ---
  listTokens: async () =>
    handle(await fetch('/api/admin/tokens', { headers: await authHeaders() })),

  createToken: async (payload) =>
    handle(await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })),

  setTokenActive: async (id, isActive) =>
    handle(await fetch(`/api/admin/tokens/${id}`, {
      method: 'PATCH',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ is_active: isActive }),
    })),

  deleteToken: async (id) =>
    handle(await fetch(`/api/admin/tokens/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })),

  // --- Users ---
  listUsers: async () =>
    handle(await fetch('/api/admin/users', { headers: await authHeaders() })),

  updateUser: async (id, updates) =>
    handle(await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    })),

  // --- n8n Workflows ---
  listWorkflows: async () =>
    handle(await fetch('/api/n8n/workflows', { headers: await authHeaders() })),

  createWorkflow: async (payload) =>
    handle(await fetch('/api/n8n/workflows', {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })),

  updateWorkflow: async (id, updates) =>
    handle(await fetch(`/api/n8n/workflows/${id}`, {
      method: 'PATCH',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    })),

  deleteWorkflow: async (id) =>
    handle(await fetch(`/api/n8n/workflows/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })),

  triggerWorkflow: async (id, payload = {}) =>
    handle(await fetch(`/api/n8n/trigger/${id}`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ payload }),
    })),

  // --- n8n Automation Logs ---
  listAllLogs: async (limit = 50) =>
    handle(await fetch(`/api/n8n/logs?limit=${limit}`, { headers: await authHeaders() })),

  listWorkflowLogs: async (workflowId, limit = 20) =>
    handle(await fetch(`/api/n8n/logs/${workflowId}?limit=${limit}`, { headers: await authHeaders() })),
}
