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

**Chatbot Sample Test Cases**

a)Temperature 30, moisture 60, soil loamy, crop wheat, urea 40 kg ; 
b)Temp 25°C and moisture 50%, growing maize with NPK 30 kg ; 
c)28°C, 45% moisture, sandy soil, rice crop, using DAP 35 kg ; 

d)It is hot with high moisture, I am growing rice in clayey soil using urea ; 
e)Weather is cool and low moisture, crop is wheat, fertilizer DAP 25 kg ; 
f)Warm climate, medium moisture, maize crop with NPK fertilizer ; 































