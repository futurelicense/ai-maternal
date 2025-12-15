# Maternal & Child Health Tracker - Backend API

**Databaseless** production-ready backend API with real Hugging Face AI integration.

## Features

- ✅ Real-time risk prediction using Hugging Face AI models
- ✅ RESTful API with TypeScript
- ✅ **In-memory data store with JSON file persistence**
- ✅ JWT authentication
- ✅ CSV data ingestion with validation
- ✅ Digital twin monitoring
- ✅ Policy simulation
- ✅ Resource allocation forecasting
- ✅ **No database required - zero setup!**

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Storage**: In-memory with JSON file persistence
- **AI**: Hugging Face Inference API (Mistral-7B-Instruct)
- **Authentication**: JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Hugging Face API key: `your_huggingface_api_key_here`

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Environment is already configured in `.env` with your Hugging Face API key

3. Seed initial data:
```bash
npm run seed
```

4. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

**That's it! No database setup required!** 🎉

## Data Persistence

- **In-Memory**: Fast access during runtime
- **JSON Files**: Automatic persistence to `./data` folder
- **No Database**: No PostgreSQL, MySQL, or MongoDB needed
- **Simple Backup**: Just copy the `./data` folder

Data files:
- `data/users.json` - User accounts
- `data/maternal.json` - Maternal patients
- `data/pediatric.json` - Pediatric patients
- `data/policies.json` - Policy scenarios
- `data/resources.json` - Resource allocations

## Default Demo User

Automatically created on first run:
- **Email**: demo@healthai.com
- **Password**: password123
- **Role**: admin

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/verify` - Verify token

### Patients
- `GET /api/patients/maternal` - Get all maternal patients
- `GET /api/patients/pediatric` - Get all pediatric patients
- `POST /api/patients/maternal/upload` - Upload maternal CSV data (with AI prediction)
- `POST /api/patients/pediatric/upload` - Upload pediatric CSV data (with AI prediction)
- `GET /api/patients/maternal/:id` - Get specific maternal patient
- `GET /api/patients/pediatric/:id` - Get specific pediatric patient
- `DELETE /api/patients/maternal/:id` - Delete maternal patient
- `DELETE /api/patients/pediatric/:id` - Delete pediatric patient

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/trends` - Get risk trends over time
- `GET /api/analytics/insights` - Get AI-generated insights
- `GET /api/analytics/model-performance` - Get model performance metrics
- `GET /api/analytics/risk-factors` - Get risk factor analysis
- `POST /api/analytics/predict-risk` - Predict risk for a patient using AI

### Digital Twins
- `GET /api/digital-twins/deviations` - Get all deviations
- `GET /api/digital-twins/vital-signs/:patientId` - Get patient vital signs
- `POST /api/digital-twins/vital-signs` - Record new vital signs
- `POST /api/digital-twins/deviations` - Record deviation
- `GET /api/digital-twins/comparison/:patientId` - Get predicted vs actual comparison

### Policy Simulation
- `GET /api/policy/scenarios` - Get all policy scenarios
- `GET /api/policy/scenarios/:id` - Get specific scenario
- `POST /api/policy/scenarios` - Create new policy scenario with AI
- `POST /api/policy/simulate` - Simulate policy impact with AI
- `DELETE /api/policy/scenarios/:id` - Delete policy scenario

### Resources
- `GET /api/resources` - Get all resource allocations
- `GET /api/resources/:region` - Get resource allocation by region
- `POST /api/resources` - Create or update resource allocation
- `GET /api/resources/forecast/:type` - Get AI-driven resource forecast
- `DELETE /api/resources/:region` - Delete resource allocation

## CSV Data Format

### Maternal Health Data
```csv
patient_id,name,age,risk_factors,risk_score,risk_level,last_updated
M001,Jane Doe,32,"Hypertension, BMI > 30",75,high,2025-10-07T10:00:00Z
```

**Required:** patient_id, name, age, risk_factors, last_updated
**Optional:** risk_score, risk_level (AI will predict if missing)

### Pediatric Health Data
```csv
child_id,name,birth_weight,gestation_weeks,risk_factors,risk_score,risk_level,last_updated
P001,Baby Smith,2.5,37,"Low birth weight, Premature",65,medium,2025-10-07T10:00:00Z
```

**Required:** child_id, name, risk_factors, last_updated
**Optional:** birth_weight, gestation_weeks, risk_score, risk_level

## AI Integration

Uses Hugging Face's **Mistral-7B-Instruct** model for:

1. **Risk Prediction**: Analyzes patient data to predict risk scores and levels
2. **Insight Generation**: Generates actionable healthcare insights
3. **Policy Simulation**: Simulates the impact of policy changes
4. **Explanations**: Provides interpretable AI explanations

## Development

### Commands
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Run production server
npm run seed   # Seed initial data
```

### Backup Data
```bash
# Backup all data
cp -r data data-backup

# Restore data
cp -r data-backup data
```

### Reset Data
```bash
# Delete all data
rm -rf data

# Reseed
npm run seed
```

## Environment Variables

All configured in `.env`:

```env
PORT=5000
NODE_ENV=development
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
JWT_SECRET=maternal-health-tracker-super-secret-jwt-key-2025
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

## Advantages of Databaseless Setup

✅ **Zero Setup** - No database installation required
✅ **Fast** - In-memory operations are lightning fast
✅ **Portable** - Just copy the project folder
✅ **Simple Backup** - Copy the `./data` folder
✅ **No Connection Issues** - No database connection errors
✅ **Development Friendly** - Quick iterations
✅ **Production Ready** - Suitable for small to medium datasets

## Limitations

⚠️ **Data Size**: Best for <10,000 records
⚠️ **Concurrency**: Single process (use Redis for multi-process)
⚠️ **Scalability**: For large scale, consider adding a database

## Production Deployment

For production with larger datasets, you can easily add PostgreSQL later:
1. Install `drizzle-orm` and `pg`
2. Create schema
3. Replace memory-store with database calls
4. All routes remain the same!

## License

MIT
