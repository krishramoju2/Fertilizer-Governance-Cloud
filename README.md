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
8. **Weather Auto-Fill** – Automatically fetches real-time temperature & humidity based on registered location – pre-fills analysis fields (users can still override). Uses free Open-Meteo API, no key required. Falls back to 26°C, 45% if location invalid.
