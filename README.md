# 🍔 Food Delivery Time Prediction & Management System

An intelligent, full-stack food delivery platform powered by **Machine Learning and Explainable AI (SHAP)** to predict delivery times, manage orders, and analyze delivery performance.

## 🚀 Features

- **ML-Based Prediction:** Estimate delivery time using distance, traffic, weather, preparation time, and courier experience.
- **Explainable AI:** Understand the key factors influencing delivery predictions.
- **Customer Portal:** Browse restaurants, order food, track deliveries, and view prediction history.
- **Restaurant Dashboard:** Manage menus, process orders, and monitor performance.
- **Admin Dashboard:** Manage users, restaurants, orders, and platform analytics.
- **OLAP Analytics:** Analyze delivery trends using slice, dice, roll-up, and drill-down operations.
- **Secure Authentication:** Role-based access control with Supabase and PostgreSQL RLS.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Python, FastAPI, Uvicorn |
| Machine Learning | Scikit-learn, Pandas, NumPy |
| Explainable AI | SHAP |
| Database & Auth | Supabase, PostgreSQL |
| Visualization | Recharts |

## 🏗️ Architecture

```text
React + Vite Frontend
        ↓ REST API
FastAPI Backend
        ↓
ML Prediction + SHAP
        ↓
Supabase PostgreSQL
        ↓
Orders, Users & Analytics
```

## ⚙️ Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/Delivery-Time-Prediction-System.git
cd Delivery-Time-Prediction-System
```

**2. Set up the backend**

```bash
cd backend
python -m venv venv
```

Activate the environment and install dependencies:

```bash
# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Configure your backend `.env` file with the required Supabase credentials and model path, then start the API using the entry point configured in your project.

**3. Set up the frontend**

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

**4. Configure the database**

Create a Supabase project and execute the SQL migration files in the required order. Configure the frontend environment variables before running the application.

## 🧠 Machine Learning

The system uses a Scikit-learn Linear Regression pipeline to forecast delivery duration. SHAP provides feature-level explanations, while prediction intervals communicate estimated delivery ranges.

**Reported model benchmarks** *(verify against your actual evaluation results before publishing)*:

- R² Score: 0.824
- MAE: 8.12 minutes
- RMSE: 10.47 minutes

## 🔐 Security

- Supabase authentication and JWT validation
- Role-based authorization for customers, restaurants, and administrators
- PostgreSQL Row-Level Security (RLS)
- Sensitive backend credentials stored in environment variables

Never expose the Supabase service-role key in frontend code or commit secret credentials to GitHub.

## 👨‍💻 Author

**Vedant Sakpal**
**Vibhas Kadam**
**Sharvari Lohate**

Full-Stack Development | Machine Learning | Explainable AI

---

*Built to make food delivery smarter through predictive analytics, transparent AI, and efficient order management.*
