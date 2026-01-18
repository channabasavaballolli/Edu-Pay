from extensions import db
from models import Invoice, Payment, Student, User


def seed_demo_data():
    if User.query.count() == 0:
        admin = User(name="Admin User", email="admin@edupay.local", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)

    if Student.query.count() == 0:
        student = Student(
            name="Jane Doe",
            regno="EDU001",
            course="B.Tech Computer Science",
            phone="+91-9999999999",
            email="jane.doe@example.com",
        )
        db.session.add(student)
        db.session.flush()

        invoice = Invoice(
            invoice_no="INV-DEMO-001",
            student_id=student.id,
            amount_paise=250000,
            currency="INR",
            items=[{"label": "Tuition Fee", "amount": 250000}],
            status="created",
        )
        db.session.add(invoice)

        payment = Payment(
            student_id=student.id,
            invoice=invoice,
            invoice_no=invoice.invoice_no,
            amount_paise=invoice.amount_paise,
            currency="INR",
            status="created",
        )
        db.session.add(payment)

    db.session.commit()


if __name__ == "__main__":
    from app import create_app

    app = create_app()
    with app.app_context():
        db.create_all()
        seed_demo_data()
        print("Seed data inserted.")

