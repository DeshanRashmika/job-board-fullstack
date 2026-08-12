import { useState, useEffect, useCallback, useRef } from 'react'
import JobCard from './JobCard'
import type { Job } from './JobCard'
import './JobListings.css'

const API          = 'http://localhost:8000/api'
const PAGE_SIZE    = 15
const MAX_PAGES_SHOWN = 7   // max numbered buttons before we use ellipsis

type Status = 'loading' | 'ok' | 'error'

const JOB_TYPES = [
  { value: '',          label: 'All Types'  },
  { value: 'FULL_TIME', label: 'Full Time'  },
  { value: 'PART_TIME', label: 'Part Time'  },
  { value: 'REMOTE',    label: 'Remote'     },
  { value: 'CONTRACT',  label: 'Contract'   },
]

// Shape of DRF paginated response from JobPagination
interface PagedResponse {
  count:       number
  total_pages: number
  next:        string | null
  previous:    string | null
  results:     Job[]
}

// Build the page-number button list with ellipsis gaps
// e.g. [1, '…', 4, 5, 6, '…', 12]
function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= MAX_PAGES_SHOWN) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | '…')[] = []
  const delta = 2   // pages around current
  const left  = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  pages.push(1)
  if (left > 2) pages.push('…')
  for (let p = left; p <= right; p++) pages.push(p)
  if (right < total - 1) pages.push('…')
  pages.push(total)

  return pages
}

export default function JobListings() {
  const [jobs,       setJobs]       = useState<Job[]>([])
  const [status,     setStatus]     = useState<Status>('loading')
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [jobType,    setJobType]    = useState('')
  const [location,   setLocation]   = useState('')

  // ref to the section top for smooth scroll-to-top on page change
  const sectionRef = useRef<HTMLElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (targetPage: number) => {
    setStatus('loading')
    try {
      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      if (search)   params.set('search',   search)
      if (jobType)  params.set('job_type', jobType)
      if (location) params.set('location', location)

      const res = await fetch(`${API}/jobs/?${params}`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const raw = await res.json()

      // Handle both:
      //   - paginated:  { count, total_pages, next, previous, results: [...] }
      //   - plain list: [...] (old server / unpaginated fallback)
      const data: PagedResponse = Array.isArray(raw)
        ? { count: raw.length, total_pages: 1, next: null, previous: null, results: raw }
        : raw

      setJobs(data.results       ?? [])
      setTotalCount(data.count       ?? 0)
      setTotalPages(data.total_pages ?? 1)
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [search, jobType, location])

  // When filters change → reset to page 1 with 400ms debounce
  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => fetchJobs(1), 400)
    return () => clearTimeout(t)
  }, [search, jobType, location, fetchJobs])

  // When page changes (but filters haven't) → fetch immediately, scroll up
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return   // already handled by the filter effect above on mount
    }
    fetchJobs(page)
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────
  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { setPage(1); fetchJobs(1) }
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page) return
    setPage(p)
  }

  function clearFilters() {
    setSearch('')
    setJobType('')
    setLocation('')
    setPage(1)
  }

  const hasFilters   = !!(search || jobType || location)
  const pageRange    = buildPageRange(page, totalPages)
  const startItem    = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem      = Math.min(page * PAGE_SIZE, totalCount)

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <section id="jobs" className="container job-listings-section" ref={sectionRef}>

      {/* ── Header ── */}
      <div className="jls__header">
        <h2 className="section-heading">Open Roles</h2>
        {status === 'ok' && totalCount > 0 && (
          <span className="jls__count">
            Showing {startItem}–{endItem} of {totalCount}{' '}
            {totalCount === 1 ? 'position' : 'positions'}
          </span>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="jls__filters">

        {/* Search */}
        <div className="jls__search-wrap">
          <svg className="jls__search-icon" width="16" height="16" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            className="jls__search"
            type="text"
            placeholder="Search by title, skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            aria-label="Search jobs"
          />
        </div>

        {/* Location */}
        <div className="jls__search-wrap">
          <svg className="jls__search-icon" width="16" height="16" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            className="jls__search"
            type="text"
            placeholder="Location…"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={handleSearchKey}
            aria-label="Filter by location"
          />
        </div>

        {/* Job type */}
        <select
          className="jls__select"
          value={jobType}
          onChange={e => setJobType(e.target.value)}
          aria-label="Filter by job type"
        >
          {JOB_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button className="jls__clear" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {status === 'loading' && (
        <div className="jls__state">
          <div className="jls__spinner" aria-label="Loading jobs…" role="status" />
          <p>Loading open roles…</p>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className="jls__state jls__state--error">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94
                 a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p>Could not load jobs. Is the backend running?</p>
          <button className="btn btn--outline" onClick={() => fetchJobs(page)}>
            Retry
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {status === 'ok' && jobs.length === 0 && (
        <div className="jls__state jls__state--empty">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745
                 M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01
                 M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p>No roles match your search. Try different filters.</p>
        </div>
      )}

      {/* ── Job grid ── */}
      {status === 'ok' && jobs.length > 0 && (
        <>
          <div className="job-listings">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* ── Pagination bar (only when there's more than one page) ── */}
          {totalPages > 1 && (
            <nav className="jls__pagination" aria-label="Job listings pages">

              {/* Prev */}
              <button
                className="jls__page-btn jls__page-btn--nav"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {/* Numbered pages */}
              {pageRange.map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="jls__page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`jls__page-btn${p === page ? ' jls__page-btn--active' : ''}`}
                    onClick={() => goToPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                className="jls__page-btn jls__page-btn--nav"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                Next
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </nav>
          )}
        </>
      )}

    </section>
  )
}
