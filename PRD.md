# Product Requirements Document (PRD)

## Food Delivery Time Prediction System

**Document Version:** 1.0
**Project Type:** Machine Learning + Full-Stack Web Application
**Database:** Supabase PostgreSQL
**Authentication:** Supabase Auth
**Frontend:** React + Vite
**Backend:** FastAPI
**ML Model:** Existing trained `.pkl` model
**Dataset:** Food Delivery Times Dataset

---

# 1. Product Overview

The **Food Delivery Time Prediction System** is a full-stack web application that uses a trained Machine Learning model to predict the estimated delivery time of a food order.

The system provides two major interfaces:

### User Application

Users can:

* Register and log in
* Enter food delivery information
* Simulate/predict delivery time
* View prediction results
* View prediction history
* View personal prediction statistics
* Manage their profile

### Admin Application

Administrators can:

* Monitor system activity
* View users
* View all predictions
* Analyze delivery patterns
* View dashboards and charts
* Perform OLAP operations
* Analyze prediction trends
* View model information

The system must use the existing trained `.pkl` Machine Learning model.

**The model must not be retrained by the web application.**

---

# 2. Problem Statement

Food delivery time depends on multiple factors such as:

* Distance
* Weather
* Traffic
* Time of day
* Vehicle type
* Food preparation time
* Courier experience

Customers need an estimated delivery time before or during an order.

The proposed system uses Machine Learning to estimate delivery time from these factors and provides an analytics platform for administrators to understand delivery patterns.

---

# 3. Objectives

The system should:

1. Predict food delivery time using the trained ML model.
2. Provide an easy-to-use prediction simulator.
3. Store prediction history securely.
4. Provide user-specific prediction history.
5. Provide administrators with system-level analytics.
6. Implement OLAP operations.
7. Visualize delivery patterns using charts.
8. Use Supabase for authentication and database management.
9. Provide role-based access.
10. Create a professional production-style interface.

---

# 4. Dataset Specification

The uploaded dataset contains:

**1,000 records and 9 columns.**

Dataset columns:

| Column                   | Type        | Description                   |
| ------------------------ | ----------- | ----------------------------- |
| `Order_ID`               | Integer     | Unique order identifier       |
| `Distance_km`            | Numeric     | Delivery distance             |
| `Weather`                | Categorical | Weather condition             |
| `Traffic_Level`          | Categorical | Traffic condition             |
| `Time_of_Day`            | Categorical | Order time period             |
| `Vehicle_Type`           | Categorical | Delivery vehicle              |
| `Preparation_Time_min`   | Numeric     | Food preparation time         |
| `Courier_Experience_yrs` | Numeric     | Courier experience            |
| `Delivery_Time_min`      | Numeric     | Actual delivery time / target |

---

# 5. Machine Learning Specification

## Target Variable

```text
Delivery_Time_min
```

The model predicts:

```text
Estimated Delivery Time in minutes
```

## Input Features

The prediction simulator must contain exactly these seven logical inputs:

```text
Distance_km
Weather
Traffic_Level
Time_of_Day
Vehicle_Type
Preparation_Time_min
Courier_Experience_yrs
```

## Identifier

`Order_ID` is an identifier and should not be used as a predictive feature unless the existing trained model explicitly requires it.

---

# 6. Prediction Simulator

The user-facing prediction simulator should provide:

### Input Form

```text
Distance
Weather
Traffic Level
Time of Day
Vehicle Type
Preparation Time
Courier Experience
```

### Example UI

```text
Food Delivery Time Predictor

Distance
[ 8.5 km ]

Weather
[ Clear ▼ ]

Traffic Level
[ High ▼ ]

Time of Day
[ Evening ▼ ]

Vehicle Type
[ Motorcycle ▼ ]

Preparation Time
[ 15 minutes ]

Courier Experience
[ 2.5 years ]

[ Predict Delivery Time ]
```

---

# 7. Prediction Result

After prediction, display:

```text
Estimated Delivery Time

32 minutes
```

Also display:

* Input summary
* Prediction timestamp
* Prediction category
* Optional confidence/information if supported by the ML model

### Prediction Categories

The application may classify the predicted time into categories for UI purposes.

