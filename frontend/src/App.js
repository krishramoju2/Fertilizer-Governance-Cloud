import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Replace with your actual Render URL
  API_BASE: process.env.REACT_APP_API_URL || "https://fertilizer-backend-jj59.onrender.com",
  APP_NAME: "FarmAdvisor Pro",
  VERSION: "2.0.0",
  CROPS: ['Maize', 'Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Vegetables', 'Fruits'],
  FERTILIZERS: ['Urea', 'DAP', 'MOP', 'NPK', 'Compost', 'Organic Mix'],
  COLORS: {
    primary: '#1a472a',
    secondary: '#2d5a27',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db',
    light: '#f8fbf9',
    dark: '#2c3e50'
  }
};

// ==================== AXIOS CONFIGURATION ====================

const api = axios.create({
  baseURL: CONFIG.API_BASE,
  timeout: 30000, // 30 seconds for cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout - server may be waking up'));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ==================== MAIN APP COMPONENT ====================

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('analysis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Show message and auto-hide
  const showMessage = (message, type = 'success') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  if (!token) {
    return <AuthScreen setToken={setToken} showMessage={showMessage} />;
  }

  return (
    <Dashboard 
      token={token} 
      setToken={setToken}
      loading={loading}
      setLoading={setLoading}
      error={error}
      success={success}
      showMessage={showMessage}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

// ==================== DASHBOARD COMPONENT ====================

function Dashboard({ token, setToken, loading, setLoading, error, success, showMessage, activeTab, setActiveTab }) {
  const [inputs, setInputs] = useState({
    Temparature: 26,
    Moisture: 45,
    Crop_Type: 'Maize',
    Fertilizer_Name: 'Urea',
    Fertilizer_Quantity: 50
  });
  
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  // ==================== DATA FETCHING ====================

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/history?page=${page}&limit=10`);
      if (response.data.success) {
        setHistory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      showMessage(err.message || 'Failed to fetch history', 'error');
    }
  }, [showMessage]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      showMessage(err.message || 'Failed to fetch analytics', 'error');
    }
  }, [showMessage]);

  // Load initial data
  useEffect(() => {
    if (token) {
      fetchHistory(1);
      fetchAnalytics();
    }
  }, [token, fetchHistory, fetchAnalytics]);

  // ==================== PREDICTION HANDLER ====================

  const handleRunAnalysis = async () => {
    // Validate inputs
    if (inputs.Temparature < 0 || inputs.Temparature > 50) {
      showMessage('Temperature must be between 0°C and 50°C', 'error');
      return;
    }
    if (inputs.Moisture < 0 || inputs.Moisture > 100) {
      showMessage('Moisture must be between 0% and 100%', 'error');
      return;
    }
    if (inputs.Fertilizer_Quantity < 0 || inputs.Fertilizer_Quantity > 500) {
      showMessage('Quantity must be between 0 and 500 kg/ha', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/predict', inputs);
      
      if (response.data.success) {
        setResult(response.data);
        showMessage('Analysis completed successfully!');
        
        // Refresh data
        await Promise.all([
          fetchHistory(1),
          fetchAnalytics()
        ]);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Analysis failed';
      showMessage(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PDF GENERATOR ====================

  const generatePDF = useCallback(() => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(CONFIG.COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(CONFIG.APP_NAME, 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 35);
    
    // Report ID
    const reportId = `FRM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    doc.text(`Report ID: ${reportId}`, pageWidth - 70, 35);
    
    // Farmer Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Soil Analysis Report', 20, 55);
    
    // Input Parameters Table
    doc.autoTable({
      startY: 65,
      head: [['Parameter', 'Value', 'Optimal Range']],
      body: [
        ['Crop Type', inputs.Crop_Type, '-'],
        ['Fertilizer', inputs.Fertilizer_Name, '-'],
        ['Temperature', `${inputs.Temparature}°C`, '15-35°C'],
        ['Soil Moisture', `${inputs.Moisture}%`, '30-75%'],
        ['Quantity', `${inputs.Fertilizer_Quantity} kg/ha`, '40-90 kg/ha']
      ],
      theme: 'striped',
      headStyles: { fillColor: CONFIG.COLORS.secondary }
    });
    
    // Results Section
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Results', 20, finalY);
    
    // Compatibility
    doc.setFontSize(12);
    doc.setTextColor(result.compatibility === 'Compatible' ? CONFIG.COLORS.success : CONFIG.COLORS.danger);
    doc.text(`Compatibility: ${result.compatibility}`, 20, finalY + 10);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const splitReason = doc.splitTextToSize(result.compatibility_reason, 170);
    doc.text(splitReason, 20, finalY + 20);
    
    // Quantity Status
    doc.setFont('helvetica', 'bold');
    doc.text(`Quantity Status: ${result.quantity_status}`, 20, finalY + 40);
    
    doc.setFont('helvetica', 'normal');
    const splitQuantity = doc.splitTextToSize(result.quantity_reason, 170);
    doc.text(splitQuantity, 20, finalY + 50);
    
    // Recommendations
    if (result.compatibility_recommendation) {
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations:', 20, finalY + 70);
      
      doc.setFont('helvetica', 'normal');
      const splitRec = doc.splitTextToSize(result.compatibility_recommendation, 170);
      doc.text(splitRec, 20, finalY + 80);
    }
    
    // Efficiency Score
    if (result.efficiency_score !== undefined) {
      doc.setFillColor(CONFIG.COLORS.info);
      doc.circle(170, finalY + 20, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${result.efficiency_score}%`, 165, finalY + 24);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text('Efficiency', 160, finalY + 32);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('© FarmAdvisor Pro - Smart Farming Solutions', 20, 280);
    doc.text('This report is AI-generated. Consult local agricultural experts.', 20, 285);
    
    // Save PDF
    doc.save(`FarmReport_${inputs.Crop_Type}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [result, inputs]);

  // ==================== CHART DATA ====================

  const chartData = useMemo(() => {
    if (!analytics) return null;

    return {
      compatibility: {
        labels: ['Compatible', 'Incompatible'],
        datasets: [{
          data: [
            analytics.compatibility_distribution?.Compatible || 0,
            analytics.compatibility_distribution?.Incompatible || 0
          ],
          backgroundColor: [CONFIG.COLORS.success, CONFIG.COLORS.danger],
          borderWidth: 0
        }]
      },
      efficiency: {
        labels: analytics.efficiency_trend?.map(item => item.date) || [],
        datasets: [{
          label: 'Efficiency Score',
          data: analytics.efficiency_trend?.map(item => item.score) || [],
          borderColor: CONFIG.COLORS.info,
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      crops: {
        labels: Object.keys(analytics.crop_distribution || {}),
        datasets: [{
          label: 'Analyses by Crop',
          data: Object.values(analytics.crop_distribution || {}),
          backgroundColor: CONFIG.COLORS.warning
        }]
      }
    };
  }, [analytics]);

  // ==================== RENDER ====================

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🌾 {CONFIG.APP_NAME}</h1>
          <span style={styles.version}>v{CONFIG.VERSION}</span>
        </div>
        
        <nav style={styles.nav}>
          <button 
            style={styles.navButton(activeTab === 'analysis')}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button 
            style={styles.navButton(activeTab === 'analytics')}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            style={styles.navButton(false, true)}
            onClick={() => {
              localStorage.clear();
              setToken(null);
            }}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Messages */}
      {(error || success) && (
        <div style={styles.messageContainer}>
          {error && <div style={styles.errorMessage}>{error}</div>}
          {success && <div style={styles.successMessage}>{success}</div>}
        </div>
      )}

      <main style={styles.main}>
        {activeTab === 'analysis' ? (
          <AnalysisTab
            inputs={inputs}
            setInputs={setInputs}
            result={result}
            loading={loading}
            onAnalyze={handleRunAnalysis}
            onGeneratePDF={generatePDF}
            history={history}
            pagination={pagination}
            onPageChange={fetchHistory}
          />
        ) : (
          <AnalyticsTab 
            analytics={analytics}
            chartData={chartData}
          />
        )}
      </main>
    </div>
  );
}

// ==================== ANALYSIS TAB COMPONENT ====================

function AnalysisTab({ 
  inputs, setInputs, result, loading, onAnalyze, onGeneratePDF,
  history, pagination, onPageChange 
}) {
  return (
    <div style={styles.analysisGrid}>
      {/* Input Section */}
      <section style={styles.card}>
        <h3 style={styles.cardTitle}>Soil & Crop Parameters</h3>
        
        <div style={styles.inputGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Temperature (°C)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.Temparature}
              onChange={(e) => setInputs({...inputs, Temparature: e.target.value})}
              min="0"
              max="50"
              step="0.1"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Soil Moisture (%)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.Moisture}
              onChange={(e) => setInputs({...inputs, Moisture: e.target.value})}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Crop Type</label>
            <select
              style={styles.select}
              value={inputs.Crop_Type}
              onChange={(e) => setInputs({...inputs, Crop_Type: e.target.value})}
            >
              {CONFIG.CROPS.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Fertilizer</label>
            <select
              style={styles.select}
              value={inputs.Fertilizer_Name}
              onChange={(e) => setInputs({...inputs, Fertilizer_Name: e.target.value})}
            >
              {CONFIG.FERTILIZERS.map(fert => (
                <option key={fert} value={fert}>{fert}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Quantity (kg/ha)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.Fertilizer_Quantity}
              onChange={(e) => setInputs({...inputs, Fertilizer_Quantity: e.target.value})}
              min="0"
              max="500"
              step="5"
            />
          </div>
        </div>

        <button
          style={styles.primaryButton(loading)}
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading ? '⚡ Waking up server...' : '🔬 Run AI Analysis'}
        </button>
      </section>

      {/* Results Section */}
      <section>
        {result && (
          <div style={{
            ...styles.card,
            borderTop: `8px solid ${
              result.compatibility === 'Compatible' 
                ? CONFIG.COLORS.success 
                : CONFIG.COLORS.danger
            }`
          }}>
            <div style={styles.resultHeader}>
              <h2 style={{
                ...styles.resultTitle,
                color: result.compatibility === 'Compatible' 
                  ? CONFIG.COLORS.success 
                  : CONFIG.COLORS.danger
              }}>
                {result.compatibility}
              </h2>
              
              {result.efficiency_score !== undefined && (
                <div style={styles.scoreBadge}>
                  <span style={styles.scoreValue}>{result.efficiency_score}%</span>
                  <span style={styles.scoreLabel}>Efficiency</span>
                </div>
              )}
            </div>

            <p style={styles.resultText}>{result.compatibility_reason}</p>

            {result.compatibility_recommendation && (
              <div style={styles.recommendationBox}>
                <strong>💡 Recommendation:</strong>
                <p style={styles.recommendationText}>
                  {result.compatibility_recommendation}
                </p>
              </div>
            )}

            <div style={styles.quantityBox}>
              <strong>📊 Quantity Status: {result.quantity_status}</strong>
              <p style={styles.quantityText}>{result.quantity_reason}</p>
              {result.quantity_recommendation && (
                <p style={styles.quantityText}>
                  <em>{result.quantity_recommendation}</em>
                </p>
              )}
            </div>

            <button style={styles.pdfButton} onClick={onGeneratePDF}>
              📄 Export PDF Report
            </button>
          </div>
        )}

        {/* History Section */}
        <div style={{...styles.card, marginTop: '20px'}}>
          <h3 style={styles.cardTitle}>Recent Analyses</h3>
          
          {history.length === 0 ? (
            <p style={styles.emptyText}>No analyses yet. Run your first analysis!</p>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Crop</th>
                    <th style={styles.th}>Fertilizer</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.crop_type}</td>
                      <td style={styles.td}>{item.fertilizer_name}</td>
                      <td style={{
                        ...styles.td,
                        color: item.compatibility === 'Compatible' 
                          ? CONFIG.COLORS.success 
                          : CONFIG.COLORS.danger,
                        fontWeight: 'bold'
                      }}>
                        {item.compatibility}
                      </td>
                      <td style={styles.td}>
                        {item.efficiency_score ? `${item.efficiency_score}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={styles.pagination}>
                  <button
                    style={styles.pageButton}
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    ←
                  </button>
                  <span style={styles.pageInfo}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    style={styles.pageButton}
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// ==================== ANALYTICS TAB COMPONENT ====================

function AnalyticsTab({ analytics, chartData }) {
  if (!analytics) {
    return (
      <div style={styles.card}>
        <p style={styles.emptyText}>Run some analyses to see insights!</p>
      </div>
    );
  }

  return (
    <div style={styles.analyticsGrid}>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Total Analyses</span>
          <span style={styles.summaryValue}>{analytics.summary?.total_analyses || 0}</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Success Rate</span>
          <span style={styles.summaryValue}>{analytics.summary?.success_rate || 0}%</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Avg Efficiency</span>
          <span style={styles.summaryValue}>{analytics.summary?.average_efficiency || 0}%</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Top Crop</span>
          <span style={styles.summaryValue}>{analytics.summary?.most_analyzed_crop || '-'}</span>
        </div>
      </div>

      {/* Charts */}
      {chartData && (
        <>
          <div style={styles.chartRow}>
            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>Compatibility Overview</h4>
              <div style={styles.chartContainer}>
                <Doughnut 
                  data={chartData.compatibility}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </div>
            </div>

            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>Efficiency Trend</h4>
              <div style={styles.chartContainer}>
                <Line 
                  data={chartData.efficiency}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, max: 100 }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Crop Distribution</h4>
            <div style={{...styles.chartContainer, height: '300px'}}>
              <Bar 
                data={chartData.crops}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== AUTH SCREEN COMPONENT ====================

function AuthScreen({ setToken, showMessage }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      if (mode === 'register') {
        payload.name = formData.name || formData.email.split('@')[0];
      }

      const response = await api.post(`/${mode}`, payload);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        showMessage(`${mode === 'login' ? 'Login' : 'Registration'} successful!`);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Authentication failed';
      showMessage(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <div style={styles.authHeader}>
          <h1 style={styles.authTitle}>🌾 {CONFIG.APP_NAME}</h1>
          <p style={styles.authSubtitle}>
            {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.authForm}>
          {mode === 'register' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name (Optional)</label>
              <input
                type="text"
                style={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Farmer Name"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="farmer@example.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            style={styles.authButton(loading)}
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.authToggle}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            style={styles.toggleButton}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>

        <p style={styles.authNote}>
          Note: First request may take 30-60 seconds while server wakes up
        </p>
      </div>
    </div>
  );
}

// ==================== STYLES ====================

const styles = {
  app: {
    backgroundColor: CONFIG.COLORS.light,
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  header: {
    background: CONFIG.COLORS.primary,
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  },
  
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 600
  },
  
  version: {
    fontSize: '12px',
    opacity: 0.8,
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 8px',
    borderRadius: '20px'
  },
  
  nav: {
    display: 'flex',
    gap: '10px'
  },
  
  navButton: (active, logout = false) => ({
    padding: '10px 24px',
    border: 'none',
    borderRadius: '30px',
    background: logout 
      ? '#d9534f' 
      : active 
        ? 'white' 
        : 'rgba(255,255,255,0.15)',
    color: logout 
      ? 'white' 
      : active 
        ? CONFIG.COLORS.primary 
        : 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  }),
  
  main: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  
  card: {
    background: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
  },
  
  cardTitle: {
    margin: '0 0 25px 0',
    color: CONFIG.COLORS.secondary,
    fontSize: '20px',
    fontWeight: 600
  },
  
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '25px'
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  
  input: {
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #eef2f6',
    fontSize: '15px',
    transition: 'border-color 0.3s',
    outline: 'none',
    ':focus': {
      borderColor: CONFIG.COLORS.primary
    }
  },
  
  select: {
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #eef2f6',
    fontSize: '15px',
    background: 'white',
    cursor: 'pointer',
    outline: 'none'
  },
  
  primaryButton: (loading) => ({
    width: '100%',
    padding: '16px',
    background: loading ? '#95a5a6' : CONFIG.COLORS.success,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      transform: loading ? 'none' : 'translateY(-2px)',
      boxShadow: loading ? 'none' : '0 10px 20px rgba(39, 174, 96, 0.3)'
    }
  }),
  
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '30px'
  },
  
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  
  resultTitle: {
    margin: 0,
    fontSize: '28px'
  },
  
  scoreBadge: {
    background: CONFIG.COLORS.info,
    color: 'white',
    padding: '12px',
    borderRadius: '50%',
    width: '70px',
    height: '70px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  scoreValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1.2'
  },
  
  scoreLabel: {
    fontSize: '10px',
    opacity: 0.9
  },
  
  resultText: {
    color: '#444',
    lineHeight: '1.6',
    fontSize: '16px',
    marginBottom: '20px'
  },
  
  recommendationBox: {
    background: '#e8f5e9',
    padding: '20px',
    borderRadius: '12px',
    margin: '20px 0'
  },
  
  recommendationText: {
    margin: '10px 0 0 0',
    color: '#2e7d32'
  },
  
  quantityBox: {
    background: '#fff3e0',
    padding: '20px',
    borderRadius: '12px',
    margin: '20px 0'
  },
  
  quantityText: {
    margin: '10px 0 0 0',
    color: '#bf8c4a'
  },
  
  pdfButton: {
    background: CONFIG.COLORS.dark,
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s',
    ':hover': {
      background: '#1e2b38'
    }
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  
  th: {
    textAlign: 'left',
    padding: '12px 0',
    borderBottom: '2px solid #eef2f6',
    color: '#666',
    fontSize: '13px',
    fontWeight: 600
  },
  
  td: {
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px'
  },
  
  pageButton: {
    padding: '8px 16px',
    border: '2px solid #eef2f6',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  
  pageInfo: {
    fontSize: '14px',
    color: '#666'
  },
  
  messageContainer: {
    position: 'fixed',
    top: '100px',
    right: '40px',
    zIndex: 1000
  },
  
  errorMessage: {
    background: '#fee',
    color: CONFIG.COLORS.danger,
    padding: '15px 25px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(231, 76, 60, 0.2)',
    borderLeft: `4px solid ${CONFIG.COLORS.danger}`
  },
  
  successMessage: {
    background: '#e8f5e9',
    color: CONFIG.COLORS.success,
    padding: '15px 25px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(39, 174, 96, 0.2)',
    borderLeft: `4px solid ${CONFIG.COLORS.success}`
  },
  
  analyticsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  
  summaryCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  
  summaryLabel: {
    display: 'block',
    color: '#666',
    fontSize: '14px',
    marginBottom: '10px'
  },
  
  summaryValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: CONFIG.COLORS.primary
  },
  
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px'
  },
  
  chartCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
  },
  
  chartTitle: {
    margin: '0 0 20px 0',
    color: CONFIG.COLORS.secondary,
    fontSize: '18px'
  },
  
  chartContainer: {
    height: '250px',
    position: 'relative'
  },
  
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontSize: '16px'
  },
  
  authContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: `linear-gradient(135deg, ${CONFIG.COLORS.primary} 0%, ${CONFIG.COLORS.secondary} 100%)`
  },
  
  authCard: {
    background: 'white',
    padding: '50px',
    borderRadius: '30px',
    width: '450px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  },
  
  authHeader: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  
  authTitle: {
    color: CONFIG.COLORS.primary,
    fontSize: '32px',
    margin: '0 0 10px 0'
  },
  
  authSubtitle: {
    color: '#666',
    fontSize: '16px',
    margin: 0
  },
  
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  authButton: (loading) => ({
    ...styles.primaryButton(loading),
    marginTop: '10px'
  }),
  
  authToggle: {
    textAlign: 'center',
    marginTop: '25px',
    color: '#666'
  },
  
  toggleButton: {
    background: 'none',
    border: 'none',
    color: CONFIG.COLORS.primary,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  
  authNote: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '12px',
    color: '#999'
  }
};

export default App;