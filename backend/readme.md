# 💼 Online Job Board & Recruitment Portal

A secure, full-stack web application connecting employers with job seekers. Built using **React (SPA)** on the frontend, **Django REST Framework (DRF)** on the backend, and **PostgreSQL** as the relational database.

---

## 📌 Table of Contents
* [Overview & Core Features](#-overview--core-features)
* [Tech Stack](#-tech-stack)
* [System Architecture & Database Schema](#-system-architecture--database-schema)
* [Project Directory Structure](#-project-directory-structure)
* [Security Implementations](#-security-implementations)
* [Email Integration](#-email-integration)
* [Local Setup & Installation](#-local-setup--installation)
* [API Endpoints Overview](#-api-endpoints-overview)
* [Git & GitHub Workflow](#-git--github-workflow)

---

## 🛑 Overview & Core Features

This project provides a comprehensive recruitment workflow with two distinct user roles:

### 🏢 1. Employer (Recruiter)
* **Company Profile Setup:** Create and manage company profile details.
* **Job Posting Management:** Create, edit, update, and close job listings (CRUD operations).
* **Employer Dashboard:** Protected interface showing active postings and total applicant counts.
* **Applicant Review:** View applicant details and update application statuses (`REVIEWED`, `ACCEPTED`, `REJECTED`).

### 👨‍💻 2. Job Seeker
* **Profile Management:** Register and maintain a seeker profile.
* **Job Search & Filtering:** Browse listings with real-time keyword search, category filtering, location filtering, and pagination.
* **One-Click Application:** Apply to open job positions with attached resume links and application details.
* **Application Tracking:** Track submitted job applications and status updates in real time.

---

## 🛠️ Tech Stack

| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Functional Components, Hooks, React Router, Axios, Context API / Redux |
| **Backend** | Django + DRF | REST APIs, Django ORM, Custom Permission Classes, Serializers |
| **Database** | PostgreSQL | Relational schema, indexes, migrations, foreign key constraints |
| **Authentication** | Simple JWT | Token-based authentication (`Bearer Tokens`) |
| **Email Service** | Django Core Mail | SMTP notification triggers (Mailtrap / Gmail SMTP) |
| **Version Control** | Git & GitHub | Feature branching strategy and Pull Request code reviews |

---

## 🗄️ System Architecture & Database Schema

The database relies on a normalized relational schema built in PostgreSQL using Django's ORM:

```text
  +------------------+         +--------------------+
  |   Custom User    | <------ |  Company Profile   |
  | (EMPLOYER/SEEKER)| (1:1)   +--------------------+
  +------------------+                   |
           |                             | (1:N)
           | (1:N)                       v
           |                   +--------------------+
           |                   |      Job Post      | <--- (N:1) --- +---------------+
           |                   +--------------------+                | Category List |
           |                             |                           +---------------+
           v                             | (1:N)
  +-------------------------------------------------+
  |                Application                      |  (Junction table for Many-to-Many
  | (APPLIED / REVIEWED / ACCEPTED / REJECTED)      |   relationship between Users & Jobs)
  +-------------------------------------------------+