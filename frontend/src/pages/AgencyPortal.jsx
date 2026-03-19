import React, { useState } from 'react';
import { uploadDataset, trainModel } from '../services/api';
import { UploadCloud, PlayCircle, Loader2, CheckCircle, FileText } from 'lucide-react';

const AgencyPortal = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [training, setTraining] = useState(false);
    const [datasetId, setDatasetId] = useState(null);
    const [trainResult, setTrainResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadDataset(file);
            setDatasetId(res.dataset_id);
            alert('File uploaded successfully!');
        } catch (e) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleTrain = async () => {
        if (!datasetId) return;
        setTraining(true);
        try {
            const res = await trainModel(datasetId);
            setTrainResult(res);
        } catch (e) {
            alert('Training failed');
        } finally {
            setTraining(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Agency Control Center</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <UploadCloud className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold">1. Upload Dataset</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Upload a new CSV file containing water quality samples.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`mt-4 w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center text-white ${!file || uploading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {uploading ? <Loader2 className="animate-spin mr-2" /> : 'Upload Dataset'}
                    </button>
                </div>

                {/* Training Section */}
                <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${!datasetId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <PlayCircle className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold">2. Trigger ML Training</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Retrain the Random Forest model with the new data.
                    </p>

                    <div className="bg-purple-50 p-4 rounded-lg mb-4">
                        <h4 className="text-sm font-bold text-purple-900 mb-2">Model Configuration</h4>
                        <ul className="text-xs text-purple-700 space-y-1">
                            <li>• Algorithm: Random Forest Regressor</li>
                            <li>• Features: Bacteria, Turbidity, pH, Access, etc.</li>
                            <li>• Target: Composite Risk Score (0-1)</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleTrain}
                        disabled={training}
                        className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700"
                    >
                        {training ? <Loader2 className="animate-spin mr-2" /> : 'Start Training'}
                    </button>

                    {trainResult && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center text-green-700">
                            <CheckCircle className="w-5 h-5 mr-3" />
                            <div>
                                <p className="font-bold">Training Complete</p>
                                <p className="text-sm">New Accuracy: {(trainResult.accuracy * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default AgencyPortal;