Example:

```text
Fast
Normal
Delayed
```

The category thresholds must be configurable and documented rather than arbitrarily embedded throughout the frontend.

The raw predicted time remains the primary ML output.

---

# 8. Important ML Integration Requirement

The existing `.pkl` file must be inspected before implementing the prediction API.

The backend must determine:

* Model type
* Expected features
* Feature order
* Preprocessing
* Encoders
* Scalers
* Pipeline/ColumnTransformer
* Expected input format
* Output format

If the `.pkl` already contains preprocessing through a Pipeline, use that pipeline directly.

Do not duplicate or alter preprocessing unnecessarily.

---

# 9. ML Architecture

Create:

```text
backend/
└── app/
    └── ml/
        ├── model_loader.py
        └── predictor.py
```

### `model_loader.py`

Responsibilities:

* Locate model
* Load `.pkl`
* Validate model
* Load model once
* Handle model-loading errors

### `predictor.py`

Responsibilities:

* Validate input
* Prepare input
* Call model
* Return prediction
* Handle prediction errors

---

# 10. Application Architecture

```text
                         ┌───────────────────┐
                         │       User        │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   React Frontend  │
                         └─────────┬─────────┘
                                   │
                              REST API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ FastAPI Backend   │
                         └───────┬─────┬─────┘
                                 │     │
                         ┌───────┘     └────────┐
                         ▼                      ▼
                  ┌─────────────┐       ┌──────────────┐
                  │  ML Model   │       │   Supabase   │
                  │   .pkl      │       │ PostgreSQL   │
                  └─────────────┘       └──────┬───────┘
                                               │
                                               ▼
                                      Analytics / OLAP
                                               │
                                               ▼
                                      Admin Dashboard
```

---

# 11. Technology Stack

## Frontend

```text
React
Vite
Tailwind CSS
React Router
Axios
Recharts
Lucide React
```

## Backend

```text
Python
FastAPI
Uvicorn
pandas
NumPy
scikit-learn
joblib
Pydantic
```

## Database

```text
Supabase
PostgreSQL
Supabase Auth
Supabase Row Level Security
```

---

# 12. User Roles

The system contains two roles:

```text
USER
ADMIN
```

---

# 13. User Permissions

A normal user can:

* Register
* Login
* Logout
* View dashboard
* Make prediction
* View own predictions
* View own statistics
* Update profile

A normal user cannot:

* Access admin dashboard
* View other users
* View all predictions
* Perform system analytics
* Perform OLAP analysis
* Modify model information

---

# 14. Admin Permissions

An admin can:

* View admin dashboard
* View all users
* View all predictions
* View analytics
* Perform OLAP analysis
* View model information
* View system statistics

Admin access must be protected both in the frontend and backend.

---

# 15. Authentication

Use **Supabase Authentication**.

Authentication method:

```text
Email + Password
```

Required features:

* Registration
* Login
* Logout
* Forgot password
* Password reset
* Session persistence
* Current-user detection

Do not manually store user passwords.

---

# 16. Supabase Database

Minimum database tables:

```text
profiles
predictions
```

Optional:

```text
model_metadata
```

---

# 17. Profiles Table

Table:

```text
profiles
```

Recommended schema:

```text
id                uuid PRIMARY KEY
full_name         text
email             text
role              text
avatar_url        text NULL
created_at        timestamptz
updated_at        timestamptz
```

Relationship:

```text
profiles.id
     ↓
auth.users.id
```

Role values:

```text
user
admin
```

Default role:

```text
user
```

A public registration request must never be allowed to arbitrarily assign itself the `admin` role.

---

# 18. Predictions Table

Use a structured prediction table because the dataset features are known.

Table:

```text
predictions
```

Recommended schema:

```text
id                         uuid PRIMARY KEY
user_id                    uuid
order_id                   bigint
distance_km                numeric
weather                    text
traffic_level              text
time_of_day                text
vehicle_type               text
preparation_time_min       numeric
courier_experience_yrs     numeric
predicted_delivery_time_min numeric
prediction_category        text
created_at                 timestamptz
```

---

# 19. Actual Delivery Time

The simulator initially only knows the model prediction.

