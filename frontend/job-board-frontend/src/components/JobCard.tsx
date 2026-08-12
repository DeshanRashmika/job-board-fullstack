import { useState } from 'react'
import ApplyModal from './ApplyModal'
import './JobCard.css'

// Matches Django JobSerializer fields exactly
export interface Job {
  id:              number
  title:           string
  description:     string
  salary:          string | null
  location:        string
  job_type:        'FULL_TIME' | 'PART_TIME' | 'REMOTE' | 'CONTRACT'
  category:        number | null
  company:         number | null
  company_name:    string | null
  is_active:       boolean
  is_external:     boolean
  external_url:    string | null
  created_at:      string
}

const JOB_TYPE_LABELS: Record<Job['job_type'], string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  REMOTE:    'Remote',
  CONTRACT:  'Contract',
}

const JOB_TYPE_COLORS: Record<Job['job_type'], string> = {
  FULL_TIME: 'badge--blue',
  PART_TIME: 'badge--purple',
  REMOTE:    'badge--green',
  CONTRACT:  'badge--orange',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const isNew      = (Date.now() - new Date(job.created_at).getTime()) < 3 * 86_400_000
  const isExternal = job.is_external && !!job.external_url

  return (
    <>
      <article className={`job-card${isExternal ? ' job-card--external' : ''}`}>

        {/* ── Header ── */}
        <div className="job-card__header">
          <div className="job-card__meta">
            <div className="job-card__badges">
              {isNew && <span className="badge badge--new">New</span>}
              <span className={`badge ${JOB_TYPE_COLORS[job.job_type]}`}>
                {JOB_TYPE_LABELS[job.job_type]}
              </span>
              {isExternal && (
                <span className="badge badge--external">
                  {/* External link icon */}
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                         M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  ITPro.lk
                </span>
              )}
            </div>
            <h3 className="job-card__title">{job.title}</h3>
            <p className="job-card__company">
              {job.company_name ?? 'Unknown Company'}
            </p>
          </div>
        </div>

        {/* ── Description ── */}
        <p className="job-card__desc">{job.description}</p>

        {/* ── Details ── */}
        <div className="job-card__details">
          <span className="job-card__detail">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0
                   L6.343 16.657a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>

          {job.salary && (
            <span className="job-card__detail">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2
                     -1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8
                     m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0
                     9 9 0 0118 0z" />
              </svg>
              {job.salary}
            </span>
          )}

          <span className="job-card__detail job-card__detail--muted">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeAgo(job.created_at)}
          </span>
        </div>

        {/* ── CTA ── */}
        {isExternal ? (
          /* External job → open itpro.lk in new tab */
          <a
            href={job.external_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--external job-card__cta"
            aria-label={`View ${job.title} on ITPro.lk (opens in new tab)`}
          >
            View on ITPro.lk
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                   M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          /* Local job → apply modal */
          <button
            className="btn btn--primary job-card__cta"
            onClick={() => setModalOpen(true)}
          >
            Apply Now
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        )}
      </article>

      {/* Apply modal — only for local jobs */}
      {!isExternal && modalOpen && (
        <ApplyModal job={job} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
