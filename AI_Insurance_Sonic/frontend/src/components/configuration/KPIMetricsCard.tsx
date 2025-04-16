import React, { useState } from 'react';
import { FaSave, FaPlus } from 'react-icons/fa';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { KPIMetric } from '../../types/kpi';
import { 
  useGetKPIMetricsQuery,
  useCreateKPIMetricMutation,
  useUpdateKPIMetricMutation,
  useDeleteKPIMetricMutation
} from '../../redux/configurationApi';
import { toast } from 'react-hot-toast';

interface NewMetricFormProps {
  onSubmit: (metric: Omit<KPIMetric, 'id'>) => Promise<void>;
  onCancel: () => void;
}

interface EditMetricFormProps {
  metric: KPIMetric;
  onSubmit: (metric: KPIMetric) => Promise<void>;
  onCancel: () => void;
}

const NewMetricForm = ({ onSubmit, onCancel }: NewMetricFormProps) => {
  const [formData, setFormData] = useState<Omit<KPIMetric, 'id'>>({
    key: '',
    name: '',
    description: '',
    enabled: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Omit<KPIMetric, 'id'>, value: string | boolean) => {
    if (field === 'key' && typeof value === 'string') {
      // Only allow alphabets and underscores, convert to lowercase
      const sanitizedValue = value.toLowerCase().replace(/[^a-z_]/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: sanitizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Metric Key *
          </label>
          <input
            type="text"
            value={formData.key}
            onChange={(e) => handleChange('key', e.target.value)}
            placeholder="e.g., greeting_score"
            pattern="[a-zA-Z_]+"
            title="Only alphabets and underscores are allowed"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Only alphabets and underscores allowed (e.g., greeting_score)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Metric Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Greeting Score"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Display name for the metric</p>
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="e.g., Measures the quality and completeness of the agent's greeting"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400 h-20"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]"
        >
          Add Metric
        </button>
      </div>
    </form>
  );
};

const EditMetricForm = ({ metric, onSubmit, onCancel }: EditMetricFormProps) => {
  const [formData, setFormData] = useState<KPIMetric>(metric);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Omit<KPIMetric, 'id'>, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Metric Key *
          </label>
          <input
            type="text"
            value={formData.key}
            onChange={(e) => handleChange('key', e.target.value)}
            placeholder="e.g., greeting_score"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Unique identifier for the metric</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Metric Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Greeting Score"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Display name for the metric</p>
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="e.g., Measures the quality and completeness of the agent's greeting"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00aff0] focus:border-[#00aff0] text-black placeholder-gray-400 h-20"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#00aff0] text-white rounded-md hover:bg-[#0099d6]"
        >
          Update Metric
        </button>
      </div>
    </form>
  );
};

const StyledCheckbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <div className="flex items-center">
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-5 h-5 border border-gray-300 rounded peer-checked:bg-[#00aff0] peer-checked:border-[#00aff0] transition-all duration-200 flex items-center justify-center">
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </label>
  </div>
);

const KPIMetricsCard: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: metrics = [], isLoading } = useGetKPIMetricsQuery();
  const [createMetric] = useCreateKPIMetricMutation();
  const [updateMetric] = useUpdateKPIMetricMutation();
  const [deleteMetric] = useDeleteKPIMetricMutation();

  const handleAddSubmit = async (metric: Omit<KPIMetric, 'id'>) => {
    try {
      await createMetric(metric).unwrap();
      setIsAdding(false);
      toast.success('KPI metric created successfully');
    } catch (error) {
      console.error('Failed to create metric:', error);
      toast.error('Failed to create KPI metric');
    }
  };

  const handleEditSubmit = async (metric: KPIMetric) => {
    try {
      await updateMetric(metric).unwrap();
      setEditingId(null);
      toast.success('KPI metric updated successfully');
    } catch (error) {
      console.error('Failed to update metric:', error);
      toast.error('Failed to update KPI metric');
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      try {
        await deleteMetric(id).unwrap();
        toast.success('KPI metric deleted successfully');
      } catch (error) {
        console.error('Failed to delete metric:', error);
        toast.error('Failed to delete KPI metric');
      }
    }
  };

  const handleToggleEnabled = async (metric: KPIMetric) => {
    try {
      await updateMetric({
        ...metric,
        enabled: !metric.enabled
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle metric:', error);
      toast.error('Failed to update KPI metric');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">KPI Metrics Configuration</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00aff0] text-white rounded-md  transition-colors"
          >
            <FaPlus />
            Add New Metric
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Add New Metric</h3>
          <NewMetricForm 
            onSubmit={handleAddSubmit}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric) => (
              <tr key={metric.id} className="hover:bg-gray-50">
                {editingId === metric.id ? (
                  <td colSpan={5} className="px-6 py-4">
                    <EditMetricForm 
                      metric={metric}
                      onSubmit={handleEditSubmit}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StyledCheckbox
                        checked={metric.enabled}
                        onChange={() => handleToggleEnabled(metric)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#00aff0]">{metric.key}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{metric.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{metric.description}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingId(metric.id)}
                          className="text-[#00aff0] hover:text-[#0099d6] transition-colors"
                          title="Edit metric"
                        >
                          <MdModeEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMetric(metric.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete metric"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KPIMetricsCard; 