Therefore:

```text
predicted_delivery_time_min
```

must be stored.

Do not treat the prediction as the actual delivery time.

If actual delivery data becomes available later, add:

```text
actual_delivery_time_min
```

This will allow:

* Actual vs predicted comparison
* MAE
* RMSE
* Error distribution
* Model monitoring

---

# 20. Prediction Database Flow

```text
User
 ↓
Prediction Form
 ↓
FastAPI
 ↓
ML Model
 ↓
Prediction Result
 ↓
Supabase
 ↓
predictions table
```

Each successful prediction must create one prediction record.

---

# 21. Prediction API

## Create Prediction

```http
POST /api/predictions/predict
```

Request:

```json
{
  "distance_km": 8.5,
  "weather": "Clear",
  "traffic_level": "High",
  "time_of_day": "Evening",
  "vehicle_type": "Motorcycle",
  "preparation_time_min": 15,
  "courier_experience_yrs": 2.5
}
```

The exact categorical values must be derived from the dataset/model.

Response:

```json
{
  "success": true,
  "prediction": {
    "predicted_delivery_time_min": 32.5,
    "prediction_category": "Normal"
  }
}
```

The backend must save the prediction to Supabase.

---

# 22. Prediction History API

```http
GET /api/predictions/history
```

Users receive only their own prediction history.

Response:

```json
{
  "predictions": []
}
```

Pagination should be implemented when the number of records becomes large.

---

# 23. User Dashboard

The User Dashboard should show:

### KPI Cards

```text
Total Predictions
Average Predicted Time
Fastest Prediction
Latest Prediction
```

### Recent Predictions

Display:

```text
Date
Distance
Traffic
Weather
Vehicle
Predicted Time
Category
```

---

# 24. User Prediction History

Provide:

* Search
* Filter
* Sort
* Pagination

Filters:

```text
Date
Weather
Traffic
Vehicle Type
Prediction Category
```

---

# 25. User Profile

Display:

```text
Full Name
Email
Role
Account Created
Total Predictions
```

Allow users to update appropriate profile information.

Email/password changes should use Supabase Auth mechanisms.

---

# 26. Admin Dashboard

The admin dashboard is the main monitoring interface.

## KPI Cards

Display:

```text
Total Users
Total Predictions
Average Predicted Delivery Time
Minimum Predicted Time
Maximum Predicted Time
Delayed Predictions
Today's Predictions
```

All statistics must come from Supabase.

No hardcoded production statistics.

---

# 27. Admin Dashboard Charts

Implement:

### Chart 1 — Prediction Trend

X-axis:

```text
Date
```

Y-axis:

```text
Number of Predictions
```

### Chart 2 — Average Delivery Time

X-axis:

```text
Date
```

Y-axis:

```text
Average Predicted Time
```

### Chart 3 — Weather Analysis

```text
Weather → Average Delivery Time
```

### Chart 4 — Traffic Analysis

```text
Traffic → Average Delivery Time
```

### Chart 5 — Vehicle Analysis

```text
Vehicle Type → Average Delivery Time
```

### Chart 6 — Time of Day

```text
Time of Day → Average Delivery Time
```

### Chart 7 — Distance Analysis

```text
Distance → Predicted Delivery Time
```

---

# 28. Analytics Module

Create:

```text
/admin/analytics
```

The admin can filter analytics using:

```text
Date Range
Weather
Traffic Level
Time of Day
Vehicle Type
Distance Range
Prediction Category
```

Display:

```text
Prediction Count
Average Delivery Time
Minimum Delivery Time
Maximum Delivery Time
Average Distance
Average Preparation Time
Average Courier Experience
```

---

# 29. OLAP Module

Create:

```text
/admin/olap
```

The application must demonstrate five OLAP operations:

```text
Roll-Up
Drill-Down
Slice
Dice
Pivot
```

---

# 30. OLAP Dimensions

Use dimensions from the actual dataset/application.

## Time

Derived from:

```text
created_at
```

Hierarchy:

```text
Year
 ↓
Month
 ↓
Day
```

## Weather

```text
Weather
```

## Traffic

```text
Traffic_Level
```

## Time of Day

```text
Time_of_Day
```

