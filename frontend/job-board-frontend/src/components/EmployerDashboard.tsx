import { useState, useEffect, useCallback } from 'react'
import type { Job } from './JobCard'
import './EmployerDashboard.css'

const API = 'http://localhost:8000/api'

interface Application {
  id: number
  job: number
  job_title?: string
  applicant: string
  cover_letter: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  applied_at: string
  resume: string
}

type Tab = 'jobs' | 'applications'
type PostStatus = 'idle' | 'loading' | 'success' | 'error'

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'REMOTE',    label: 'Remote' },
  { value: 'CONTRACT',  label: 'Contract' },
]

const STATUS_COLORS: Record<Application['status'], string> = {
  PENDING:  'status--pending',
  ACCEPTED: 'status--accepted',
  REJECTED: 'status--rejected',
}

function authHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Post Job Form ────────────────────────────────────────────────────
interface PostJobFormProps {
  onSuccess: () => void
}

function PostJobForm({ onSuccess }: PostJobFormProps) {
  const [form, setForm] = useState({
    title: '', description: '', location: '', salary: '', job_type: 'FULL_TIME',
  })
  const [status, setStatus] = useState<PostStatus>('idle')
  const [error, setError]   = useState('')

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('loading')

    try {
      const res = await fetch(`${API}/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg =
          data?.detail ||
          Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join('  •  ')
        throw new Error(msg || 'Failed to post job.')
      }

      setStatus('success')
      setForm({ title: '', description: '', location: '', salary: '', job_type: 'FULL_TIME' })
      setTimeout(() => { setStatus('idle'); onSuccess() }, 1200)
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <form className="post-job-form" onSubmit={handleSubmit} noValidate>
      <h3 className="post-job-form__heading">Post a New Role</h3>

      {status === 'error' && (
        <p className="form-error" role="alert">{error}</p>
      )}
      {status === 'success' && (
        <p className="form-success" role="status">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Job posted successfully!
        </p>
      )}

      <div className="pjf__row">
        <div className="pjf__field">
          <label className="pjf__label" htmlFor="pj-title">Job Title *</label>
          <input id="pj-title" className="pjf__input" type="text"
            placeholder="e.g. Frontend Engineer"
            value={form.title} onChange={set('title')} required />
        </div>
        <div className="pjf__field">
          <label className="pjf__label" htmlFor="pj-location">Location *</label>
          <input id="pj-location" className="pjf__input" type="text"
            placeholder="e.g. Remote, New York"
            value={form.location} onChange={set('location')} required />
        </div>
      </div>

      <div className="pjf__row">
        <div className="pjf__field">
          <label className="pjf__label" htmlFor="pj-type">Job Type</label>
          <select id="pj-type" className="pjf__select"
            value={form.job_type} onChange={set('job_type')}>
            {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="pjf__field">
          <label className="pjf__label" htmlFor="pj-salary">Salary <span className="pjf__optional">(optional)</span></label>
          <input id="pj-salary" className="pjf__input" type="text"
            placeholder="e.g. $80k – $100k"
            value={form.salary} onChange={set('salary')} />
        </div>
      </div>

      <div className="pjf__field">
        <label className="pjf__label" htmlFor="pj-desc">Description *</label>
        <textarea id="pj-desc" className="pjf__textarea" rows={6}
          placeholder="Describe the role, responsibilities, requirements…"
          value={form.description} onChange={set('description')} required />
      </div>

      <button
        type="submit"
        className="btn btn--primary pjf__submit"
        disabled={status === 'loading' || status === 'success'}
      >
        {status === 'loading' ? (
          <><span className="auth-spinner" aria-hidden="true" /> Posting…</>
        ) : (
          <>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post Job
          </>
        )}
      </button>
    </form>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────
export default function EmployerDashboard() {
  const [tab, setTab]               = useState<Tab>('jobs')
  const [jobs, setJobs]             = useState<Job[]>([])
  const [applications, setApps]     = useState<Application[]>([])
  const [loadingJobs, setLoadingJobs]   = useState(true)
  const [loadingApps, setLoadingApps]   = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [updatingApp, setUpdatingApp]   = useState<number | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const res = await fetch(`${API}/jobs/?my_jobs=true`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : data.results ?? [])
    } catch { /* ignore */ }
    finally  { setLoadingJobs(false) }
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true)
    try {
      const res = await fetch(`${API}/applications/`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      const apps: Application[] = Array.isArray(data) ? data : data.results ?? []
      setApps(apps)
    } catch { /* ignore */ }
    finally  { setLoadingApps(false) }
  }, [])

  useEffect(() => { fetchJobs() },         [fetchJobs])
  useEffect(() => { fetchApplications() }, [fetchApplications])

  async function toggleActive(job: Job) {
    setTogglingId(job.id)
    try {
      await fetch(`${API}/jobs/${job.id}/toggle_active/`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      fetchJobs()
    } catch { /* ignore */ }
    finally { setTogglingId(null) }
  }

  async function updateAppStatus(appId: number, newStatus: Application['status']) {
    setUpdatingApp(appId)
    try {
      await fetch(`${API}/applications/${appId}/update_status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchApplications()
    } catch { /* ignore */ }
    finally { setUpdatingApp(null) }
  }

  return (
    <div className="dashboard container">
      {/* Page header */}
      <div className="dashboard__hero">
        <div>
          <h1 className="dashboard__title">Employer Dashboard</h1>
          <p className="dashboard__subtitle">Manage your job listings and review applications.</p>
        </div>
        <div className="dashboard__stats">
          <div className="dash-stat">
            <span className="dash-stat__num">{jobs.length}</span>
            <span className="dash-stat__label">Active Roles</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__num">{applications.length}</span>
            <span className="dash-stat__label">Applications</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__num">
              {applications.filter(a => a.status === 'PENDING').length}
            </span>
            <span className="dash-stat__label">Pending Review</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard__tabs" role="tablist">
        <button
          className={`dashboard__tab ${tab === 'jobs' ? 'active' : ''}`}
          role="tab"
          aria-selected={tab === 'jobs'}
          onClick={() => setTab('jobs')}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          My Jobs
          <span className="tab-badge">{jobs.length}</span>
        </button>
        <button
          className={`dashboard__tab ${tab === 'applications' ? 'active' : ''}`}
          role="tab"
          aria-selected={tab === 'applications'}
          onClick={() => setTab('applications')}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Applications
          <span className="tab-badge">{applications.filter(a => a.status === 'PENDING').length}</span>
        </button>
      </div>

      {/* ── Tab: Jobs ── */}
      {tab === 'jobs' && (
        <div className="dashboard__panel">
          <PostJobForm onSuccess={fetchJobs} />

          <div className="jobs-table-section">
            <h3 className="jobs-table__heading">Your Listings</h3>

            {loadingJobs ? (
              <div className="dashboard__loading">
                <span className="jls__spinner" />
                <span>Loading jobs…</span>
              </div>
            ) : jobs.length === 0 ? (
              <p className="dashboard__empty">No jobs posted yet. Use the form above to post your first role.</p>
            ) : (
              <div className="jobs-table">
                {jobs.map(job => (
                  <div key={job.id} className={`jobs-table__row ${!job.is_active ? 'inactive' : ''}`}>
                    <div className="jobs-table__info">
                      <span className="jobs-table__title">{job.title}</span>
                      <span className="jobs-table__meta">{job.location} · {job.job_type.replace('_', ' ')}</span>
                    </div>
                    <div className="jobs-table__actions">
                      <span className={`status-pill ${job.is_active ? 'status-pill--active' : 'status-pill--inactive'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => toggleActive(job)}
                        disabled={togglingId === job.id}
                      >
                        {togglingId === job.id ? '…' : job.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Applications ── */}
      {tab === 'applications' && (
        <div className="dashboard__panel">
          <h3 className="jobs-table__heading">Received Applications</h3>

          {loadingApps ? (
            <div className="dashboard__loading">
              <span className="jls__spinner" />
              <span>Loading applications…</span>
            </div>
          ) : applications.length === 0 ? (
            <p className="dashboard__empty">No applications yet.</p>
          ) : (
            <div className="apps-list">
              {applications.map(app => (
                <div key={app.id} className="app-card">
                  <div className="app-card__head">
                    <div>
                      <p className="app-card__applicant">{app.applicant}</p>
                      <p className="app-card__job-title">
                        Applied for: {app.job_title ?? `Job #${app.job}`}
                      </p>
                      <p className="app-card__date">
                        {new Date(app.applied_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`status-badge ${STATUS_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                  </div>

                  {app.cover_letter && (
                    <p className="app-card__cover">{app.cover_letter}</p>
                  )}

                  {app.resume && (
                    <a
                      href={`http://localhost:8000${app.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-card__resume-link"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Resume
                    </a>
                  )}

                  {app.status === 'PENDING' && (
                    <div className="app-card__actions">
                      <button
                        className="btn btn--accept"
                        disabled={updatingApp === app.id}
                        onClick={() => updateAppStatus(app.id, 'ACCEPTED')}
                      >
                        {updatingApp === app.id ? '…' : '✓ Accept'}
                      </button>
                      <button
                        className="btn btn--reject"
                        disabled={updatingApp === app.id}
                        onClick={() => updateAppStatus(app.id, 'REJECTED')}
                      >
                        {updatingApp === app.id ? '…' : '✕ Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
