# 📘 Software Requirements Specification (SRS)

# 📱 AttendWise -- Smart Attendance Tracker

------------------------------------------------------------------------

## 1. Introduction

### 1.1 Purpose

This document provides a detailed description of the requirements for
the AttendWise -- Smart Attendance Tracker application. It is intended
for developers, project guides, stakeholders, and testers.

### 1.2 Scope

AttendWise is a web-based application that helps students track
attendance, calculate attendance percentage, and determine safe absence
limits. The system provides real-time tracking and analytics to improve
attendance management.

### 1.3 Definitions, Acronyms, and Abbreviations

-   SRS: Software Requirements Specification
-   UI: User Interface
-   RLS: Row-Level Security
-   DB: Database

------------------------------------------------------------------------

## 2. Overall Description

### 2.1 Product Perspective

The system is a standalone web application built using: - Frontend:
Vite + React - Backend: Supabase - Database: PostgreSQL (Supabase)

### 2.2 Product Functions

The system shall: - Allow users to register and log in - Allow timetable
setup - Allow daily attendance marking - Calculate attendance
percentage - Predict safe absence limits - Display reports and analytics

### 2.3 User Classes and Characteristics

-   Students (Primary Users)
    -   Basic knowledge of web/mobile applications
    -   Need to monitor academic attendance

### 2.4 Operating Environment

-   Web browser (Chrome, Edge, Firefox)
-   Internet connection required
-   Hosted on cloud platform

### 2.5 Constraints

-   Requires internet connectivity
-   Dependent on Supabase service availability

### 2.6 Assumptions and Dependencies

-   Students manually mark attendance
-   Required attendance percentage is defined (default 75%)

------------------------------------------------------------------------

## 3. Functional Requirements

### 3.1 User Authentication

-   FR1: User shall be able to register using email and password.
-   FR2: User shall be able to log in securely.
-   FR3: User shall be able to log out.

### 3.2 Profile Management

-   FR4: User shall set required attendance percentage.
-   FR5: User shall edit profile details.

### 3.3 Subject Management

-   FR6: User shall add subjects.
-   FR7: User shall edit/delete subjects.

### 3.4 Timetable Management

-   FR8: User shall add working days.
-   FR9: User shall define period timings.
-   FR10: User shall edit/delete timetable entries.

### 3.5 Attendance Tracking

-   FR11: User shall mark daily attendance (Present/Absent).
-   FR12: User shall edit previous attendance records.
-   FR13: System shall automatically store attendance records.

### 3.6 Attendance Calculation

-   FR14: System shall calculate attendance percentage automatically.
-   FR15: System shall calculate maximum safe absences.
-   FR16: System shall show warning if attendance falls below required
    percentage.

### 3.7 Reports

-   FR17: System shall display subject-wise attendance.
-   FR18: System shall display overall attendance statistics.

------------------------------------------------------------------------

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

-   Dashboard shall load within 2 seconds.
-   Attendance calculations shall be real-time.

### 4.2 Security Requirements

-   Secure authentication system.
-   Data isolation using Row-Level Security.
-   Encrypted password storage.

### 4.3 Usability Requirements

-   Simple and intuitive UI.
-   Mobile-responsive design.

### 4.4 Reliability Requirements

-   System shall maintain 99% uptime.
-   No data loss during session.

### 4.5 Scalability Requirements

-   System shall support 10,000+ concurrent users.

------------------------------------------------------------------------

## 5. External Interface Requirements

### 5.1 User Interface

-   Login Page
-   Sign Up Page
-   Dashboard
-   Timetable Setup Page
-   Attendance Marking Page
-   Reports Page

### 5.2 Hardware Interface

-   Standard computer or smartphone.

### 5.3 Software Interface

-   Supabase Authentication
-   Supabase PostgreSQL Database

------------------------------------------------------------------------

## 6. Database Requirements

### Tables

#### Profiles

-   id (UUID)
-   name
-   required_percentage

#### Subjects

-   id (UUID)
-   user_id (UUID)
-   subject_name

#### Timetable

-   id (UUID)
-   user_id (UUID)
-   subject_id (UUID)
-   day_of_week
-   start_time
-   end_time

#### Attendance

-   id (UUID)
-   user_id (UUID)
-   subject_id (UUID)
-   date
-   status (present/absent)

------------------------------------------------------------------------

## 7. System Models

### 7.1 Attendance Formula

Attendance % = (Attended Periods / Total Periods) × 100

### 7.2 Safe Absence Formula

Max Absents Allowed = Total Periods − (Required% × Total Periods)

------------------------------------------------------------------------

## 8. Future Enhancements

-   Mobile application version
-   Faculty dashboard
-   AI-based attendance prediction
-   QR code-based attendance
-   Push notifications

------------------------------------------------------------------------

## 9. Conclusion

This SRS document defines the functional and non-functional requirements
for the AttendWise application. The system is designed to provide
accurate attendance tracking, real-time analytics, and predictive
insights to help students maintain required academic attendance
standards.
