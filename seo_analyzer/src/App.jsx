import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Search, BarChart2, Clock, Image, Link2, Share2, AlertCircle, CheckCircle, XCircle, Loader2, Lightbulb, FileText, Users } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const LoadingSpinner = ({ progress }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.8 }}
      className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center gap-5 w-80"
    >
      <div className="relative">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">{progress}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-lg font-medium text-gray-700">Analyzing website...</p>
      <p className="text-sm text-gray-500 text-center">
        {progress < 25 && "Fetching website content..."}
        {progress >= 25 && progress < 50 && "Analyzing page structure..."}
        {progress >= 50 && progress < 75 && "Checking SEO elements..."}
        {progress >= 75 && "Generating recommendations..."}
      </p>
    </motion.div>
  </motion.div>
);

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const resultsRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
    }
  }, [results]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(0);
    
    // Simulate progress updates
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressIntervalRef.current);
          return 95; // Keep at 95% until real completion
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 600);

    try {
      const response = await axios.post('/api/analyze', { url });
      setResults(response.data);
      fetchHistory(); // Refresh history after new analysis
      setProgress(100); // Complete the progress
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze website');
    } finally {
      setTimeout(() => {
        clearInterval(progressIntervalRef.current);
        setLoading(false);
      }, 500); // Short delay to show 100% completion
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete history entry:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getChartData = (score) => ({
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [
          score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444',
          '#e2e8f0',
        ],
        borderWidth: 0,
      },
    ],
  });

  const renderAISuggestions = (suggestions) => {
    if (!suggestions) return null;

    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">AI-Powered SEO Recommendations</h2>
        
        {/* Priority Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-600">
            <AlertCircle className="w-6 h-6" />
            Priority Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(suggestions.priorityActions) && suggestions.priorityActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {index % 2 === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-gray-700">{typeof action === 'string' ? action : JSON.stringify(action)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {['contentOptimization', 'technicalSEO', 'userExperience', 'socialMedia'].map((category) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  {category === 'contentOptimization' && <Search className="w-5 h-5" />}
                  {category === 'technicalSEO' && <BarChart2 className="w-5 h-5" />}
                  {category === 'userExperience' && <Clock className="w-5 h-5" />}
                  {category === 'socialMedia' && <Share2 className="w-5 h-5" />}
                  {category.split(/(?=[A-Z])/).join(' ')}
                </h3>
              </div>

              <div className="p-5">
                console.log(suggestions, 'suggestionssldjkfd')
                {suggestions[category] && typeof suggestions[category] === 'object' && Object.entries(suggestions[category]).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-4 last:mb-0 p-4 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow duration-200"
                  >
                    <h4 className="font-medium text-gray-800 mb-2 capitalize">{key.split(/(?=[A-Z])/).join(' ')}</h4>
                    <div className="text-gray-600">
                      {typeof value === 'string' && (
                        <div dangerouslySetInnerHTML={{ 
                          __html: value.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600">$1</strong>') 
                        }} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderPerformanceCharts = (results) => {
    if (!results) return null;

    const scoreData = {
      labels: ['Title', 'Meta', 'Headings', 'Images', 'Social', 'Links'],
      datasets: [
        {
          label: 'Score',
          data: [
            results.title.score,
            results.meta.score,
            results.headings.score,
            results.images.score,
            results.social.score,
            results.links.score,
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
      >
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Score Distribution</h3>
          <Bar
            data={scoreData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Resource Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                { name: 'Images', value: results.images.total },
                { name: 'Links', value: results.links.internal + results.links.external },
                { name: 'Headings', value: results.headings.h1 + results.headings.h2 + results.headings.h3 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <AnimatePresence>
        {loading && <LoadingSpinner progress={progress} />}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-4 text-gray-800"
        >
          AI-Powered SEO Analysis
        </motion.h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          Unlock the full potential of your website with AI-powered SEO insights and comprehensive reports.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            className="w-64 bg-white rounded-2xl shadow-md overflow-hidden transform transition-all duration-300"
          >
            <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="p-5">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto"
              >
                <Lightbulb className="w-6 h-6 text-blue-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-center text-gray-600">Gain actionable insights to improve your website's SEO performance.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            className="w-64 bg-white rounded-2xl shadow-md overflow-hidden transform transition-all duration-300"
          >
            <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <div className="p-5">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4 mx-auto"
              >
                <FileText className="w-6 h-6 text-purple-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">Comprehensive Reports</h3>
              <p className="text-sm text-center text-gray-600">Receive detailed reports on your website's SEO metrics and performance.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            className="w-64 bg-white rounded-2xl shadow-md overflow-hidden transform transition-all duration-300"
          >
            <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
            <div className="p-5">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4 mx-auto"
              >
                <Users className="w-6 h-6 text-green-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">Competitor Analysis</h3>
              <p className="text-sm text-center text-gray-600">Analyze your competitors and stay ahead in the SEO game.</p>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-200 p-1">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'analyzer'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Analyzer
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              History
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'analyzer' ? (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleAnalyze} className="max-w-xl mx-auto mb-8">
                <div className="flex gap-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL"
                    required
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm transition-colors duration-200"
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-xl mx-auto mb-8 p-4 bg-red-100 text-red-700 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-7xl mx-auto"
                >
                  <div ref={resultsRef} className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-semibold">Overall Score</h2>
                          <div className="w-32 h-32">
                            <Doughnut data={getChartData(results.overallScore)} />
                          </div>
                        </div>
                      </div>

                      {Object.entries(results).map(([key, value]) => {
                        if (key === 'overallScore' || key === 'aiSuggestions') return null;
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold capitalize">{key}</h3>
                              {typeof value.score === 'number' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{value.score}%</span>
                                  <div className={`w-3 h-3 rounded-full ${getScoreColor(value.score)}`} />
                                </div>
                              )}
                            </div>

                            {value.content && (
                              <p className="text-sm text-gray-600 mb-2">
                                Content: {value.content}
                              </p>
                            )}

                            {Object.entries(value).map(([subKey, subValue]) => {
                              if (['score', 'content', 'suggestions'].includes(subKey)) return null;
                              return (
                                <p key={subKey} className="text-sm text-gray-600 mb-2">
                                  {subKey}: {typeof subValue === 'object' ? JSON.stringify(subValue) : subValue}
                                </p>
                              );
                            })}

                            {value.suggestions && value.suggestions.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                  {value.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  {renderPerformanceCharts(results)}
                  
                  {results.aiSuggestions && (
                    <div className="my-8 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAISuggestions(!showAISuggestions)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                      >
                        <Lightbulb className="w-5 h-5" />
                        {showAISuggestions ? "Hide AI Suggestions" : "Show AI Suggestions"}
                      </motion.button>
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {showAISuggestions && renderAISuggestions(results.aiSuggestions)}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Analysis History</h2>
                <div className="grid gap-4">
                  {history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 break-all">{entry.url}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <span className="text-sm font-medium">Score: {entry.overall_score}%</span>
                          <div className={`w-3 h-3 rounded-full ${getScoreColor(entry.overall_score)}`} />
                        </div>
                        <button
                          onClick={() => handleDeleteHistory(entry.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-center text-gray-600">No analysis history yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-16 text-center text-gray-600">
        <p className="flex items-center justify-center gap-2">
          <BarChart2 className="w-4 h-4" />
          AI-Powered SEO Analyzer © 2025
        </p>
      </footer>
    </div>
  );
}

export default App; 