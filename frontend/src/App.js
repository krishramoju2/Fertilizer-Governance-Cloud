import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// API Configuration
const API_BASE = process.env.REACT_APP_API_URL || "https://fertilizer-backend-jj59.onrender.com";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
});

// Add token to requests
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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);

  if (!token) {
    return <AuthScreen setToken={setToken} setCurrentUser={setCurrentUser} />;
  }
  return <Dashboard token={token} setToken={setToken} currentUser={currentUser} setCurrentUser={setCurrentUser} />;
}

function AuthScreen({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    soil_type: 'Loamy',
    farm_size: '1',
    location: '',
    primary_crops: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soilTypes, setSoilTypes] = useState([]);

  // Fetch soil types for registration dropdown
  useEffect(() => {
    const fetchSoilTypes = async () => {
      try {
        const res = await api.get('/config/soil-types');
        if (res.data.success) setSoilTypes(res.data.data);
      } catch (err) {
        console.error('Failed to fetch soil types', err);
      }
    };
    fetchSoilTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;
      const response = await api.post(endpoint, payload);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>🌾 FarmAdvisor</h1>
        <p style={styles.authSubtitle}>{isLogin ? 'Welcome Back!' : 'Register Your Farm'}</p>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.authForm}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength="6"
          />
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Your Name"
                style={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <select
                style={styles.input}
                value={formData.soil_type}
                onChange={(e) => setFormData({...formData, soil_type: e.target.value})}
              >
                {soilTypes.map(type => (
                  <option key={type} value={type}>{type} Soil</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Farm Size (hectares)"
                style={styles.input}
                value={formData.farm_size}
                onChange={(e) => setFormData({...formData, farm_size: e.target.value})}
                step="0.1"
                min="0.1"
              />
              <input
                type="text"
                placeholder="Location"
                style={styles.input}
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </>
          )}
          <button type="submit" style={styles.authButton} disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <p style={styles.authToggle}>
          {isLogin ? "New farmer? " : "Already have an account? "}
          <button style={styles.toggleButton} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Dashboard({ token, setToken, currentUser, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dropdown options (dynamic)
  const [soilTypes, setSoilTypes] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [fertilizerNames, setFertilizerNames] = useState([]);

  // ==================== CHANGED: Analysis inputs now use stored weather data ====================
  const [inputs, setInputs] = useState({
    Temparature: currentUser?.farm_details?.temperature || 26,  // <-- CHANGED: uses stored temp
    Moisture: currentUser?.farm_details?.humidity || 45,        // <-- CHANGED: uses stored humidity
    Soil_Type: currentUser?.farm_details?.soil_type || 'Loamy',
    Crop_Type: 'Maize',
    Fertilizer_Name: 'Urea',
    Fertilizer_Quantity: 30
  });
  
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Admin state
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [adminManageType, setAdminManageType] = useState('soil'); // soil, crop, fertilizer
  const [newItem, setNewItem] = useState('');

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Fetch dropdown options
  const fetchConfig = useCallback(async () => {
    try {
      const [soilRes, cropRes, fertRes] = await Promise.all([
        api.get('/config/soil-types'),
        api.get('/config/crop-types'),
        api.get('/config/fertilizer-names')
      ]);
      if (soilRes.data.success) setSoilTypes(soilRes.data.data);
      if (cropRes.data.success) setCropTypes(cropRes.data.data);
      if (fertRes.data.success) setFertilizerNames(fertRes.data.data);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, []);

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      const [historyRes, analyticsRes] = await Promise.all([
        api.get('/history'),
        api.get('/analytics')
      ]);
      if (historyRes.data.success) setHistory(historyRes.data.history || []);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // Load admin users
  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  // Load user analytics for selected user
  const loadUserAnalytics = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/analytics/${userId}`);
      if (res.data.success) setUserAnalytics(res.data.analytics);
    } catch (err) {
      console.error('Error loading user analytics:', err);
    }
  }, []);

  // Load user history for selected user
  const loadUserHistory = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/history/${userId}`);
      if (res.data.success) setUserHistory(res.data.history);
    } catch (err) {
      console.error('Error loading user history:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
    if (currentUser) {
      loadUserData();
      if (currentUser.is_admin) {
        loadUsers();
      }
    }
  }, [currentUser, fetchConfig, loadUserData, loadUsers]);

  // Run analysis
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await api.post('/predict', inputs);
      if (response.data.success) {
        setResult(response.data.result);
        showMessage('Analysis completed successfully!');
        loadUserData(); // Refresh history and analytics
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF (unchanged)
  const generatePDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFillColor(26, 71, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('FarmAdvisor Analysis Report', 15, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Farmer: ${currentUser?.name || 'Farmer'}`, 15, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 47);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Parameters:', 15, 60);

    autoTable(doc, {
      startY: 65,
      head: [['Parameter', 'Value']],
      body: [
        ['Temperature', `${inputs.Temparature}°C`],
        ['Moisture', `${inputs.Moisture}%`],
        ['Soil Type', inputs.Soil_Type],
        ['Crop Type', inputs.Crop_Type],
        ['Fertilizer', inputs.Fertilizer_Name],
        ['Quantity', `${inputs.Fertilizer_Quantity} kg/ha`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [46, 125, 50] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Results:', 15, finalY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Compatibility: ${result.overall_compatibility}`, 20, finalY + 10);
    doc.text(`Overall Score: ${result.overall_score}%`, 20, finalY + 17);
    doc.text(`Temperature: ${result.temperature_status} (${result.temperature_range})`, 20, finalY + 24);
    doc.text(`Moisture: ${result.moisture_status} (${result.moisture_range})`, 20, finalY + 31);
    doc.text(`Soil Compatibility: ${result.soil_compatibility}`, 20, finalY + 38);
    doc.text(`Quantity: ${result.quantity_status}`, 20, finalY + 45);

    if (result.suggestions && result.suggestions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Suggestions:', 15, finalY + 60);
      doc.setFont('helvetica', 'normal');
      result.suggestions.forEach((s, i) => {
        doc.text(`• ${s}`, 20, finalY + 67 + (i * 7));
      });
    }

    doc.save(`FarmReport_${inputs.Crop_Type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Admin: add item
  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    try {
      let endpoint = '';
      if (adminManageType === 'soil') endpoint = '/admin/config/soil-types';
      else if (adminManageType === 'crop') endpoint = '/admin/config/crop-types';
      else endpoint = '/admin/config/fertilizer-names';

      const res = await api.post(endpoint, { item: newItem });
      if (res.data.success) {
        showMessage('Item added');
        setNewItem('');
        fetchConfig(); // refresh dropdowns
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to add', 'error');
    }
  };

  // Admin: remove item
  const handleRemoveItem = async (item) => {
    try {
      let endpoint = '';
      if (adminManageType === 'soil') endpoint = `/admin/config/soil-types/${encodeURIComponent(item)}`;
      else if (adminManageType === 'crop') endpoint = `/admin/config/crop-types/${encodeURIComponent(item)}`;
      else endpoint = `/admin/config/fertilizer-names/${encodeURIComponent(item)}`;

      const res = await api.delete(endpoint);
      if (res.data.success) {
        showMessage('Item removed');
        fetchConfig(); // refresh dropdowns
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to remove', 'error');
    }
  };

  // When a user is selected from admin panel
  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    loadUserAnalytics(userId);
    loadUserHistory(userId);
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🌾 FarmAdvisor Pro</h1>
          <p style={styles.welcome}>Welcome, {currentUser?.name || 'Farmer'}!</p>
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
          {currentUser?.is_admin && (
            <button
              style={styles.navButton(activeTab === 'admin')}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          )}
          <button
            style={styles.navButton(false, true)}
            onClick={() => {
              localStorage.removeItem('token');
              setToken(null);
              setCurrentUser(null);
            }}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Message */}
      {message.text && (
        <div style={message.type === 'error' ? styles.errorMessage : styles.successMessage}>
          {message.text}
        </div>
      )}

      <main style={styles.main}>
        {activeTab === 'analysis' && (
          <div style={styles.analysisGrid}>
            {/* Input Section */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Farm Inputs</h2>
              <div style={styles.inputGrid}>
                <div>
                  <label style={styles.label}>Temperature (°C)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={inputs.Temparature}
                    onChange={(e) => setInputs({...inputs, Temparature: e.target.value})}
                    step="0.1"
                    min="0"
                    max="50"
                  />
                </div>
                <div>
                  <label style={styles.label}>Moisture (%)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={inputs.Moisture}
                    onChange={(e) => setInputs({...inputs, Moisture: e.target.value})}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label style={styles.label}>Soil Type</label>
                  <select
                    style={styles.input}
                    value={inputs.Soil_Type}
                    onChange={(e) => setInputs({...inputs, Soil_Type: e.target.value})}
                  >
                    {soilTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Crop Type</label>
                  <select
                    style={styles.input}
                    value={inputs.Crop_Type}
                    onChange={(e) => setInputs({...inputs, Crop_Type: e.target.value})}
                  >
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Fertilizer</label>
                  <select
                    style={styles.input}
                    value={inputs.Fertilizer_Name}
                    onChange={(e) => setInputs({...inputs, Fertilizer_Name: e.target.value})}
                  >
                    {fertilizerNames.map(fert => (
                      <option key={fert} value={fert}>{fert}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Quantity (kg/ha)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={inputs.Fertilizer_Quantity}
                    onChange={(e) => setInputs({...inputs, Fertilizer_Quantity: e.target.value})}
                    step="1"
                    min="0"
                    max="200"
                  />
                </div>
              </div>
              <button
                style={styles.analyzeButton}
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : '🔬 Analyze'}
              </button>
            </div>

            {/* Results Section */}
            <div>
              {result && (
                <div style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <h2 style={styles.resultTitle}>{result.overall_compatibility}</h2>
                    <div style={styles.scoreCircle}>
                      <span style={styles.scoreNumber}>{result.overall_score}%</span>
                      <span style={styles.scoreLabel}>Overall</span>
                    </div>
                  </div>
                  <div style={styles.resultGrid}>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Temperature</span>
                      <span style={styles.resultValue}>{result.temperature_status}</span>
                      <span style={styles.resultDetail}>{result.temperature_range}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Moisture</span>
                      <span style={styles.resultValue}>{result.moisture_status}</span>
                      <span style={styles.resultDetail}>{result.moisture_range}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Soil</span>
                      <span style={styles.resultValue}>{result.soil_compatibility}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Quantity</span>
                      <span style={styles.resultValue}>{result.quantity_status}</span>
                      <span style={styles.resultDetail}>{result.quantity_range}</span>
                    </div>
                  </div>
                  <div style={styles.suggestionsBox}>
                    <h3 style={styles.suggestionsTitle}>💡 Suggestions</h3>
                    {result.suggestions.map((s, i) => (
                      <p key={i} style={styles.suggestion}>• {s}</p>
                    ))}
                  </div>
                  <button style={styles.pdfButton} onClick={generatePDF}>
                    📄 Download PDF Report
                  </button>
                </div>
              )}

              {/* History */}
              <div style={styles.historyCard}>
                <h3 style={styles.cardTitle}>Recent Analyses</h3>
                {history.length === 0 ? (
                  <p style={styles.emptyText}>No analyses yet</p>
                ) : (
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
                      {history.map((item, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{item.crop_type}</td>
                          <td style={styles.td}>{item.fertilizer}</td>
                          <td style={{ ...styles.td, color: item.compatibility?.includes('Highly') ? '#27ae60' : '#e67e22' }}>
                            {item.compatibility}
                          </td>
                          <td style={styles.td}>{item.score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={styles.analyticsContainer}>
            {analytics ? (
              <>
                {/* Summary Cards */}
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <span style={styles.summaryValue}>{analytics.total_analyses}</span>
                    <span style={styles.summaryLabel}>Total Analyses</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <span style={styles.summaryValue}>{analytics.compatibility_rate}%</span>
                    <span style={styles.summaryLabel}>Success Rate</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <span style={styles.summaryValue}>{analytics.average_score}%</span>
                    <span style={styles.summaryLabel}>Avg Score</span>
                  </div>
                </div>

                {/* Crop Distribution */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Crop Distribution</h3>
                  <div style={styles.chartList}>
                    {Object.entries(analytics.crop_distribution || {}).map(([crop, count]) => (
                      <div key={crop} style={styles.chartItem}>
                        <span>{crop}</span>
                        <span style={styles.chartBar}>
                          <span style={{ ...styles.chartFill, width: `${(count / analytics.total_analyses) * 100}%` }} />
                        </span>
                        <span>{count} times</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fertilizer Usage */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Fertilizer Usage</h3>
                  <div style={styles.chartList}>
                    {Object.entries(analytics.fertilizer_distribution || {}).map(([fert, count]) => (
                      <div key={fert} style={styles.chartItem}>
                        <span>{fert}</span>
                        <span style={styles.chartBar}>
                          <span style={{ ...styles.chartFill, width: `${(count / analytics.total_analyses) * 100}%` }} />
                        </span>
                        <span>{count} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p>Loading analytics...</p>
            )}
          </div>
        )}

        {activeTab === 'admin' && currentUser?.is_admin && (
          <div style={styles.adminContainer}>
            <h2 style={styles.adminTitle}>Admin Panel</h2>

            {/* Tabs within admin */}
            <div style={styles.adminTabs}>
              <button
                style={styles.adminTab(adminManageType === 'soil')}
                onClick={() => setAdminManageType('soil')}
              >
                Soil Types
              </button>
              <button
                style={styles.adminTab(adminManageType === 'crop')}
                onClick={() => setAdminManageType('crop')}
              >
                Crop Types
              </button>
              <button
                style={styles.adminTab(adminManageType === 'fertilizer')}
                onClick={() => setAdminManageType('fertilizer')}
              >
                Fertilizers
              </button>
              <button
                style={styles.adminTab(adminManageType === 'users')}
                onClick={() => setAdminManageType('users')}
              >
                Users
              </button>
            </div>

            {/* Content based on adminManageType */}
            <div style={styles.adminContent}>
              {adminManageType === 'soil' && (
                <div style={styles.manageSection}>
                  <h3>Manage Soil Types</h3>
                  <div style={styles.addItemRow}>
                    <input
                      type="text"
                      placeholder="New soil type"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      style={styles.input}
                    />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {soilTypes.map(type => (
                      <li key={type} style={styles.listItem}>
                        {type}
                        <button onClick={() => handleRemoveItem(type)} style={styles.removeButton}>×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {adminManageType === 'crop' && (
                <div style={styles.manageSection}>
                  <h3>Manage Crop Types</h3>
                  <div style={styles.addItemRow}>
                    <input
                      type="text"
                      placeholder="New crop type"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      style={styles.input}
                    />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {cropTypes.map(crop => (
                      <li key={crop} style={styles.listItem}>
                        {crop}
                        <button onClick={() => handleRemoveItem(crop)} style={styles.removeButton}>×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {adminManageType === 'fertilizer' && (
                <div style={styles.manageSection}>
                  <h3>Manage Fertilizer Names</h3>
                  <div style={styles.addItemRow}>
                    <input
                      type="text"
                      placeholder="New fertilizer"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      style={styles.input}
                    />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {fertilizerNames.map(fert => (
                      <li key={fert} style={styles.listItem}>
                        {fert}
                        <button onClick={() => handleRemoveItem(fert)} style={styles.removeButton}>×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {adminManageType === 'users' && (
                <div style={styles.userSection}>
                  <h3>All Users</h3>
                  <div style={styles.userGrid}>
                    <div style={styles.userList}>
                      {users.map(user => (
                        <div
                          key={user._id}
                          style={styles.userCard(selectedUserId === user._id)}
                          onClick={() => handleSelectUser(user._id)}
                        >
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                          <span style={styles.userBadge}>{user.is_admin ? 'Admin' : 'User'}</span>
                        </div>
                      ))}
                    </div>
                    {selectedUserId && (
                      <div style={styles.userDetails}>
                        <h4>User Analytics</h4>
                        {userAnalytics ? (
                          <>
                            <p>Total Analyses: {userAnalytics.total_analyses}</p>
                            <p>Success Rate: {userAnalytics.compatibility_rate}%</p>
                            <p>Avg Score: {userAnalytics.average_score}%</p>
                            <h5>Recent History</h5>
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
                                {userHistory.map((item, i) => (
                                  <tr key={i}>
                                    <td style={styles.td}>{item.crop_type}</td>
                                    <td style={styles.td}>{item.fertilizer}</td>
                                    <td style={styles.td}>{item.compatibility}</td>
                                    <td style={styles.td}>{item.score}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        ) : (
                          <p>Select a user to view analytics</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styles (completely unchanged)
const styles = {
  app: { backgroundColor: '#f5f7fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { backgroundColor: '#1a472a', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  title: { margin: 0, fontSize: '24px' },
  welcome: { margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 },
  nav: { display: 'flex', gap: '10px' },
  navButton: (active, logout = false) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: logout ? '#dc3545' : (active ? 'white' : 'rgba(255,255,255,0.2)'),
    color: logout ? 'white' : (active ? '#1a472a' : 'white'),
    cursor: 'pointer',
    fontWeight: 'bold'
  }),
  main: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  cardTitle: { margin: '0 0 20px 0', color: '#333', fontSize: '18px' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#666' },
  analyzeButton: { width: '100%', padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  resultCard: { backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  resultTitle: { margin: 0, fontSize: '24px', color: '#2c3e50' },
  scoreCircle: { backgroundColor: '#3498db', color: 'white', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { fontSize: '20px', fontWeight: 'bold' },
  scoreLabel: { fontSize: '10px', opacity: 0.9 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' },
  resultItem: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', textAlign: 'center' },
  resultLabel: { display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' },
  resultValue: { display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' },
  resultDetail: { display: 'block', fontSize: '11px', color: '#999', marginTop: '5px' },
  suggestionsBox: { backgroundColor: '#f0f9f1', padding: '20px', borderRadius: '5px', marginBottom: '20px' },
  suggestionsTitle: { margin: '0 0 10px 0', fontSize: '16px', color: '#27ae60' },
  suggestion: { margin: '5px 0', fontSize: '14px', color: '#555' },
  pdfButton: { width: '100%', padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  historyCard: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 0', borderBottom: '2px solid #eee', fontSize: '13px', color: '#666' },
  td: { padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
  emptyText: { textAlign: 'center', color: '#999', padding: '20px' },
  authContainer: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 100%)' },
  authCard: { backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  authTitle: { textAlign: 'center', color: '#1a472a', margin: '0 0 10px 0', fontSize: '28px' },
  authSubtitle: { textAlign: 'center', color: '#666', marginBottom: '30px' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  authButton: { padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  authToggle: { textAlign: 'center', marginTop: '20px', color: '#666' },
  toggleButton: { background: 'none', border: 'none', color: '#27ae60', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' },
  errorBox: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' },
  errorMessage: { position: 'fixed', top: '100px', right: '40px', backgroundColor: '#f8d7da', color: '#721c24', padding: '15px 25px', borderRadius: '5px', borderLeft: '4px solid #dc3545', zIndex: 1000 },
  successMessage: { position: 'fixed', top: '100px', right: '40px', backgroundColor: '#d4edda', color: '#155724', padding: '15px 25px', borderRadius: '5px', borderLeft: '4px solid #28a745', zIndex: 1000 },
  analyticsContainer: { display: 'flex', flexDirection: 'column', gap: '30px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  summaryCard: { backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
  summaryValue: { display: 'block', fontSize: '32px', fontWeight: 'bold', color: '#1a472a', marginBottom: '5px' },
  summaryLabel: { fontSize: '14px', color: '#666' },
  chartList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  chartItem: { display: 'grid', gridTemplateColumns: '100px 1fr 60px', alignItems: 'center', gap: '15px' },
  chartBar: { height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' },
  chartFill: { display: 'block', height: '100%', backgroundColor: '#3498db' },
  adminContainer: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  adminTitle: { margin: '0 0 20px 0', color: '#333', fontSize: '24px' },
  adminTabs: { display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '10px' },
  adminTab: (active) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: active ? '#1a472a' : '#f0f0f0',
    color: active ? 'white' : '#333',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal'
  }),
  adminContent: { padding: '10px 0' },
  manageSection: {},
  addItemRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  addButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  itemList: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
  removeButton: { background: 'none', border: 'none', color: '#dc3545', fontSize: '20px', cursor: 'pointer' },
  userSection: {},
  userGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' },
  userList: { maxHeight: '500px', overflowY: 'auto', borderRight: '1px solid #eee', paddingRight: '20px' },
  userCard: (selected) => ({
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: selected ? '#e8f5e9' : '#f8f9fa',
    border: selected ? '2px solid #1a472a' : '1px solid #ddd',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column'
  }),
  userBadge: { fontSize: '12px', color: '#666', marginTop: '5px' },
  userDetails: { paddingLeft: '20px' }
};

export default App;
