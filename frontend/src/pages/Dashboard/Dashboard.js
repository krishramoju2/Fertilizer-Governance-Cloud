import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chatbot from "../../components/Chatbot/Chatbot";
import MLModel from "../../components/ML/MLModel";


function Dashboard({ token, setToken, currentUser, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dropdown options (dynamic)
  const [soilTypes, setSoilTypes] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [fertilizerNames, setFertilizerNames] = useState([]);

  // Analysis inputs - start with defaults
  const [inputs, setInputs] = useState({
    Temperature: 26,
    Moisture: 45,
    Soil_Type: 'Loamy',
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
  const [adminManageType, setAdminManageType] = useState('soil');
  const [newItem, setNewItem] = useState('');

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // ============ FIX: Update inputs when currentUser loads with weather data ============
  useEffect(() => {
    if (currentUser?.farm_details) {
      console.log('Loading weather data:', {
        temperature: currentUser.farm_details.temperature,
        humidity: currentUser.farm_details.humidity,
        soil_type: currentUser.farm_details.soil_type
      });
      
      setInputs(prev => ({
        ...prev,
        Temperature: currentUser.farm_details.temperature || prev.Temperature,
        Moisture: currentUser.farm_details.humidity || prev.Moisture,
        Soil_Type: currentUser.farm_details.soil_type || prev.Soil_Type
      }));
    }
  }, [currentUser]);

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

  // Generate PDF
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
        ['Temperature', `${inputs.Temperature}°C`],
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
            style={styles.navButton(activeTab === 'ml')}
            onClick={() => setActiveTab('ml')}
          >
            ML Model 
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
            style={styles.navButton(activeTab === 'chat')}
            onClick={() => setActiveTab('chat')}
          >
            Chatbot
          </button>
            
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
                    value={inputs.Temperature}
                    onChange={(e) => setInputs({...inputs, Temperature: e.target.value})}
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
                      <th>Crop</th>
                      <th>Fertilizer</th>
                      <th>Compatibility</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                  
                      {history.map((item, i) => {
                      const input = item.input_data || {};
                      const result = item.result || {};
                  
                      return (
                        <tr key={i}>

                          <td style={styles.td}>
                            {input.Crop_Type || input.crop || item.crop || "N/A"}
                          </td>
                          
                          <td style={styles.td}>
                            {input.Fertilizer_Name || input.fertilizer || item.fertilizer || "N/A"}
                          </td>
                        
                  
                          <td
                            style={{
                              ...styles.td,
                              color: result.overall_compatibility?.includes('Highly')
                                ? '#27ae60'
                                : '#e67e22'
                            }}
                          >
                            {result.overall_compatibility || "N/A"}
                          </td>
                  
                          <td style={styles.td}>
                          {result.overall_score !== undefined ? `${result.overall_score}%` : "N/A"}
                          </td>                  
                  
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ml' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ML Model Analysis</h2>
            <MLModel />
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
           {activeTab === 'chat' && (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Farm Chatbot</h2>
      <Chatbot />
    </div>
  )}
      </main>
    </div>

 );
const styles = {
  app: {
    padding: "20px",
    background: "#f5f5f5",
    minHeight: "100vh"
  },
  header: {
    background: "#1a472a",
    color: "white",
    padding: "15px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  button: {
    padding: "8px 12px",
    margin: "5px",
    border: "none",
    borderRadius: "5px",
    background: "#1a472a",
    color: "white",
    cursor: "pointer"
  }
};
} 



export default Dashboard;
