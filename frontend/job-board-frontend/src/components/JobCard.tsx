import { useState } from 'react'
import ApplyModal from './ApplyModal'
import './JobCard.css'

export interface Job {
  id: number
  title: string
  department: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  experience: string
  description: string
  tags: string[]
  isNew?: boolean
  isUrgent?: boolean
}

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <article className="job-card">
        <div className="job-card__header">
          <div className="job-card__meta">
            <div className="job-card__badges">
              {job.isNew    && <span className="badge badge--green">New</span>}
              {job.isUrgent && <span className="badge badge--orange">Urgent</span>}
              <span className="badge badge--type">{job.type}</span>
            </div>
            <h3 className="job-card__title">{job.title}</h3>
            <p className="job-card__dept">{job.department}</p>
          </div>
        </div>

        <p className="job-card__desc">{job.description}</p>

        <div className="job-card__details">
          <span className="job-card__detail">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>
          <span className="job-card__detail">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {job.experience}
          </span>
        </div>

        <div className="job-card__tags">
          {job.tags.map(tag => (
            <span key={tag} className="job-card__tag">{tag}</span>
          ))}
        </div>

        <button
          className="btn btn--primary job-card__cta"
          onClick={() => setModalOpen(true)}
        >
          Apply Now
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </article>

      {modalOpen && (
        <ApplyModal job={job} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
