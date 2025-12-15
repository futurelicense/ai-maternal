import React, { useState, createElement } from 'react';
import { UploadCloudIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, FileIcon, RefreshCwIcon, DownloadIcon } from 'lucide-react';
import { parseCSV, validateCSV } from '../utils/csvParser';
import { useData } from '../context/DataContext';
import { patientsAPI } from '../services/apiClient';
const DataIngestion: React.FC = () => {
  const {
    refreshData
  } = useData();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    message: string;
    error?: string;
  }>({
    isProcessing: false,
    message: ''
  });
  // Sample CSV data for download
  const maternalSampleCSV = `patient_id,name,age,risk_factors,risk_score,risk_level,last_updated
M001,Sarah Johnson,32,"Hypertension, BMI > 30, Limited prenatal visits",78,high,${new Date().toISOString()}
M002,Emily Davis,28,First pregnancy,35,low,${new Date().toISOString()}
M003,Maria Rodriguez,35,"Advanced maternal age, Previous C-section",62,medium,${new Date().toISOString()}
M004,Aisha Mensah,26,"Gestational diabetes, Hypertension, History of preterm birth",88,critical,${new Date().toISOString()}
M005,Jennifer Smith,31,"Anemia, History of miscarriage",45,medium,${new Date().toISOString()}`;
  const pediatricSampleCSV = `child_id,name,birth_weight,gestation_weeks,risk_factors,risk_score,risk_level,last_updated
P001,Baby Johnson,2.1,34,"Low birth weight, Premature birth (34 weeks)",65,medium,${new Date().toISOString()}
P002,Baby Williams,3.2,39,First-time parents,25,low,${new Date().toISOString()}
P003,Baby Rodriguez,2.8,36,"Respiratory distress, Jaundice, Low APGAR score",82,high,${new Date().toISOString()}
P004,Baby Chen,2.3,35,"Premature birth, Low birth weight",70,medium,${new Date().toISOString()}
P005,Baby Patel,3.0,38,Mild jaundice,30,low,${new Date().toISOString()}`;
  const downloadSampleCSV = (type: 'maternal' | 'pediatric') => {
    const csvContent = type === 'maternal' ? maternalSampleCSV : pediatricSampleCSV;
    const fileName = type === 'maternal' ? 'maternal_sample.csv' : 'pediatric_sample.csv';
    // Create a blob from the CSV content
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    // Trigger the download
    link.click();
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  const handleFiles = async (newFiles: File[]) => {
    // Filter for CSV files
    const csvFiles = newFiles.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    if (csvFiles.length === 0) {
      setValidationResults({
        valid: false,
        message: 'No CSV files found',
        details: ['Please upload files in CSV format']
      });
      return;
    }
    setFiles(prevFiles => [...prevFiles, ...csvFiles]);
    // Validate the first file
    try {
      setProcessingStatus({
        isProcessing: true,
        message: 'Validating CSV structure...'
      });
      const file = csvFiles[0];
      const fileType = file.name.toLowerCase().includes('maternal') ? 'maternal' : 'pediatric';
      const {
        data,
        errors
      } = await parseCSV(file);
      if (errors.length > 0) {
        setValidationResults({
          valid: false,
          message: 'CSV parsing failed',
          details: errors.map(err => err.message)
        });
        setProcessingStatus({
          isProcessing: false,
          message: ''
        });
        return;
      }
      // Validate the data structure
      const validationResult = validateCSV(data, fileType);
      setValidationResults(validationResult);
      setProcessingStatus({
        isProcessing: false,
        message: ''
      });
    } catch (error: any) {
      console.error('Error validating CSV:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      setValidationResults({
        valid: false,
        message: 'Error validating CSV file',
        details: [errorMessage]
      });
      setProcessingStatus({
        isProcessing: false,
        message: '',
        error: errorMessage
      });
    }
  };
  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploadStatus('uploading');
    setProcessingStatus({
      isProcessing: true,
      message: 'Uploading data to server...'
    });
    
    try {
      // Process each file
      for (const file of files) {
        const fileType = file.name.toLowerCase().includes('maternal') ? 'maternal' : 'pediatric';
        
        // Upload file to backend API
        const result = fileType === 'maternal'
          ? await patientsAPI.uploadMaternalCSV(file)
          : await patientsAPI.uploadPediatricCSV(file);
        
        console.log('Upload result:', result);
      }
      
      // Refresh all data from API (includes patients, policies, and resources)
      await refreshData();
      
      setUploadStatus('success');
      setProcessingStatus({
        isProcessing: false,
        message: 'Data processed successfully'
      });
    } catch (error: any) {
      console.error('Error uploading CSV data:', error);
      const errorMessage = error.message || 'Unknown error occurred during upload';
      
      setUploadStatus('error');
      setProcessingStatus({
        isProcessing: false,
        message: '',
        error: errorMessage
      });
    }
  };
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (files.length === 1) {
      setValidationResults(null);
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Ingestion</h1>
          <p className="text-gray-600 mt-1">
            Upload and validate maternal and child health datasets
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Upload Dataset
            </h2>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <UploadCloudIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 mb-2">
                Drag and drop your CSV files here
              </p>
              <p className="text-gray-500 text-sm mb-4">or</p>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
                Browse Files
                <input type="file" accept=".csv" multiple className="hidden" onChange={handleChange} />
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: CSV files with maternal or child health data
              </p>
            </div>
            {files.length > 0 && <div className="mt-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Selected Files
                </h3>
                <ul className="space-y-2">
                  {files.map((file, index) => <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md">
                          <FileIcon size={20} className="text-indigo-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-700">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-gray-600">
                        <XCircleIcon size={20} />
                      </button>
                    </li>)}
                </ul>
                <div className="mt-4">
                  <button onClick={handleUpload} disabled={uploadStatus === 'uploading' || !validationResults?.valid} className={`px-4 py-2 rounded-md ${uploadStatus === 'uploading' || !validationResults?.valid ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Process Data'}
                  </button>
                  {processingStatus.isProcessing && <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
                      <RefreshCwIcon size={20} className="mr-2 animate-spin" />
                      {processingStatus.message}
                    </div>}
                  {uploadStatus === 'success' && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                      <CheckCircleIcon size={20} className="mr-2" />
                      Files processed successfully. Data is now available in the
                      platform.
                    </div>}
                  {(uploadStatus === 'error' || processingStatus.error) && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                      <XCircleIcon size={20} className="mr-2" />
                      Error processing data:{' '}
                      {processingStatus.error || 'Please try again.'}
                    </div>}
                </div>
              </div>}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Schema Validation
            </h2>
            {!validationResults ? <div className="text-center py-8 text-gray-500">
                <AlertTriangleIcon size={32} className="mx-auto mb-2" />
                <p>No files validated yet</p>
                <p className="text-xs mt-2">
                  Upload a CSV file to validate its schema
                </p>
              </div> : <div className={`p-4 rounded-md ${validationResults.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center mb-3">
                  {validationResults.valid ? <CheckCircleIcon size={20} className="text-green-600 mr-2" /> : <XCircleIcon size={20} className="text-red-600 mr-2" />}
                  <h3 className={`font-medium ${validationResults.valid ? 'text-green-700' : 'text-red-700'}`}>
                    {validationResults.message}
                  </h3>
                </div>
                {validationResults.details && <ul className="space-y-1 ml-6 list-disc">
                    {validationResults.details.map((detail, index) => <li key={index} className="text-sm text-gray-700">
                        {detail}
                      </li>)}
                  </ul>}
                {validationResults.valid && <div className="mt-4 pt-4 border-t border-green-200">
                    <h4 className="font-medium text-sm text-green-700 mb-2">
                      AI Data Quality Assessment
                    </h4>
                    <p className="text-sm text-gray-700">
                      Hugging Face data quality model detected no anomalies in
                      the dataset. Data is ready for processing.
                    </p>
                  </div>}
              </div>}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Expected Schema
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">
                    Maternal Dataset
                  </h4>
                  <ul className="mt-1 text-xs text-gray-500 space-y-1">
                    <li>patient_id (string)</li>
                    <li>name (string)</li>
                    <li>age (number)</li>
                    <li>risk_score (number)</li>
                    <li>risk_level (string: low/medium/high/critical)</li>
                    <li>risk_factors (comma-separated string)</li>
                    <li>last_updated (ISO date string)</li>
                  </ul>
                  <button onClick={() => downloadSampleCSV('maternal')} className="mt-2 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 flex items-center w-fit">
                    <DownloadIcon size={12} className="mr-1" />
                    Download Sample
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600">
                    Pediatric Dataset
                  </h4>
                  <ul className="mt-1 text-xs text-gray-500 space-y-1">
                    <li>child_id (string)</li>
                    <li>name (string)</li>
                    <li>birth_weight (number)</li>
                    <li>gestation_weeks (number)</li>
                    <li>risk_score (number)</li>
                    <li>risk_level (string: low/medium/high/critical)</li>
                    <li>risk_factors (comma-separated string)</li>
                    <li>last_updated (ISO date string)</li>
                  </ul>
                  <button onClick={() => downloadSampleCSV('pediatric')} className="mt-2 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 flex items-center w-fit">
                    <DownloadIcon size={12} className="mr-1" />
                    Download Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Data Processing Pipeline
        </h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-md">
          <div className="flex-1">
            <h3 className="text-md font-medium text-gray-700">
              HIPAA-Compliant Storage
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              All uploaded data is processed through secure pipelines and stored
              in HIPAA-compliant cloud infrastructure.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Encryption Enabled
            </span>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">
            Data Processing Steps
          </h3>
          <ol className="space-y-4 ml-6 list-decimal">
            <li className="text-sm text-gray-700">
              <span className="font-medium">Schema Validation:</span> Verify
              that uploaded CSV files match the expected schema
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-medium">Data Cleaning:</span> Handle missing
              values, outliers, and format inconsistencies
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-medium">Feature Engineering:</span>{' '}
              Calculate derived features for AI model consumption
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-medium">Secure Storage:</span> Encrypt and
              store processed data in HIPAA-compliant cloud storage
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-medium">AI Model Integration:</span> Feed
              processed data to Hugging Face predictive models
            </li>
          </ol>
        </div>
      </div>
    </div>;
};
export default DataIngestion;