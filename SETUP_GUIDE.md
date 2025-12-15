# AI Maternal & Child Health Tracker - Complete Setup Guide

This guide will help you set up the complete production-ready system with real Hugging Face AI integration.

## 🎯 Overview

This is a full-stack application consisting of:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: In-Memory Store with JSON file persistence (no external database needed)
- **AI**: Hugging Face Inference API (Mistral-7B-Instruct)
- **Data Entry**: CSV upload (required) or optional demo data pre-loading

## 📋 Prerequisites

- Node.js 18+ installed
- Hugging Face API key (get from https://huggingface.co/settings/tokens)

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# The .env file is already configured with your Hugging Face API key
# Verify the configuration in backend/.env

# (Optional) To load demo data on startup, set LOAD_DEMO_DATA=true in .env
# By default, the system starts empty and requires CSV upload

# Start the backend server
npm run dev
```

The backend API will be running at `http://localhost:5000`

**Default Demo User (Auto-created on startup):**
- Email: `demo@healthai.com`
- Password: `password123`

**Data Storage:**
- The system uses an in-memory database with JSON file persistence
- Data is stored in `backend/data/` directory
- No external database required

### 2. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd ../

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

## 🔐 Authentication

The system now uses **real JWT-based authentication**:

1. Login with the demo credentials:
   - Email: `demo@healthai.com`
   - Password: `password123`

2. The JWT token is stored in localStorage and automatically included in all API requests

## 📊 Using the Application

### Step 1: Login
Navigate to `http://localhost:5173` and login with the demo credentials.

### Step 2: Upload Patient Data (Required)

⚠️ **Important**: The system starts with an empty database. You must upload CSV data before using the dashboard and analytics features.

1. After login, go to the **Data Ingestion** page
2. Download the sample CSV files:
   - **Maternal Sample CSV** - for maternal health data
   - **Pediatric Sample CSV** - for pediatric health data
3. Upload these CSV files (or your own data following the same format)
4. The backend will:
   - Validate the data structure
   - Use Hugging Face AI to predict risk scores (if not provided in CSV)
   - Store data in the JSON-based memory store
   - Return processing results with success/error counts

**Note**: If you prefer to start with demo data pre-loaded:
- Set `LOAD_DEMO_DATA=true` in `backend/.env`
- Restart the backend server
- This will load 5 maternal and 5 pediatric patient records automatically

### Step 3: Explore Features

Once data is uploaded, you can access:

#### Dashboard
- View real-time statistics from the database
- See AI-generated insights using Hugging Face models
- Monitor risk trends and patient distributions

#### Predictive Analytics
- AI-powered risk assessments for each patient
- SHAP feature importance explanations
- Model performance metrics
- Predictive trajectories

#### Digital Twins
- Real-time patient monitoring
- Virtual health simulations
- Deviation detection and alerts
- Vital signs tracking

#### Policy Simulation
- Simulate healthcare policy impacts using AI
- Cost-benefit analysis
- Regional impact predictions
- Equity assessments

#### Resource Allocation
- AI-driven resource forecasting
- Regional distribution analysis
- Shortage predictions
- Implementation planning

#### Reports
- Generate comprehensive reports
- Export data in multiple formats
- Schedule automated reports

## 🤖 Hugging Face AI Integration

The system uses the **Mistral-7B-Instruct** model for:

1. **Risk Prediction**: Analyzes patient data to predict risk scores
2. **Insight Generation**: Creates actionable healthcare insights
3. **Policy Simulation**: Simulates policy impact predictions
4. **Explanations**: Provides interpretable AI reasoning

**API Key**: Set in `backend/.env` file (get your key from https://huggingface.co/settings/tokens)

All AI predictions are:
- Stored in the database
- Include confidence scores
- Provide human-readable explanations
- Backed by fallback heuristics if the API is unavailable

## 📁 CSV Data Format

### Maternal Health Data Format
```csv
patient_id,name,age,risk_factors,risk_score,risk_level,last_updated
M001,Jane Doe,32,"Hypertension, BMI > 30",75,high,2025-10-07T10:00:00Z
M002,Mary Smith,28,"First pregnancy",35,low,2025-10-07T10:00:00Z
```

**Required Fields:**
- `patient_id`: Unique identifier
- `name`: Patient name
- `age`: Age in years
- `risk_factors`: Comma-separated list of risk factors
- `last_updated`: ISO date string

**Optional Fields** (AI will predict if not provided):
- `risk_score`: 0-100
- `risk_level`: low, medium, high, or critical

### Pediatric Health Data Format
```csv
child_id,name,birth_weight,gestation_weeks,risk_factors,risk_score,risk_level,last_updated
P001,Baby Johnson,2.5,37,"Low birth weight, Premature",65,medium,2025-10-07T10:00:00Z
P002,Baby Williams,3.2,39,"First-time parents",25,low,2025-10-07T10:00:00Z
```

**Required Fields:**
- `child_id`: Unique identifier
- `name`: Child name
- `risk_factors`: Comma-separated list of risk factors
- `last_updated`: ISO date string

**Optional Fields:**
- `birth_weight`: Weight in kg
- `gestation_weeks`: Gestation period in weeks
- `risk_score`: 0-100 (AI will predict if not provided)
- `risk_level`: low, medium, high, or critical (AI will predict if not provided)

## 🔧 Configuration

### Backend Environment Variables

Located in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOAD_DEMO_DATA=false
```

**Configuration Options:**
- `LOAD_DEMO_DATA=false` (default) - System starts empty, CSV upload required
- `LOAD_DEMO_DATA=true` - Pre-loads demo data from `backend/data/` JSON files

### Frontend Environment Variables

Located in `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/verify` - Verify token

### Patients
- `GET /api/patients/maternal` - Get all maternal patients
- `GET /api/patients/pediatric` - Get all pediatric patients
- `POST /api/patients/maternal/upload` - Upload maternal CSV
- `POST /api/patients/pediatric/upload` - Upload pediatric CSV

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/trends` - Risk trends
- `GET /api/analytics/insights` - AI-generated insights
- `POST /api/analytics/predict-risk` - Predict patient risk

### Digital Twins
- `GET /api/digital-twins/deviations` - Get deviations
- `GET /api/digital-twins/vital-signs/:patientId` - Get vital signs
- `POST /api/digital-twins/vital-signs` - Record vital signs

### Policy
- `GET /api/policy/scenarios` - Get policy scenarios
- `POST /api/policy/scenarios` - Create policy scenario
- `POST /api/policy/simulate` - Simulate policy impact

### Resources
- `GET /api/resources` - Get resource allocations
- `POST /api/resources` - Create/update resources
- `GET /api/resources/forecast/:type` - Get forecast

## 🧪 Testing the System

### 1. Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@healthai.com","password":"password123"}'
```

### 2. Test Patient Data Upload
Use the web interface to upload the sample CSV files provided in the Data Ingestion page.

### 3. Test AI Prediction
```bash
curl -X POST http://localhost:5000/api/analytics/predict-risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "maternal",
    "patientData": {
      "age": 32,
      "riskFactors": ["Hypertension", "BMI > 30"]
    }
  }'
```

## 🐛 Troubleshooting

### No Data Showing on Dashboard
- Ensure you've uploaded CSV files through the Data Ingestion page
- Check backend logs for upload errors
- Alternatively, set `LOAD_DEMO_DATA=true` in backend `.env` and restart

### Backend Issues
```bash
# Check backend logs
cd backend
npm run dev

# Verify environment variables
cat .env

# Check if data directory exists
ls -la backend/data/
```

### Frontend Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Check environment variables
cat .env

# Clear browser localStorage if auth issues persist
# Open browser console (F12) and run: localStorage.clear()
```

### CSV Upload Errors
- Ensure CSV follows the correct format (see sample CSVs)
- Check file size is under 10MB
- Verify all required columns are present
- Check backend logs for detailed error messages

### Hugging Face API Issues
- Verify your API key is correct in backend `.env`
- Check API rate limits
- System will use fallback heuristics if AI API fails
- Note: AI insights generation may fail but CSV upload will still work

## 🚀 Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

### Environment Variables for Production
- Update `JWT_SECRET` to a secure random string
- Update `CORS_ORIGIN` to your production frontend URL
- Ensure `NODE_ENV=production`
- Set `LOAD_DEMO_DATA=false` for production (require CSV uploads)
- Consider implementing database backups for the `backend/data/` directory

## 📚 Key Features Implemented

✅ **Real Hugging Face AI Integration**
- Risk prediction using Mistral-7B-Instruct
- AI-generated healthcare insights
- Policy impact simulation
- Explainable AI with confidence scores

✅ **Production-Ready Backend**
- RESTful API with TypeScript
- In-memory data store with JSON file persistence
- JWT authentication
- CSV file upload handling with validation
- Error handling and validation with Zod

✅ **Complete Frontend Integration**
- Real-time data from backend API
- CSV upload with instant validation feedback
- Empty state handling when no data is uploaded
- Real-time statistics and analytics after data upload

✅ **Simple Data Management**
- In-memory database with JSON file persistence
- No external database setup required
- Data stored in `backend/data/` directory
- Easy backup and migration (just copy the data folder)
- Optional demo data pre-loading for quick evaluation

✅ **Security**
- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation with Zod

## 📖 Additional Resources

- **Backend Documentation**: `backend/README.md`
- **API Documentation**: Use the `/health` endpoint to verify API status
- **Data Store**: `backend/src/db/memory-store.ts`
- **Sample Data**: `backend/data/` directory contains JSON files
- **Hugging Face Models**: https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2
- **CSV Format Examples**: Available in the Data Ingestion page (download sample CSVs)

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review backend logs: `backend/` terminal
3. Review frontend logs: Browser console (F12)
4. Verify all environment variables are set correctly
5. Ensure you've uploaded CSV data or enabled demo data loading

## 🎉 Success!

Your system is now fully operational with:
- ✅ Real AI-powered predictions via Hugging Face
- ✅ Production-ready backend with TypeScript
- ✅ Simple JSON-based data persistence (no database setup needed)
- ✅ Complete frontend functionality with React
- ✅ CSV-first data approach with validation
- ✅ Optional demo data for quick evaluation

**Next Steps:**
1. Access the application at: `http://localhost:5173`
2. Login with demo credentials
3. Upload CSV files through Data Ingestion page
4. Explore the dashboard and AI-powered features!

**For Demo/Evaluation**: Set `LOAD_DEMO_DATA=true` in backend `.env` to skip CSV upload

