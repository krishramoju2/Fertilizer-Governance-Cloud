







from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CREATE APP ====================
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key')

# ==================== CORS - WIDE OPEN FOR TESTING ====================
# This allows ALL origins - once working, restrict it
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["*"], supports_credentials=True)

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


@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    from models.db import check_db_connection
    if request.method == 'OPTIONS':
        return '', 200
    db_status = check_db_connection()
    return jsonify({'status': 'ok', 'database': 'connected' if db_status else 'disconnected'})


@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    if request.method == 'OPTIONS':
        return '', 200
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

