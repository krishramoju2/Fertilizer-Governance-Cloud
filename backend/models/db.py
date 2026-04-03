from pymongo import MongoClient
import urllib.parse
import logging
import traceback

logger = logging.getLogger(__name__)

# ==================== CONFIG INIT ====================
def init_config(config_collection):
    """Initialize configuration document with default dropdown values"""
    try:
        config = config_collection.find_one({'_id': 'dropdowns'})

        if not config:
            default_config = {
                '_id': 'dropdowns',
                'soil_types': ['Loamy', 'Sandy', 'Clayey', 'Black', 'Red'],
                'crop_types': [
                    'Maize', 'Sugarcane', 'Cotton', 'Wheat', 'Paddy',
                    'Barley', 'Millets', 'Pulses', 'Ground Nuts',
                    'Oil seeds', 'Tobacco'
                ],
                'fertilizer_names': [
                    'Urea', 'DAP', '14-35-14', '28-28',
                    '17-17-17', '20-20', '10-26-26'
                ]
            }

            config_collection.insert_one(default_config)
            logger.info("✅ Initialized config dropdowns")
        else:
            logger.info("✅ Config already exists")

    except Exception as e:
        logger.error(f"Error initializing config: {e}")


# ==================== MONGODB CONNECTION ====================
def get_mongo_connection():
    try:
        username = "krishramoju"
        password = "Krish161205"
        cluster = "cluster0.svleqvv.mongodb.net"
        database = "fertilizer_db"

        encoded_password = urllib.parse.quote_plus(password)

        mongo_uri = f"mongodb+srv://{username}:{encoded_password}@{cluster}/{database}?retryWrites=true&w=majority&appName=Cluster0"

        logger.info("Connecting to MongoDB...")

        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

        # test connection
        client.admin.command('ping')
        logger.info("✅ MongoDB ping successful")

        db = client[database]

        users_collection = db['users']
        history_collection = db['history']
        config_collection = db['config']

        # indexes
        try:
            users_collection.create_index('email', unique=True)
        except Exception as e:
            logger.warning(f"Index warning: {e}")

        try:
            history_collection.create_index([('user_id', 1), ('timestamp', -1)])
        except Exception as e:
            logger.warning(f"Index warning: {e}")

        # init config
        init_config(config_collection)

        return client, db, users_collection, history_collection, config_collection

    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        logger.error(traceback.format_exc())
        raise


# ==================== INIT CONNECTION ====================
try:
    client, db, users_collection, history_collection, config_collection = get_mongo_connection()
    DB_CONNECTED = True
except Exception as e:
    logger.critical(f"Failed to connect: {e}")
    client = db = users_collection = history_collection = config_collection = None
    DB_CONNECTED = False


# ==================== HELPERS ====================
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc


def check_db_connection():
    return DB_CONNECTED
