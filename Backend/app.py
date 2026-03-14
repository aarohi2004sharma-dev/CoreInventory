from flask import Flask
from config import Config
from database import db
from flask_cors import CORS

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)
    
    with app.app_context():
        # Import models so they are registered in SQLAlchemy metadata
        from models import user_model, product_model, stock_model
        db.create_all()
        
    # Register Blueprints
    from routes.auth_routes import auth_bp
    from routes.product_routes import product_bp
    from routes.inventory_routes import inventory_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.warehouse_routes import warehouse_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(warehouse_bp)
        
    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'message': 'CoreInventory API is running'}
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
