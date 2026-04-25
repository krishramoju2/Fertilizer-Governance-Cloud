1. **User Authentication** - Register and login with JWT based authentication
2. **Farm Profile** - Save soil type, farm size, location, primary crops.
3. **Fertilizer Analysis** - Input temperature, moisture, soil type, crop , and     fertilizer quantity to get:
    --> Compatibility Status
    --> Overall Score
    --> Temperature and moisture suitability range
    --> Soil Compatibility
    --> Quantity Recommendation
    --> Actionable suggestions
4. **Analysis History** - View last 20 anayses with corp, fertilizer, status, and score.
5. **PDF Report**- Download a PDF summary of any analysis.
6. **Admin Features**
    --> Manage Dropdowns : Add or remove soil types, crop types, and fertilizer 
        changes reflect immediately for all users.
    --> User Analytics : View any user's analytics
7. **Admin Credentials:**
email - admin@farm.com
password - admin123
8. **Chatbot**
The FarmAdvisor Chatbot is an intelligent assistant designed to help farmers make better decisions about crop selection and fertilizer usage. It understands both natural language (e.g., “hot weather with low moisture”) and structured inputs (like temperature, moisture, and soil type) to provide practical, easy-to-understand recommendations. The chatbot analyzes farm conditions and suggests improvements to maximize crop yield and efficiency.
9. **Hyperparameter Tuning (Model Optimization)**
a) **n_estimators**
Number of trees in the forest.
More trees → better accuracy (usually), but slower performance.
b) **max_depth**
Maximum depth of each decision tree.
Lower values prevent overfitting, while higher values allow more complex learning.
c) **min_samples_split**
Minimum number of data points needed to split a node into two.
Higher value → fewer splits → simpler model.
d) **min_samples_leaf**
Minimum number of data points allowed in a final node (leaf).
Higher value → smoother and more stable predictions.

10. **Pickle-Based Data Storage Module**
This module uses Python’s pickle mechanism to store and load preprocessed datasets efficiently. Instead of reading data from CSV files every time the system runs, the dataset is serialized and saved as a .pkl file. This significantly reduces loading time and improves application performance.

11. **LangChain Integration (Smart Input Processing)**
The system integrates LangChain to build a structured and intelligent data processing pipeline for the chatbot. Using a sequence of modular steps, user input is cleaned, semantically interpreted, and converted into structured parameters such as temperature, moisture, soil type, crop, and fertilizer details. This enables the chatbot to understand both natural language inputs (e.g., “hot weather with low moisture”) and numeric inputs efficiently. 

12. **Google Authentication**
In the system provides a fast and secure way for users to access the platform using their existing Google accounts. Instead of manually registering with an email and password, users can sign in through Google OAuth, which returns a credential token (JWT) on the frontend. This token is sent to the backend, where it is decoded to extract user information such as email and name. The backend then generates its own JWT to manage the user session securely. This approach eliminates the need for password storage, reduces security risks, and enables automatic user registration for first-time logins. It also improves user experience by simplifying the login process while maintaining secure communication between frontend and backend using token-based authentication.

13. **Integration of ReactBits for Advanced UI Components**
The frontend incorporates ReactBits, a collection of modern and reusable UI components, to enhance the visual experience and interactivity of the application. Features such as animated backgrounds (e.g., Silk effect), infinite scrolling menus, and dynamic card layouts are implemented using ReactBits to create a smooth and engaging interface. These components improve usability by providing intuitive navigation and visually appealing transitions, making the platform more accessible and enjoyable for users. The use of ReactBits also promotes modular design, allowing easy scalability and consistent styling across the application.



**Chatbot Sample Test Cases**

a)Temperature 30, moisture 60, soil loamy, crop wheat, urea 40 kg ; 
b)Temp 25°C and moisture 50%, growing maize with NPK 30 kg ; 
c)28°C, 45% moisture, sandy soil, rice crop, using DAP 35 kg ; 

