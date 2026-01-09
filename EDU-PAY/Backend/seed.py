from extensions import db
from models import Invoice, Payment, Student, User, FeeComponent


def seed_demo_data():
    # 1. Users
    if User.query.filter_by(email="admin@edupay.local").count() == 0:
        admin = User(name="Admin User", email="admin@edupay.local", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)

    if User.query.filter_by(email="jane.doe@example.com").count() == 0:
        student_user = User(name="Jane Doe", email="jane.doe@example.com", role="student")
        student_user.set_password("student123")
        db.session.add(student_user)

    # 2. Students
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

        # 4. Invoices & Payments (History)
        invoice = Invoice(
            invoice_no="INV-DEMO-001",
            student_id=student.id,
            amount_paise=250000,
            currency="INR",
            items=[{"label": "Tuition Fee", "amount": 250000}],
            status="created",
        )
        db.session.add(invoice)
        db.session.flush()

        payment = Payment(
            student_id=student.id,
            invoice=invoice,
            invoice_no=invoice.invoice_no,
            amount_paise=invoice.amount_paise,
            currency="INR",
            status="captured", # Mark as paid for reports
        )
        db.session.add(payment)

    # 3. Fees
    if FeeComponent.query.count() == 0:
        fees = [
            FeeComponent(name="Tuition Fee", amount=50000, category="Academic", mandatory=True),
            FeeComponent(name="Library Fee", amount=2000, category="Facilities", mandatory=True),
            FeeComponent(name="Exam Fee", amount=1500, category="Examination", mandatory=True),
            FeeComponent(name="Bus Fee", amount=12000, category="Transport", mandatory=False),
        ]
        for f in fees:
            db.session.add(f)

    db.session.commit()


if __name__ == "__main__":
    from app import create_app

    app = create_app()
    with app.app_context():
        db.create_all()
        seed_demo_data()
        print("Seed data inserted.")

