import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, Server, CheckCircle, Database } from 'lucide-react';
import ModelComparisonTable from '../../components/ModelComparisonTable';

export default function ModelInfo() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await api.get('/admin/model');
        setModelInfo(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Server className="text-blue-600" size={28} />
          <h2 className="text-xl font-bold text-slate-800">Machine Learning Model Information</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Model Name</h4>
                <p className="text-lg font-medium text-slate-900">{modelInfo?.model_name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Model Type</h4>
                <p className="text-lg font-medium text-slate-900">{modelInfo?.model_type}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</h4>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">{modelInfo?.model_status}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Version</h4>
                <p className="text-lg font-medium text-slate-900">v{modelInfo?.model_version}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Variable</h4>
                <div className="mt-1 inline-block bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg font-mono text-indigo-700">
                  {modelInfo?.target_variable}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Training Dataset</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Database className="text-slate-400" size={18} />
                  <span className="text-slate-700">{modelInfo?.training_dataset}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Input Features ({modelInfo?.input_features?.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {modelInfo?.input_features?.map(feature => (
                    <span key={feature} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-mono">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModelComparisonTable />
    </div>
  );
}