## Vehicle

```text
Vehicle_Type
```

---

# 31. OLAP Measures

The system should support:

```text
Prediction Count
Average Predicted Delivery Time
Minimum Predicted Delivery Time
Maximum Predicted Delivery Time
Average Distance
Average Preparation Time
Average Courier Experience
```

---

# 32. OLAP Roll-Up

Example:

```text
Day
 ↓
Month
 ↓
Year
```

The system aggregates detailed records into higher-level summaries.

Example:

```text
October 1
October 2
October 3

      ↓

October 2026
```

---

# 33. OLAP Drill-Down

Reverse of roll-up:

```text
Year
 ↓
Month
 ↓
Day
```

Example:

```text
2026
 ↓
October
 ↓
October 2
```

---

# 34. OLAP Slice

A single dimension is selected.

Example:

```text
Traffic Level = High
```

The dashboard then displays analytics only for high-traffic predictions.

---

# 35. OLAP Dice

Multiple dimensions are selected.

Example:

```text
Weather = Rainy
Traffic = High
Vehicle Type = Motorcycle
```

Only records satisfying all selected conditions are analyzed.

---

# 36. OLAP Pivot

Allow the administrator to change the dimensions displayed on rows and columns.

Example:

```text
Rows:
Weather

Columns:
Traffic Level

Measure:
Average Delivery Time
```

The admin should be able to change the selected dimensions.

---

# 37. OLAP Result Table

Example structure:

| Weather | Traffic | Prediction Count | Avg Delivery |
| ------- | ------- | ---------------: | -----------: |
| Clear   | Low     |              120 |       25 min |
| Clear   | High    |               95 |       35 min |
| Rainy   | Low     |               80 |       31 min |
| Rainy   | High    |              110 |       44 min |

Values must be calculated dynamically.

---

# 38. Admin Users Page

Route:

```text
/admin/users
```

Display:

```text
Name
Email
Role
Created Date
Prediction Count
Last Prediction
```

Features:

* Search
* Filter
* Pagination
* User details

Never display passwords.

---

# 39. Admin Predictions Page

Route:

```text
/admin/predictions
```

Display:

```text
Prediction ID
User
Order ID
Distance
Weather
Traffic
Time of Day
Vehicle
Preparation Time
Courier Experience
Predicted Time
Category
Created At
```

Features:

* Search
* Filter
* Sorting
* Pagination
* Details view

---

# 40. Model Information Page

Route:

```text
/admin/model
```

Display available information about:

```text
Model Name
Model Type
Model Version
Target Variable
Input Features
Training Dataset
Model Status
```

If model evaluation metrics are available, display:

```text
MAE
MSE
RMSE
R²
```

Do not invent model metrics.

---

# 41. Frontend Routes

## Public

```text
/
 /login
 /register
 /forgot-password
```

## User

```text
/user/dashboard
/user/predict
/user/history
/user/profile
```

## Admin

```text
/admin/dashboard
/admin/users
/admin/predictions
/admin/analytics
/admin/olap
/admin/model
/admin/settings
```

---

# 42. UI/UX Requirements

The interface must look like a professional production SaaS application.

## General Design

Use:

* Clean typography
* Consistent spacing
* Thin borders
* Subtle shadows
* Responsive layout
* Professional navigation
* Clear hierarchy
* Accessible forms
* Good loading states
* Empty states
* Error states
* Toast notifications

Avoid:

* Excessive gradients
* Excessive animations
* Huge headings
* Excessive rounded cards
* Generic AI-generated dashboard appearance
* Unnecessary decorative elements

---

# 43. User UI Style

The User application should prioritize simplicity.

Main focus:

```text
Enter delivery information
        ↓
Predict
        ↓
View estimated delivery time
```

The prediction result should be visually prominent.

---

# 44. Admin UI Style

The Admin application should be information-dense.

Use:

```text
Sidebar
Top navigation
KPI cards
Charts
Tables
Filters
Analytics controls
OLAP controls
```

---

# 45. Supabase Row Level Security

RLS must be enabled.

## Profiles

Users:

```text
SELECT own profile
UPDATE own profile
```

Admins:

```text
SELECT profiles
```