d)It is hot with high moisture, I am growing rice in clayey soil using urea ; 
e)Weather is cool and low moisture, crop is wheat, fertilizer DAP 25 kg ; 
f)Warm climate, medium moisture, maize crop with NPK fertilizer ; 






















import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Galaxy from "../../components/Auth/Galaxy";


export default function AuthScreen({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [soilTypes, setSoilTypes] = useState(["Loamy", "Sandy", "Clay"]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "", 
    name: "",
    soil_type: "Loamy",
    farm_size: "1",
    location: "",
    primary_crops: []
  });

  useEffect(() => {
    let retries = 0;
  
    const fetchSoilTypes = async () => {
      try {
        const res = await api.get("/config/soil-types");
        if (res.data.success) setSoilTypes(res.data.data);
      } catch (err) {
        console.error("Soil types fetch failed:", err);
  
        if (retries < 3) {
          retries++;
          setTimeout(fetchSoilTypes, 2000);
        } else {
          // ✅ fallback so UI never breaks
          setSoilTypes(["Loamy", "Sandy", "Clay"]);
        }
      }
    };
  
    fetchSoilTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isLogin ? "/login" : "/register";

      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        localStorage.setItem("token", res.data.data?.token || res.data.token);
        setToken(res.data.data?.token || res.data.token);
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Auth failed");
    }
  };

  return (

      <div style={styles.container}>
        <div style={styles.bgLayer}>
          <Galaxy
            mouseRepulsion
            mouseInteraction
            density={1}
            glowIntensity={0.3}
            saturation={0}
            hueShift={140}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            repulsionStrength={2}
            autoCenterRepulsion={0}
            starSpeed={0.5}
            speed={1}
          />
        </div>
    
        <div style={styles.overlay} />
    
        <div style={styles.card}>
    
        <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          {!isLogin && (
            <>
              <input
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={formData.soil_type}
                onChange={(e) =>
                  setFormData({ ...formData, soil_type: e.target.value })
                }
              >
                <option value="">Select Soil Type</option>
              
                {soilTypes && soilTypes.length > 0 ? (
                  soilTypes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                ) : (
                  <option>Loading...</option>
                )}
              </select>
            </>
          )}

          <button type="submit" style={styles.button}>
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

                
        
                {/* GOOGLE LOGIN */}
        <div style={styles.divider}>OR</div>
        
        <div style={styles.googleWrapper}>
          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const response = await api.post("/google-login", {
                  credential: res.credential
                });
        
                if (response.data.success) {
                  localStorage.setItem("token", response.data.token);
                  setToken(response.data.token);
                  setCurrentUser(response.data.user);
                }
              } catch {
                setError("Google login failed");
              }
            }}
            onError={() => setError("Google login failed")}
          />
        </div>
                    



        <button
          style={styles.switch}
          onClick={() => setIsLogin(!isLogin)}
        >
          Switch to {isLogin ? "Register" : "Login"}
        </button>
          
      </div>
    </div>
  );
} // ✅ THIS WAS MISSING

/* ✅ STYLES OUTSIDE COMPONENT */
const styles = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    overflow: "hidden"
  },


  overlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 30% 20%, rgba(26,71,42,0.25), rgba(0,0,0,0.45))",
    zIndex: 1
  },
    
  card: {
    position: "relative",
    zIndex: 2,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "15px",
    width: "350px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
    textAlign: "center"
  },
  
  title: {
    marginBottom: "20px",
    color: "#1a472a",
    fontSize: "24px",
    fontWeight: "600"
  },

  divider: {
    margin: "18px 0",
    textAlign: "center",
    color: "#777",
    fontSize: "13px",
    fontWeight: "500"
  },
  
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px"
  },

  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px"
  },
  
  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px"
  },
  switch: {
    marginTop: "15px",
    background: "none",
    border: "none",
    color: "#2e7d32",
    cursor: "pointer",
    fontWeight: "500"
  },

  bgLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 0
  },
  
  error: {
    color: "red",
    marginBottom: "10px"
  }
};








