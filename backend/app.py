# ==================== IMPORT BLUEPRINTS ====================
from routes.auth_routes import auth_bp
from routes.history_routes import history_bp
from routes.predict_routes import predict_bp
from routes.ml_routes import ml_bp
from routes.chat_routes import chat_bp
from routes.config_routes import config_bp
from routes.analytics_routes import analytics_bp
from routes.admin_routes import admin_bp

# ==================== REGISTER BLUEPRINTS ====================
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(history_bp, url_prefix='/api')
app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(ml_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(config_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')

# ==================== DIRECT ROUTES (NO BLUEPRINT) ====================
@app.route('/api/config/soil-types', methods=['GET', 'OPTIONS'])
def get_soil_types_direct():
    """Direct route for soil types - no auth required"""
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'soil_types' in config:
            soil_types = config['soil_types']
        else:
            soil_types = ['Loamy', 'Sandy', 'Clay', 'Black', 'Red']
        return jsonify({'success': True, 'data': soil_types})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/config/crop-types', methods=['GET', 'OPTIONS'])
def get_crop_types_direct():
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'crop_types' in config:
            crop_types = config['crop_types']
        else:
            crop_types = ['Maize', 'Wheat', 'Rice', 'Millets', 'Cotton']
        return jsonify({'success': True, 'data': crop_types})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/config/fertilizer-names', methods=['GET', 'OPTIONS'])
def get_fertilizer_names_direct():
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'fertilizer_names' in config:
            fertilizer_names = config['fertilizer_names']
        else:
            fertilizer_names = ['Urea', 'DAP', 'Potash', 'NPK']
        return jsonify({'success': True, 'data': fertilizer_names})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    from models.db import check_db_connection
    if request.method == 'OPTIONS':
        return '', 200
    db_status = check_db_connection()
    return jsonify({'status': 'ok', 'database': 'connected' if db_status else 'disconnected'})


@app.route('/', methods=['GET'])
def home():
    return jsonify({'success': True, 'message': 'API is running'})

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

import threading
import time
import requests

def keep_alive():
    """Background thread to ping the server every 10 minutes (600 seconds) to prevent Render from sleeping."""
    while True:
        try:
            # Wait for 10 minutes
            time.sleep(600)
            # Ping the backend's own health endpoint.
            # Using the production URL if available, otherwise fallback to localhost
            url = "https://fertilizer-backend-jj59.onrender.com/api/health"
            response = requests.get(url, timeout=10)
            logger.info(f"Keep-alive ping successful: {response.status_code}")
        except Exception as e:
            logger.warning(f"Keep-alive ping failed: {e}")

# Start the keep-alive thread in the background
keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
keep_alive_thread.start()
logger.info("Keep-alive background thread started.")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
```
