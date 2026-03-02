# 📘 System Design Document (SDD)

# 📱 AttendWise -- Smart Attendance Tracker

------------------------------------------------------------------------

## 1. System Overview

**AttendWise** is a web-based attendance tracking system that enables
students to:

-   Monitor attendance percentage\
-   Predict safe absence limits\
-   Analyze subject-wise statistics

The system follows a **client-server architecture**.

### Technology Stack

**Frontend** - Vite - React - Tailwind CSS

**Backend** - Supabase Authentication - Supabase PostgreSQL - Row-Level
Security (RLS)

------------------------------------------------------------------------

# 2. High-Level Architecture

## 2.1 Architecture Style

-   Single Page Application (SPA)
-   Backend-as-a-Service (BaaS)
-   RESTful API (via Supabase)
-   Stateless frontend
-   Row-Level Security-based data isolation

------------------------------------------------------------------------

## 2.2 System Architecture (Conceptual)

Client (Browser)\
↓\
React Frontend (Vite)\
↓\
Supabase API Layer\
(Auth \| PostgreSQL \| RLS)

------------------------------------------------------------------------

# 3. Component-Level Design

## 3.1 Frontend Architecture

### Folder Structure

src/\
├── components/\
├── pages/\
├── hooks/\
├── services/\
├── context/\
├── utils/\
└── App.jsx

### Core Pages

  Page         Responsibility
  ------------ -----------------------------------
  Login        User authentication
  Sign Up      Registration
  Dashboard    Overview metrics & analytics
  Timetable    Manage subjects & schedule
  Attendance   Mark attendance
  Reports      Subject & monthly analytics
  Profile      Required percentage configuration

------------------------------------------------------------------------

# 4. Database Design

## Tables

### Profiles

-   id (UUID, PK)
-   name (TEXT)
-   required_percentage (INTEGER)

### Subjects

-   id (UUID, PK)
-   user_id (UUID, FK)
-   subject_name (TEXT)

### Timetable

-   id (UUID, PK)
-   user_id (UUID)
-   subject_id (UUID)
-   day_of_week (INTEGER 0--6)
-   start_time (TIME)
-   end_time (TIME)

### Attendance

-   id (UUID, PK)
-   user_id (UUID)
-   subject_id (UUID)
-   date (DATE)
-   status (ENUM: present/absent)

------------------------------------------------------------------------

# 5. Core Logic

## Attendance Percentage

Attendance % = (Attended Periods / Total Conducted Periods) × 100

## Safe Absence

Max Allowed Absents = T − (R/100 × T)

Safe Leaves Left = Max Allowed Absents − Current Absents

------------------------------------------------------------------------

# 6. Security

-   Supabase Authentication
-   Row-Level Security (RLS)
-   JWT-based sessions
-   Encrypted password storage

------------------------------------------------------------------------

# 7. Performance & Scalability

-   Indexed database queries
-   Aggregate SQL calculations
-   Lazy loading for reports
-   Designed for 10,000+ users

------------------------------------------------------------------------

# 8. Deployment

Frontend: Vercel / Netlify\
Backend: Supabase Cloud\
CI/CD: GitHub auto-deploy

------------------------------------------------------------------------

# 9. Conclusion

The AttendWise System Design satisfies all functional and non-functional
requirements defined in the PRD and SRS while ensuring scalability,
security, and performance.
