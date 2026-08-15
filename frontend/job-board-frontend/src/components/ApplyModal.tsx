import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from './JobCard'
import '../styles/ApplyModal.css'

interface ApplyModalProps {
  job: Job
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ApplyModal({ job, onClose }: ApplyModalProps) {
  const navigate = useNavigate()
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume]           = useState<File | null>(null)
  const [status, setStatus]           = useState<Status>('idle')
  const [error, setError]             = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const token = localStorage.getItem('access_token')


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])


  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')


    if (!token) {
      onClose()
      navigate('/login')
      return
    }

    if (!resume) {
      setError('Please attach your resume (PDF or DOC).')
      return
    }

    setStatus('loading')


    const body = new FormData()
    body.append('job', String(job.id))
    body.append('resume', resume)
    if (coverLetter.trim()) body.append('cover_letter', coverLetter)

    try {
      const res = await fetch('http://localhost:8000/api/applications/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg =
          data?.detail ||
          Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join('  •  ')
        throw new Error(msg || 'Failed to submit. Please try again.')
      }

      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      <div className="modal" ref={dialogRef}>
        {/* Header */}
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Applying for</p>
            <h2 className="modal__title" id="apply-modal-title">{job.title}</h2>
            <p className="modal__subtitle">
              {job.company_name ?? 'Unknown Company'} · {job.location}
            </p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success */}
        {status === 'success' ? (
          <div className="modal__success">
            <div className="modal__success-icon" aria-hidden="true">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3>Application Submitted!</h3>
            <p>We'll review your application for <strong>{job.title}</strong> and get back to you soon.</p>
            <button className="btn btn--primary modal__done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="modal__form" onSubmit={handleSubmit} noValidate>
            {/* Not logged in warning */}
            {!token && (
              <div className="modal__info-banner">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You need to <button type="button" className="modal__inline-link"
                  onClick={() => { onClose(); navigate('/login') }}>sign in</button> to apply.
              </div>
            )}

            {status === 'error' && (
              <p className="modal__error" role="alert">{error}</p>
            )}

            {/* Resume upload */}
            <div className="modal__field">
              <label className="modal__label-field" htmlFor="apply-resume">
                Resume <span className="modal__required">*</span>
              </label>
              <div
                className={`modal__file-drop ${resume ? 'modal__file-drop--filled' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) setResume(f)
                }}
              >
                {resume ? (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="modal__file-name">{resume.name}</span>
                    <button
                      type="button"
                      className="modal__file-remove"
                      onClick={ev => { ev.stopPropagation(); setResume(null) }}
                    >✕</button>
                  </>
                ) : (
                  <>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Drop your resume here, or <strong>browse</strong></span>
                    <span className="modal__file-hint">PDF, DOC, DOCX up to 5 MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                id="apply-resume"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => setResume(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Cover letter */}
            <div className="modal__field">
              <label className="modal__label-field" htmlFor="apply-cover">
                Cover Letter <span className="modal__optional">(optional)</span>
              </label>
              <textarea
                id="apply-cover"
                className="modal__textarea"
                rows={5}
                placeholder="Tell us why you'd be a great fit for this role…"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary modal__submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><span className="auth-spinner" aria-hidden="true" /> Submitting…</>
              ) : (
                <>
                  Submit Application
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
