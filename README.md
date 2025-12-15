# AI Maternal & Child Health Tracker

**Production-ready healthcare analytics platform powered by real Hugging Face AI**

![Status](https://img.shields.io/badge/status-production--ready-green)
![AI](https://img.shields.io/badge/AI-Hugging%20Face-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Overview

A comprehensive AI-powered platform for monitoring and analyzing maternal and child health data. This system uses real Hugging Face AI models to provide predictive analytics, risk assessments, and actionable healthcare insights.

## ✨ Key Features

### 🤖 Real AI Integration
- **Hugging Face Mistral-7B-Instruct** for risk prediction
- AI-generated healthcare insights
- Policy impact simulation
- Explainable AI with confidence scores

### 📊 Analytics & Monitoring
- Real-time dashboard with live statistics
- Predictive risk analytics for patients
- Digital twin technology for patient monitoring
- Resource allocation forecasting

### 📈 Advanced Features
- CSV data ingestion with validation
- Policy simulation and impact analysis
- Regional resource optimization
- Comprehensive reporting system

### 🔐 Security
- JWT-based authentication
- Encrypted password storage
- Role-based access control
- HIPAA-compliant data handling

## 🏗️ Architecture

```
├── Frontend (React + TypeScript + Vite)
│   ├── Real-time dashboard
│   ├── Data visualization with Recharts
│   ├── CSV upload interface
│   └── Responsive Tailwind UI
│
├── Backend (Node.js + Express + TypeScript)
│   ├── RESTful API
│   ├── Hugging Face AI integration
│   ├── In-memory data store with JSON persistence
│   └── JWT authentication
│
└── Data Storage (JSON files)
    ├── Patient records (maternal.json, pediatric.json)
    ├── Policy scenarios (policies.json)
    ├── Resource allocations (resources.json)
    └── User data (users.json)
```

**No database setup required!** All data is persisted in JSON files.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Hugging Face API key (get from https://huggingface.co/settings/tokens)
- **No database installation required!**

### Installation

1. **Clone and setup:**
```bash
cd AI-Maternal-Child-Health-Tracker-main-2
```

2. **Setup Backend:**
```bash
cd backend
npm install
npm run dev
```

3. **Setup Frontend:**
```bash
cd ../
npm install
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Login: demo@healthai.com / password123

5. **Upload Data (Required):**
- Login and go to "Data Ingestion" page
- Download sample CSV files
- Upload maternal/pediatric CSV data
- Dashboard will populate with uploaded data

**Alternative:** Set `LOAD_DEMO_DATA=true` in `backend/.env` to pre-load demo data

📖 **See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions**

## 🎮 Usage

### 1. Login
Use the demo credentials:
- Email: `demo@healthai.com`
- Password: `password123`

### 2. Upload Data (Required First Step)
⚠️ **The system starts empty - CSV upload is required to see data**
- Go to **Data Ingestion**
- Download sample CSV files (maternal and/or pediatric)
- Upload the CSV files to the system
- AI automatically predicts risk scores if not provided
- Dashboard and analytics will populate with your data

### 3. Explore Features
- **Dashboard**: Real-time statistics and AI insights
- **Predictive Analytics**: Risk assessments and predictions
- **Digital Twins**: Patient health simulations
- **Policy Simulation**: Impact analysis of healthcare policies
- **Resource Allocation**: Forecasting and optimization
- **Reports**: Comprehensive data exports

## 🤖 AI Capabilities

The system uses **Hugging Face Mistral-7B-Instruct** for:

1. **Risk Prediction**
   - Analyzes patient data (age, risk factors, vitals)
   - Predicts risk scores (0-100)
   - Classifies risk levels (low/medium/high/critical)
   - Provides confidence scores

2. **Insight Generation**
   - Analyzes population health trends
   - Identifies high-risk patterns
   - Generates actionable recommendations
   - Detects emerging health concerns

3. **Policy Simulation**
   - Predicts policy impact on health outcomes
   - Estimates cost implications
   - Projects mortality rate changes
   - Analyzes equity impacts

4. **Explanations**
   - SHAP-style feature importance
   - Human-readable reasoning
   - Confidence metrics
   - Clinical recommendations

## 📊 Data Format

### Maternal Health CSV
```csv
patient_id,name,age,risk_factors,risk_score,risk_level,last_updated
M001,Jane Doe,32,"Hypertension, BMI > 30",75,high,2025-10-07T10:00:00Z
```

### Pediatric Health CSV
```csv
child_id,name,birth_weight,gestation_weeks,risk_factors,risk_score,risk_level,last_updated
P001,Baby Smith,2.5,37,"Low birth weight, Premature",65,medium,2025-10-07T10:00:00Z
```

**Note:** If `risk_score` and `risk_level` are not provided, the AI will automatically predict them.

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for navigation
- Context API for state management

### Backend
- Node.js + Express
- TypeScript for type safety
- In-memory data store with JSON persistence
- Hugging Face Inference API
- JWT for authentication
- Zod for validation
- Multer for CSV file uploads

### Data Storage
- JSON file-based persistence
- No external database required
- Automatic data backup to files
- Simple and portable

### AI/ML
- Hugging Face Inference API
- Mistral-7B-Instruct model
- Custom fallback heuristics

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic & AI
│   │   ├── db/              # In-memory store
│   │   ├── middleware/      # Auth & validation
│   │   ├── config/          # Configuration
│   │   └── server.ts        # Express server
│   ├── data/                # JSON data files
│   │   ├── maternal.json
│   │   ├── pediatric.json
│   │   ├── policies.json
│   │   └── resources.json
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── context/             # State management
│   ├── services/            # API client
│   └── utils/               # Utilities
│
├── SETUP_GUIDE.md          # Detailed setup
└── README.md               # This file
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ File upload validation
- ✅ XSS protection
- ✅ Rate limiting ready
- ✅ Environment variable security
- ✅ Data persistence in secure JSON files

## 🧪 Testing

### Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@healthai.com","password":"password123"}'
```

### Test AI Prediction
```bash
curl -X POST http://localhost:5000/api/analytics/predict-risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"maternal","patientData":{"age":32,"riskFactors":["Hypertension"]}}'
```

## 📈 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/patients/maternal` | Get maternal patients |
| GET | `/api/patients/pediatric` | Get pediatric patients |
| POST | `/api/patients/maternal/upload` | Upload maternal CSV |
| GET | `/api/analytics/dashboard` | Dashboard statistics |
| GET | `/api/analytics/insights` | AI insights |
| POST | `/api/analytics/predict-risk` | Predict patient risk |
| GET | `/api/digital-twins/deviations` | Get deviations |
| GET | `/api/policy/scenarios` | Get policy scenarios |
| GET | `/api/resources` | Get resource allocations |

**Full API documentation:** See `backend/README.md`

## 🚀 Production Deployment

### Build Backend
```bash
cd backend
npm run build
npm start
```

### Build Frontend
```bash
npm run build
# Deploy 'dist' folder to hosting
```

### Environment Variables
Update these for production:
- `JWT_SECRET` - Random secure string
- `CORS_ORIGIN` - Production frontend URL
- `NODE_ENV=production`
- `LOAD_DEMO_DATA=false` - Require CSV uploads in production

## 📝 Configuration

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOAD_DEMO_DATA=false
```

**Data Loading Options:**
- `LOAD_DEMO_DATA=false` (default) - Start empty, require CSV upload
- `LOAD_DEMO_DATA=true` - Pre-load demo data from JSON files

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

This is a production-ready system. For enhancements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Hugging Face** for AI model hosting
- **Magic Patterns** for initial UI generation
- **Open source community** for amazing tools

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Review backend logs
3. Check browser console
4. Verify environment variables

## 🎉 Status

✅ **Production Ready**
- Real AI integration active (Hugging Face)
- JSON-based data persistence (no database setup needed)
- All features implemented
- Security measures in place
- CSV-first data approach with validation
- Optional demo data for quick evaluation

**Getting Started:**
1. Install dependencies (no database needed!)
2. Start backend and frontend
3. Login with demo credentials
4. **Upload CSV data** or enable demo data loading
5. Explore AI-powered analytics

**Start using:** `http://localhost:5173` after setup

---

**Built with ❤️ for better maternal and child healthcare**
# Last updated: Sat Oct 11 10:32:09 WAT 2025
