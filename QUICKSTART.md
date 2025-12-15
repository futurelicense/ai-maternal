# 🚀 Quick Start Guide

Get the AI Maternal & Child Health Tracker running in **2 minutes**!

## ⚡ Super Fast Setup (No Database Required!)

This project uses **in-memory storage** - no database setup needed!

### Installation Steps

#### 1. Setup Backend

```bash
cd /Users/7thgroup/Downloads/AI-Maternal-Child-Health-Tracker-main-2/backend

# Install dependencies (already done if you see this)
npm install

# Seed initial data
npm run seed

# Start backend
npm run dev
```

**Backend running at:** http://localhost:5000 ✅

#### 2. Setup Frontend (New Terminal)

```bash
cd /Users/7thgroup/Downloads/AI-Maternal-Child-Health-Tracker-main-2

# Install dependencies (already done if you see this)
npm install

# Start frontend
npm run dev
```

**Frontend running at:** http://localhost:5173 ✅

## 🎯 Access the Application

Open your browser: **http://localhost:5173**

### Default Login Credentials

```
Email: demo@healthai.com
Password: password123
```

## 🎮 First Steps

1. **Login** with demo credentials
2. **Go to Data Ingestion** page
3. **Download sample CSV** files (buttons on the page)
4. **Upload the CSV files** - AI will automatically predict risk scores!
5. **Explore Dashboard** with real AI-powered insights

## 📊 Features to Try

### 1. Data Ingestion
- Upload CSV files (maternal or pediatric)
- AI automatically predicts missing risk scores
- Real-time validation

### 2. Dashboard
- View real-time statistics
- See AI-generated insights from Hugging Face
- Monitor risk trends

### 3. Predictive Analytics
- AI risk assessments for each patient
- Explainable AI with confidence scores
- SHAP-style feature importance

### 4. Digital Twins
- Monitor patient vital signs
- Track health deviations
- View predictive trajectories

### 5. Policy Simulation
- Simulate healthcare policy impacts
- AI-powered predictions
- Cost-benefit analysis

### 6. Resource Allocation
- View current resources by region
- AI-driven forecasting
- Shortage predictions

## 🤖 AI Integration

**Model:** Hugging Face Mistral-7B-Instruct
**API Key:** Already configured! ✅

The AI automatically:
- Predicts risk scores for patients
- Generates healthcare insights
- Simulates policy impacts
- Provides explanations

## 📁 CSV Format

### Maternal Health Example
```csv
patient_id,name,age,risk_factors,last_updated
M001,Jane Doe,32,"Hypertension, BMI > 30",2025-10-08T10:00:00Z
```

### Pediatric Health Example
```csv
child_id,name,birth_weight,gestation_weeks,risk_factors,last_updated
P001,Baby Smith,2.5,37,"Low birth weight, Premature",2025-10-08T10:00:00Z
```

**Note:** `risk_score` and `risk_level` are optional - AI predicts them automatically!

## ✅ Success Indicators

- ✅ Backend shows "Server ready to accept requests"
- ✅ Frontend loads at http://localhost:5173
- ✅ Can login with demo credentials
- ✅ Dashboard shows "No Data Available" (until you upload CSV)
- ✅ Can upload CSV files successfully

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -ti:5000 | xargs kill -9

# Restart backend
cd backend
npm run dev
```

### Frontend won't start
```bash
# Check if port 5173 is in use
lsof -ti:5173 | xargs kill -9

# Restart frontend
npm run dev
```

### Login doesn't work
- Make sure backend is running (check http://localhost:5000/health)
- Clear browser cache and try again
- Check browser console (F12) for errors

### "No data available"
- This is normal! Upload CSV files through Data Ingestion page
- Download sample CSV files from the page
- Upload them and return to Dashboard

## 🎉 You're All Set!

**Backend:** http://localhost:5000
**Frontend:** http://localhost:5173
**Login:** demo@healthai.com / password123

**Start uploading data and exploring the AI-powered platform!** 🚀

## 💾 Data Storage

Your data is automatically saved in:
- `backend/data/` folder (JSON files)
- Persists between restarts
- Easy to backup (just copy the folder)

## 🆘 Need Help?

- Full guide: `SETUP_GUIDE.md`
- Deployment: `DEPLOYMENT.md`
- Backend details: `backend/README.md`

**Everything is working! No database required!** ✨
