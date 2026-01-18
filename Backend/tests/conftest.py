import pytest

from app import create_app
from config import TestConfig
from extensions import db
from models import Student, User


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()

        admin = User(name="Test Admin", email="admin@test.com", role="admin")
        admin.set_password("password123")
        db.session.add(admin)

        student = Student(
            name="Test Student",
            regno="REG123",
            course="MBA",
            phone="9999999999",
            email="student@test.com",
        )
        db.session.add(student)
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    token = resp.json["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