## Predictions

Users:

```text
INSERT own prediction
SELECT own predictions
```

Admins:

```text
SELECT all predictions
```

Users must never be able to access another user's predictions.

---

# 46. Security

Implement:

* Supabase Auth
* Row Level Security
* Role-based authorization
* Backend authorization
* Input validation
* CORS
* Environment variables
* Secure API handling

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the frontend.

---

# 47. Environment Variables

## Backend

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
MODEL_PATH=
```

## Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```

Never commit `.env` files containing secrets.

---

# 48. Backend Structure

Recommended:

```text
backend/
│
├── app/
│   ├── api/
│   │   ├── auth.py
│   │   ├── predictions.py
│   │   ├── admin.py
│   │   ├── analytics.py
│   │   └── olap.py
│   │
│   ├── ml/
│   │   ├── model_loader.py
│   │   └── predictor.py
│   │
│   ├── schemas/
│   │   ├── prediction.py
│   │   └── user.py
│   │
│   ├── services/
│   │   ├── prediction_service.py
│   │   ├── analytics_service.py
│   │   └── olap_service.py
│   │
│   ├── database/
│   │   └── supabase.py
│   │
│   └── main.py
│
├── model/
│   └── delivery_time_model.pkl
│
├── requirements.txt
└── .env
```

---

# 49. Frontend Structure

```text
frontend/
│
├── src/
│   ├── components/
│   ├── layouts/
│   │   ├── UserLayout.jsx
│   │   └── AdminLayout.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── user/
│   │   └── admin/
│   │
│   ├── charts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── .env
```

---

# 50. Database Indexes

Create indexes for frequently queried fields.

Minimum:

```text
predictions.user_id
predictions.created_at
predictions.weather
predictions.traffic_level
predictions.vehicle_type
predictions.time_of_day
```

Additional indexes can be added after performance testing.

---

# 51. API Architecture

```text
/api
│
├── /predictions
│   ├── POST /predict
│   └── GET /history
│
├── /admin
│   ├── GET /dashboard
│   ├── GET /users
│   ├── GET /predictions
│   └── GET /model
│
├── /analytics
│   └── GET /
│
└── /olap
    └── GET /
```

---

# 52. Error Handling

Frontend must handle:

```text
Loading
Success
Validation Error
Authentication Error
Authorization Error
Network Error
Prediction Error
Empty Data
```

Backend must handle:

```text
Invalid input
Model loading error
Model prediction error
Supabase error
Authentication failure
Authorization failure
```

Return meaningful error messages.

---

# 53. Performance Requirements

The system should:

* Load the ML model once.
* Avoid loading the entire prediction dataset into the frontend.
* Use pagination.
* Use database aggregation for analytics where practical.
* Use indexes.
* Avoid unnecessary API requests.
* Cache reusable information when appropriate.

---

# 54. Testing Requirements

## ML

Test:

```text
Model loading
Valid prediction
Invalid input
Missing feature
Incorrect data type
```

## Authentication

Test:

```text
Register
Login
Logout
Unauthorized access
```

## Authorization

Test:

```text
User → User routes
User → Admin routes = blocked
Admin → Admin routes
```

## Database

Test:

```text
Prediction insertion
User prediction isolation
Admin prediction access
RLS
```

## Analytics

Test:

```text
Filters
Aggregation
OLAP operations
```

---

# 55. Deployment Requirements

The application should be deployable as:

```text
Frontend → Vercel
Backend → Render / Railway / similar Python host
Database/Auth → Supabase
```

The `.pkl` file must be included in the backend deployment or retrieved through a secure model-storage mechanism.

---

# 56. Development Phases

## Phase 1 — Model Inspection

Inspect:

```text
Food_Delivery_Times(1).csv
delivery_time_model.pkl
```

Determine:

* Model type
* Features
* Preprocessing
* Target
* Output

---

## Phase 2 — Supabase Setup

Create:

```text
Supabase Project
Authentication
profiles
predictions
RLS
Indexes
```

---

## Phase 3 — Backend

Implement:

```text
FastAPI
Supabase connection
Model loading
Prediction API
Authentication verification
```

---

## Phase 4 — User Application

Implement:

