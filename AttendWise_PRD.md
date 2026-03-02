# 📄 Product Requirements Document (PRD)

# 📱 AttendWise -- Smart Attendance Tracker

------------------------------------------------------------------------

## 1. Product Overview

**AttendWise** is a web-based attendance tracking application designed
to help students monitor their attendance percentage, calculate safe
absence limits, and manage their academic schedule efficiently.

The application will allow students to: - Track daily attendance - View
real-time attendance percentage - Calculate how many periods they can
miss - Analyze subject-wise attendance

------------------------------------------------------------------------

## 2. Problem Statement

Students often struggle with: - Not knowing their exact attendance
percentage - Manually calculating safe absence limits - Last-minute
attendance shortages before exams - Lack of structured tracking system

This project aims to provide an automated, reliable, and easy-to-use
solution.

------------------------------------------------------------------------

## 3. Objectives

-   Develop a secure web-based attendance tracker
-   Provide real-time attendance calculation
-   Show safe absence predictions
-   Improve attendance awareness among students

------------------------------------------------------------------------

## 4. Target Users

-   College students
-   School students
-   Universities with minimum attendance requirements (e.g., 75%)

------------------------------------------------------------------------

## 5. Tech Stack

### Frontend

-   Vite
-   React
-   Tailwind CSS

### Backend

-   Supabase Authentication
-   Supabase PostgreSQL Database
-   Row-Level Security (RLS)

------------------------------------------------------------------------

## 6. Core Features

### 6.1 User Authentication

-   Sign Up
-   Login
-   Secure session management

### 6.2 Timetable Setup

-   Add subjects
-   Add working days
-   Set period timings

### 6.3 Daily Attendance Tracking

-   Mark present/absent
-   Edit attendance entries

### 6.4 Dashboard

-   Total periods conducted
-   Periods attended
-   Periods missed
-   Attendance percentage
-   Required attendance percentage
-   Safe absence calculation

### 6.5 Reports

-   Subject-wise attendance
-   Monthly summary
-   Visual analytics charts

------------------------------------------------------------------------

## 7. Functional Requirements

-   User registration and login
-   Add/edit/delete subjects
-   Add timetable entries
-   Mark attendance daily
-   Auto-calculate attendance percentage
-   Predict safe absence limit

------------------------------------------------------------------------

## 8. Non-Functional Requirements

-   Secure authentication
-   Fast loading time (\<2 seconds)
-   Mobile responsive design
-   Scalable architecture
-   Reliable database storage

------------------------------------------------------------------------

## 9. Database Structure

### Tables

**Profiles** - id (UUID) - name - required_percentage

**Subjects** - id (UUID) - user_id (UUID) - subject_name

**Timetable** - id (UUID) - user_id (UUID) - subject_id (UUID) -
day_of_week - start_time - end_time

**Attendance** - id (UUID) - user_id (UUID) - subject_id (UUID) - date -
status (present/absent)

------------------------------------------------------------------------

## 10. Calculation Logic

### Attendance Percentage

Attendance % = (Attended Periods / Total Periods) × 100

### Safe Absence Formula

Max Absents Allowed = Total Periods − (Required% × Total Periods)

------------------------------------------------------------------------

## 11. Development Phases

1.  Requirement Analysis
2.  UI/UX Design
3.  Frontend Development
4.  Backend Integration
5.  Testing
6.  Deployment

Estimated Duration: 6 Weeks

------------------------------------------------------------------------

## 12. Future Enhancements

-   Mobile app version
-   Faculty dashboard
-   AI-based attendance prediction
-   QR code integration
-   Push notifications

------------------------------------------------------------------------

## 13. Conclusion

AttendWise will provide a smart, efficient, and scalable attendance
tracking system using modern technologies like React and Supabase. The
application will help students manage their academic attendance
confidently and avoid last-minute shortages.
