import JobCard from './JobCard'
import type { Job } from './JobCard'
import './JobCard.css'

const SAMPLE_JOBS: Job[] = [
  {
    id: 1,
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years',
    description: 'Build delightful user experiences with React and TypeScript.',
    tags: ['React', 'TypeScript', 'CSS'],
    isNew: true,
  },
  {
    id: 2,
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    experience: '5+ years',
    description: 'Design scalable APIs and services.',
    tags: ['Python', 'Django', 'Postgres'],
    isUrgent: true,
  },
]

export default function JobListings() {
  return (
    <section id="jobs" className="container">
      <h2 className="section-heading">Open roles</h2>
      <div className="job-listings">
        {SAMPLE_JOBS.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  )
}
