import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// ✅ Use plain Chart.js with ALL required components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  // ✅ ADD CONTROLLERS:
  DoughnutController,
  LineController,
  BarController,
  // ✅ ADD SCALES:
  RadialLinearScale
} from 'chart.js';

// ✅ Register EVERYTHING Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  // ✅ CONTROLLERS:
  DoughnutController,
  LineController,
  BarController,
  // ✅ SCALES:
  RadialLinearScale
);

// ✅ FIX: Trimmed trailing spaces in URL
const API_BASE = "https://ideal-giggle-jjg9p4rqrqr73pxxw-5000.app.github.dev";

const FERTILIZERS = ['Urea', 'DAP', '14-35-14', '28-28', '20-20', '17-17-17', '10-26-26'];
const SOIL_TYPES = ['Sandy', 'Loamy', 'Black', 'Red', 'Clayey'];
const CROP_TYPES = ['Maize', 'Sugarcane', 'Cotton', 'Tobacco', 'Paddy', 'Barley', 'Wheat', 'Millets', 'Oil seeds', 'Pulses', 'Ground Nuts'];

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('token') || null
  });
  
  const [farm, setFarm] = useState(null);
  const [showAuth, setShowAuth] = useState('login');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', location: '', farm_size: '', soil_type: 'Loamy'
  });
  
  const [inputs, setInputs] = useState({
    Temparature: 26,
    Humidity: 52,
    Moisture: 38,
    Crop_Type: 'Maize',
    Nitrogen: 37,
    Potassium: 0,
    Phosphorous: 0,
    Fertilizer_Name: 'Urea',
    Fertilizer_Quantity: 50
  });
  
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ NEW: Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  
  // ✅ NEW: Chart canvas refs
  const successRateChartRef = useRef(null);
  const usageTrendChartRef = useRef(null);
  const riskTrendChartRef = useRef(null);
  const cropDistChartRef = useRef(null);

  // ✅ FIX: Wrap fetch functions in useCallback
  const fetchFarm = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/farm`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setFarm(res.data);
    } catch (e) { console.error("Fetch farm failed:", e); }
  }, [auth.token]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      console.log("📜 History response:", res.data);
      if (res.data && res.data.length > 0) {
        console.log("📋 First record structure:", Object.keys(res.data[0]));
      }
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) { 
      console.error("❌ History fetch failed:", e); 
    }
  }, [auth.token]);

  const fetchAnalytics = useCallback(async () => {
    if (!auth.token) return;
    setAnalyticsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/farmer-analytics`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setAnalytics(res.data);
      console.log("📊 Analytics loaded:", res.data);
    } catch (e) {
      console.error("❌ Analytics fetch failed:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [auth.token]);

  useEffect(() => {
    if (auth.token) {
      fetchFarm();
      fetchHistory();
      fetchAnalytics();
    }
  }, [auth.token, fetchFarm, fetchHistory, fetchAnalytics]);

  // ✅ NEW: Chart rendering functions (plain Chart.js)
  const renderSuccessRateChart = useCallback((data) => {
    if (!successRateChartRef.current) return;
    
    // Destroy existing chart if any
    const existing = ChartJS.getChart(successRateChartRef.current);
    if (existing) existing.destroy();
    
    new ChartJS(successRateChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Compatible', 'Incompatible'],
        datasets: [{
          data: [
            data?.Compatible || 0,
            data?.Incompatible || 0
          ],
          backgroundColor: ['#27ae60', '#e74c3c'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12 } }
        }
      }
    });
  }, []);

  const renderUsageTrendChart = useCallback((labels, quantities) => {
    if (!usageTrendChartRef.current || !labels) return;
    
    const existing = ChartJS.getChart(usageTrendChartRef.current);
    if (existing) existing.destroy();
    
    new ChartJS(usageTrendChartRef.current, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Fertilizer Quantity (kg/acre)',
          data: quantities,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'kg/acre' } }
        }
      }
    });
  }, []);

  const renderRiskTrendChart = useCallback((labels, riskScores) => {
    if (!riskTrendChartRef.current || !labels) return;
    
    const existing = ChartJS.getChart(riskTrendChartRef.current);
    if (existing) existing.destroy();
    
    new ChartJS(riskTrendChartRef.current, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Risk Score',
          data: riskScores,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 100,
            title: { display: true, text: 'Risk Score (0-100)' },
            grid: {
              color: (context) => {
                if (context.tick.value === 25) return '#27ae60';
                if (context.tick.value === 50) return '#f39c12';
                return '#eee';
              }
            }
          }
        }
      }
    });
  }, []);

  const renderCropDistributionChart = useCallback((cropData) => {
    if (!cropDistChartRef.current || !cropData) return;
    
    const existing = ChartJS.getChart(cropDistChartRef.current);
    if (existing) existing.destroy();
    
    const labels = Object.keys(cropData);
    const data = Object.values(cropData);
    const colors = ['#27ae60', '#3498db', '#9b59b6', '#f39c12', '#e74c3c', '#1abc9c', '#34495e'];
    
    new ChartJS(cropDistChartRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Analyses',
          data: data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Crop Type' } },
          y: { beginAtZero: true, title: { display: true, text: 'Analyses' } }
        }
      }
    });
  }, []);

  // ✅ Render charts when analytics data loads
  useEffect(() => {
    if (analytics && analytics.total_analyses > 0) {
      if (analytics.compatibility_distribution) {
        renderSuccessRateChart(analytics.compatibility_distribution);
      }
      if (analytics.time_series?.dates) {
        renderUsageTrendChart(analytics.time_series.dates, analytics.time_series.quantities);
        renderRiskTrendChart(analytics.time_series.dates, analytics.time_series.risk_scores);
      }
      if (analytics.crop_distribution) {
        renderCropDistributionChart(analytics.crop_distribution);
      }
    }
  }, [analytics, renderSuccessRateChart, renderUsageTrendChart, renderRiskTrendChart, renderCropDistributionChart]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/register`, registerData);
      localStorage.setItem('token', res.data.token);
      setAuth({ isAuthenticated: true, user: res.data.user, token: res.data.token });
      setFarm(res.data.farm);
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/login`, loginData);
      localStorage.setItem('token', res.data.token);
      setAuth({ isAuthenticated: true, user: res.data.user, token: res.data.token });
    } catch (e) {
      setError(e.response?.data?.error || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth({ isAuthenticated: false, user: null, token: null });
    setFarm(null);
    setResult(null);
    setHistory([]);
    setAnalytics(null);
  };

  const handleRunAnalysis = async () => {
    if (!auth.token) { setShowAuth('login'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      if (inputs.Fertilizer_Quantity <= 0) {
        throw new Error("Fertilizer quantity must be greater than 0");
      }

      const payload = {
        ...inputs,
        Soil_Type: farm?.soil_type || 'Loamy'
      };

      const res = await axios.post(`${API_BASE}/predict`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setResult(res.data);
      await fetchHistory();
      await fetchAnalytics();
    } catch (e) {
      console.error("Prediction error:", e);
      setError(e.response?.data?.error || e.message || "Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result || !farm) return;
    
    try {
      const response = await axios.post(`${API_BASE}/generate-report`, {
        result: result,
        inputs: inputs,
        farm: farm
      }, {
        headers: { Authorization: `Bearer ${auth.token}` },
        responseType: 'text'
      });
      
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          // newWindow.print();
        };
      }
    } catch (e) {
      console.error("Report generation failed:", e);
      setError("Failed to generate report. Please try again.");
    }
  };

  const handleInputChange = (key, value) => {
    setInputs(prev => ({
      ...prev,
      [key]: key.includes('Type') || key === 'Fertilizer_Name' ? value : +value
    }));
  };

  if (!auth.isAuthenticated) {
    return (
      <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
        <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '30px' }}>
          🌾 Fertilizer Compatibility & Quantity Advisor
        </h2>
        
        <div style={{ 
          maxWidth: '500px', 
          margin: '40px auto', 
          background: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
        }}>
          <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              onClick={() => setShowAuth('login')} 
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: showAuth === 'login' ? '#27ae60' : '#ecf0f1', 
                color: showAuth === 'login' ? 'white' : '#2c3e50',
                border: 'none', 
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.3s'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => setShowAuth('register')} 
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: showAuth === 'register' ? '#27ae60' : '#ecf0f1',
                color: showAuth === 'register' ? 'white' : '#2c3e50',
                border: 'none', 
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.3s'
              }}
            >
              Register
            </button>
          </div>

          {showAuth === 'login' && (
            <form onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Email" 
                value={loginData.email} 
                onChange={e => setLoginData({...loginData, email: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginData.password} 
                onChange={e => setLoginData({...loginData, password: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                required 
              />
              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Login
              </button>
            </form>
          )}

          {showAuth === 'register' && (
            <form onSubmit={handleRegister}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={registerData.name} 
                onChange={e => setRegisterData({...registerData, name: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                required 
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={registerData.email} 
                onChange={e => setRegisterData({...registerData, email: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={registerData.password} 
                onChange={e => setRegisterData({...registerData, password: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                required 
              />
              <input 
                type="text" 
                placeholder="Farm Location" 
                value={registerData.location} 
                onChange={e => setRegisterData({...registerData, location: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
              />
              <input 
                type="number" 
                placeholder="Farm Size (acres)" 
                value={registerData.farm_size} 
                onChange={e => setRegisterData({...registerData, farm_size: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
              />
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Soil Type (Consistent for this farm)</label>
              <select 
                value={registerData.soil_type} 
                onChange={e => setRegisterData({...registerData, soil_type: e.target.value})} 
                style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              >
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Register Farmer
              </button>
            </form>
          )}
          
          {error && (
            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', borderLeft: '4px solid #c62828' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>🌾 Fertilizer Advisor</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#7f8c8d' }}>Welcome, <strong>{auth.user?.name}</strong></span>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ✅ NEW: Tab Navigation */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 30px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('analysis')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'analysis' ? '#27ae60' : '#ecf0f1',
            color: activeTab === 'analysis' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.3s'
          }}
        >
          🔍 Fertilizer Analysis
        </button>
        <button 
          onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'analytics' ? '#3498db' : '#ecf0f1',
            color: activeTab === 'analytics' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.3s'
          }}
        >
          📊 Analytics Dashboard
        </button>
      </div>

      {farm && activeTab === 'analysis' && (
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto 30px', 
          background: '#e8f8f5', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #27ae60',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>📍 Farm:</strong> {farm.location || 'Not set'} &nbsp;|&nbsp; 
            <strong>Size:</strong> {farm.farm_size || 0} acres
          </div>
          <div style={{ fontWeight: '600', color: '#27ae60' }}>
            🌱 Soil Type: {farm.soil_type} <span style={{ fontSize: '12px', color: '#7f8c8d' }}>(consistent)</span>
          </div>
        </div>
      )}
      
      {/* ✅ Show Analysis Tab Content */}
      {activeTab === 'analysis' && (
        <>
          <div style={{ 
            maxWidth: '900px', 
            margin: '0 auto', 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ marginTop: 0, color: '#34495e' }}>📋 Input Parameters</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {['Temparature', 'Humidity', 'Moisture'].map(key => (
                <div key={key}>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                    type="number" 
                    value={inputs[key]} 
                    onChange={e => handleInputChange(key, e.target.value)} 
                  />
                </div>
              ))}

              {[
                { key: 'Crop_Type', label: 'Crop Type', options: CROP_TYPES },
                { key: 'Fertilizer_Name', label: 'Fertilizer Name', options: FERTILIZERS }
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <select 
                    value={inputs[key]}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                    onChange={e => handleInputChange(key, e.target.value)}
                  >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}

              {['Nitrogen', 'Potassium', 'Phosphorous'].map(key => (
                <div key={key}>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    {key} (kg/ha)
                  </label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                    type="number" 
                    min="0"
                    value={inputs[key]} 
                    onChange={e => handleInputChange(key, e.target.value)} 
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Fertilizer Quantity (kg/acre)
                </label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                  type="number" 
                  min="1"
                  value={inputs.Fertilizer_Quantity} 
                  onChange={e => handleInputChange('Fertilizer_Quantity', e.target.value)} 
                />
              </div>
            </div>
            
            <button 
              onClick={handleRunAnalysis} 
              disabled={loading}
              style={{ 
                width: '100%', 
                marginTop: '25px', 
                padding: '14px', 
                backgroundColor: loading ? '#95a5a6' : '#27ae60', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s'
              }}
            >
              {loading ? "🔄 Analyzing Compatibility..." : "✅ Run Fertilizer Analysis"}
            </button>
            
            {error && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', borderLeft: '4px solid #c62828' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {result && (
            <div style={{ 
              maxWidth: '900px', 
              margin: '30px auto', 
              padding: '25px', 
              backgroundColor: 'white', 
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              borderLeft: `8px solid ${
                result.compatibility === 'Compatible' && result.quantity_status === 'Optimal' ? '#27ae60' :
                result.compatibility === 'Compatible' ? '#f39c12' : '#e74c3c'
              }`
            }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50' }}>📊 Analysis Results</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>🔗 Compatibility</strong>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: result.compatibility === 'Compatible' ? '#27ae60' : '#e74c3c', margin: '10px 0' }}>
                    {result.compatibility}
                  </p>
                  <p style={{ fontSize: '14px', color: '#7f8c8d' }}>{result.compatibility_reason}</p>
                </div>
                
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>⚖️ Quantity Assessment</strong>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: {
                    'Optimal': '#27ae60',
                    'Slightly High': '#f39c12',
                    'Too High': '#e74c3c',
                    'Low': '#3498db'
                  }[result.quantity_status], margin: '10px 0' }}>
                    {result.quantity_status}
                  </p>
                  <p style={{ fontSize: '14px', color: '#7f8c8d' }}>{result.quantity_reason}</p>
                </div>
              </div>
              
              {result.recommendations && result.recommendations.length > 0 && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                  <strong>💡 Recommendations</strong>
                  <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
                    {result.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '5px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.suggested_fertilizer && result.compatibility !== 'Compatible' && (
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
                  <strong>🔄 Suggested Alternative:</strong> Consider <strong>{result.suggested_fertilizer}</strong> for better compatibility with {inputs.Crop_Type} in <strong>{farm?.soil_type}</strong> soil.
                </div>
              )}
              
              {/* ✅ NEW: PDF Download Button */}
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                  onClick={handleDownloadReport}
                  style={{ 
                    padding: '12px 30px', 
                    background: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#2980b9'}
                  onMouseOut={(e) => e.target.style.background = '#3498db'}
                >
                  📄 Download PDF Report
                </button>
              </div>
            </div>
          )}

          {/* ✅ FIX: Robust history table */}
          <div style={{ maxWidth: '900px', margin: '40px auto' }}>
            <h4 style={{ color: '#2c3e50' }}>📜 Recent Analysis History</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#34495e', color: 'white' }}>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Crop</th>
                    <th>Soil</th>
                    <th>Fertilizer</th>
                    <th>Qty</th>
                    <th>Compatibility</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history && history.length > 0 ? (
                    history.slice(-10).reverse().map((item, i) => {
                      const inputData = item.input_data || item || {};
                      const crop = inputData.Crop_Type || item.crop_type || 'N/A';
                      const soil = inputData.Soil_Type || item.soil_type || farm?.soil_type || 'N/A';
                      const fertilizer = inputData.Fertilizer_Name || item.recommended_fertilizer || item.fertilizer || 'N/A';
                      const quantity = inputData.Fertilizer_Quantity || item.quantity || item.fertilizer_quantity || 'N/A';
                      const compatibility = item.compatibility || item.Compatibility || 'N/A';
                      const qtyStatus = item.quantity_status || item.status || 'N/A';
                      
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{crop}</td>
                          <td>{soil}</td>
                          <td>{fertilizer}</td>
                          <td>{quantity} kg</td>
                          <td style={{ 
                            fontWeight: '600', 
                            color: compatibility === 'Compatible' ? '#27ae60' : '#e74c3c' 
                          }}>
                            {compatibility}
                          </td>
                          <td style={{ 
                            fontWeight: '600',
                            color: qtyStatus === 'Optimal' ? '#27ae60' : 
                                   qtyStatus === 'Too High' ? '#e74c3c' : '#f39c12'
                          }}>
                            {qtyStatus}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '25px', textAlign: 'center', color: '#7f8c8d' }}>
                        🌱 No analysis records yet. Run your first compatibility check above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ✅ NEW: Analytics Tab Content (Plain Chart.js - Fixed Registration) */}
      {activeTab === 'analytics' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          {analyticsLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
              📊 Loading analytics...
            </div>
          ) : !analytics || analytics.total_analyses === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
              🌱 No analytics data yet. Run your first fertilizer analysis to see insights!
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#e8f8f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{analytics.success_rate}%</div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Success Rate</div>
                </div>
                <div style={{ background: '#ebf5fb', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{analytics.total_analyses}</div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Total Analyses</div>
                </div>
                <div style={{ background: '#fef9e7', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f39c12' }}>₹{analytics.cost_summary?.total_season_cost?.toLocaleString() || 0}</div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Est. Season Cost</div>
                </div>
                <div style={{ background: '#fdedec', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e74c3c' }}>{analytics.npk_averages?.nitrogen || 0}</div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Avg Nitrogen (kg/ha)</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                
                {/* Success Rate Donut */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>✅ Compatibility Success Rate</h4>
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <canvas ref={successRateChartRef}></canvas>
                  </div>
                </div>

                {/* Usage Trend Line */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📈 Fertilizer Usage Trend</h4>
                  <div style={{ height: '250px' }}>
                    <canvas ref={usageTrendChartRef}></canvas>
                  </div>
                </div>

                {/* Risk Score Trend */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>⚠️ Risk Score Over Time</h4>
                  <div style={{ height: '250px' }}>
                    <canvas ref={riskTrendChartRef}></canvas>
                  </div>
                </div>

                {/* Crop Distribution Bar */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🌾 Crop Distribution</h4>
                  <div style={{ height: '250px' }}>
                    <canvas ref={cropDistChartRef}></canvas>
                  </div>
                </div>
                
              </div>
              
              {/* Additional Insights */}
              {analytics.quantity_status_distribution && (
                <div style={{ marginTop: '25px', background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>⚖️ Quantity Assessment Summary</h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {Object.entries(analytics.quantity_status_distribution).map(([status, count]) => (
                      <div key={status} style={{ 
                        padding: '10px 20px', 
                        borderRadius: '6px', 
                        background: {
                          'Optimal': '#d5f5e3',
                          'Slightly High': '#fef9e7',
                          'Too High': '#fdedec',
                          'Too Low': '#ebf5fb'
                        }[status] || '#f8f9fa',
                        color: {
                          'Optimal': '#27ae60',
                          'Slightly High': '#f39c12',
                          'Too High': '#e74c3c',
                          'Too Low': '#3498db'
                        }[status] || '#2c3e50',
                        fontWeight: '600'
                      }}>
                        {status}: {count} ({Math.round(count/analytics.total_analyses*100)}%)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;