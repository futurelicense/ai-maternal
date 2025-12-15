# 📊 Sample CSV Data for Testing

Since the system starts empty, here are sample CSV files you can use:

## Maternal Health Sample Data

**File: `maternal_sample.csv`**

Copy this content and save as CSV:

```csv
patient_id,name,age,risk_factors,risk_score,risk_level,last_updated
M001,Sarah Johnson,32,"Hypertension, BMI > 30, Limited prenatal visits",78,high,2025-10-10T12:00:00Z
M002,Emily Davis,28,First pregnancy,35,low,2025-10-10T12:00:00Z
M003,Maria Rodriguez,35,"Advanced maternal age, Previous C-section",62,medium,2025-10-10T12:00:00Z
M004,Aisha Mensah,26,"Gestational diabetes, Hypertension, History of preterm birth",88,critical,2025-10-10T12:00:00Z
M005,Jennifer Smith,31,"Anemia, History of miscarriage",45,medium,2025-10-10T12:00:00Z
M006,Lisa Wong,29,First pregnancy,30,low,2025-10-10T12:00:00Z
M007,Patricia Brown,38,"Advanced maternal age, Diabetes",75,high,2025-10-10T12:00:00Z
M008,Angela Martinez,27,Healthy pregnancy,25,low,2025-10-10T12:00:00Z
```

## Pediatric Health Sample Data

**File: `pediatric_sample.csv`**

Copy this content and save as CSV:

```csv
child_id,name,birth_weight,gestation_weeks,risk_factors,risk_score,risk_level,last_updated
P001,Baby Johnson,2.1,34,"Low birth weight, Premature birth (34 weeks)",65,medium,2025-10-10T12:00:00Z
P002,Baby Williams,3.2,39,First-time parents,25,low,2025-10-10T12:00:00Z
P003,Baby Rodriguez,2.8,36,"Respiratory distress, Jaundice, Low APGAR score",82,high,2025-10-10T12:00:00Z
P004,Baby Chen,2.3,35,"Premature birth, Low birth weight",70,medium,2025-10-10T12:00:00Z
P005,Baby Patel,3.0,38,Mild jaundice,30,low,2025-10-10T12:00:00Z
P006,Baby Smith,3.4,40,Healthy birth,20,low,2025-10-10T12:00:00Z
P007,Baby Garcia,1.9,32,"Very low birth weight, Premature, NICU required",90,critical,2025-10-10T12:00:00Z
P008,Baby Lee,3.1,39,First-time parents,28,low,2025-10-10T12:00:00Z
```

## How to Upload

1. **Copy the CSV content above** (maternal or pediatric)
2. **Create a text file** on your computer
3. **Paste the content** and save with `.csv` extension
4. **Go to your app:** https://ai-maternal.vercel.app
5. **Login** with demo credentials
6. **Navigate to "Data Ingestion"** page
7. **Upload the CSV file**
8. **Check Dashboard** - should now show data!

## Quick Upload via Data Ingestion Page

The app has a "Download Sample CSV" button on the Data Ingestion page that provides these exact files. You can:

1. Login to the app
2. Go to "Data Ingestion" page  
3. Click "Download Maternal Sample CSV"
4. Click "Download Pediatric Sample CSV"
5. Upload both files back to the app

This will populate the system with sample data.

## Expected Results After Upload

Once you upload the CSV files, you should see:

**Dashboard:**
- Total Patients: 8 maternal + 8 pediatric = 16
- High Risk Patients: 5-6
- Risk charts and distributions
- AI-generated insights (may take a moment)

**Policy Simulation:**
- 3 pre-loaded policy scenarios
- Ability to simulate impact

**Resource Allocation:**
- 5 regional resource records
- Resource forecasting available

## Notes

- The system will auto-calculate risk scores using AI if not provided in CSV
- You can upload multiple times - new data is added/updated
- Data persists on the backend until server restarts (Render free tier)