```text
Landing Page
Login
Register
Dashboard
Prediction Simulator
History
Profile
```

---

## Phase 5 — Admin Application

Implement:

```text
Dashboard
Users
Predictions
Analytics
Model Information
```

---

## Phase 6 — OLAP

Implement:

```text
Roll-Up
Drill-Down
Slice
Dice
Pivot
```

---

## Phase 7 — Testing

Test the entire application.

---

## Phase 8 — Deployment

Deploy:

```text
Frontend
Backend
Supabase
```

---

# 57. Acceptance Criteria

The project is complete when all of the following work:

### Authentication

* [ ] User registration works.
* [ ] User login works.
* [ ] Logout works.
* [ ] Password reset works.
* [ ] Admin authentication works.
* [ ] Protected routes work.

### User

* [ ] User dashboard works.
* [ ] Prediction simulator works.
* [ ] Existing `.pkl` model is used.
* [ ] Prediction result is displayed.
* [ ] Prediction is stored in Supabase.
* [ ] User can see prediction history.
* [ ] User can only see their own predictions.
* [ ] Profile page works.

### Admin

* [ ] Admin dashboard works.
* [ ] KPI cards use real data.
* [ ] Charts use real Supabase data.
* [ ] Users page works.
* [ ] Predictions page works.
* [ ] Analytics works.
* [ ] Model information page works.

### OLAP

* [ ] Roll-Up works.
* [ ] Drill-Down works.
* [ ] Slice works.
* [ ] Dice works.
* [ ] Pivot works.

### Security

* [ ] RLS is enabled.
* [ ] User data is isolated.
* [ ] Admin routes are protected.
* [ ] Service-role key is not exposed.
* [ ] Secrets are stored in environment variables.

### Quality

* [ ] Responsive UI.
* [ ] Loading states.
* [ ] Error states.
* [ ] Empty states.
* [ ] Form validation.
* [ ] No hardcoded production analytics.
* [ ] No fake prediction results.

---

# 58. Final Antigravity Instructions

Antigravity must follow these rules:

1. Inspect the `.pkl` model before implementing prediction logic.
2. Inspect the original CSV before creating the final database schema.
3. Do not invent ML features.
4. Do not retrain the model.
5. Do not change model preprocessing.
6. Use Supabase as the database.
7. Use Supabase Auth.
8. Use Supabase RLS.
9. Keep the ML model on the backend.
10. Never expose the Supabase service-role key.
11. Store every successful prediction.
12. Use real database data for analytics.
13. Do not create fake dashboard numbers.
14. Implement actual OLAP operations.
15. Keep User and Admin interfaces separate.
16. Protect Admin APIs on the backend.
17. Validate all prediction inputs.
18. Implement loading, error and empty states.
19. Test each module before moving to the next phase.
20. Do not move to the next phase if the current phase is broken.

---

# 59. Final Product Structure

The final product should provide:

```text
                  FOOD DELIVERY
                 TIME PREDICTION
                      SYSTEM
                         |
          ┌──────────────┴──────────────┐
          │                             │
        USER                           ADMIN
          │                             │
    ┌─────┴─────┐              ┌────────┴────────┐
    │            │              │                 │
 Prediction   History       Dashboard         Analytics
    │                           │                 │
    │                           │                 │
    ▼                           ▼                 ▼
 ML Prediction              Charts             OLAP
    │                           │                 │
    └──────────────┬────────────┴─────────────────┘
                   │
                   ▼
                Supabase
                   │
          ┌────────┴────────┐
          │                 │
       Profiles         Predictions
```

---

# 60. Success Definition

The final application should provide a complete workflow:

```text
User registers
      ↓
User logs in
      ↓
User opens Prediction Simulator
      ↓
Enters delivery information
      ↓
FastAPI receives input
      ↓
Existing .pkl model predicts delivery time
      ↓
Prediction displayed to user
      ↓
Prediction stored in Supabase
      ↓
User can view prediction history
      ↓
Admin sees updated statistics
      ↓
Admin analyzes delivery patterns
      ↓
Admin performs OLAP operations
```

The final result should be a **working full-stack Machine Learning application**, not merely a frontend dashboard or ML demo.
