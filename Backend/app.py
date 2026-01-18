import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from config import get_config
from extensions import db, jwt, migrate
from routes.auth import auth_bp
from routes.payments import payments_bp
from routes.reports import reports_bp
from routes.students import students_bp
from seed import seed_demo_data


def create_app(config_class=None):
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(config_class or get_config())

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
        supports_credentials=True,
    )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(reports_bp)

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"success": False, "error": "Not found"}), 404

    @app.errorhandler(400)
    def bad_request(err):
        return (
            jsonify({"success": False, "error": getattr(err, "description", "Bad request")}),
            400,
        )

    @app.cli.command("seed")
    def seed_command():
        """Seed demo data into the database."""
        seed_demo_data()
        print("Database seeded with demo data.")

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

