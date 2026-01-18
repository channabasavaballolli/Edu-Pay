from datetime import datetime

from flask import Blueprint, request, send_file, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from extensions import db
from models import Payment, Student
from utils import json_response
from pathlib import Path
from datetime import datetime as dt
from weasyprint import HTML
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import csv
import io

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("", methods=["GET"])
def reports_index():
    start = _parse_date(request.args.get("from"))
    end = _parse_date(request.args.get("to"))

    payment_query = Payment.query.filter_by(status="captured")
    if start:
        payment_query = payment_query.filter(Payment.created_at >= start)
    if end:
        payment_query = payment_query.filter(Payment.created_at <= end)

    total_collected = (
        payment_query.with_entities(func.coalesce(func.sum(Payment.amount_paise), 0)).scalar() or 0
    )

    course_breakdown = (
        db.session.query(Student.course, func.coalesce(func.sum(Payment.amount_paise), 0))
        .join(Payment, Payment.student_id == Student.id)
        .filter(Payment.status == "captured")
    )
    if start:
        course_breakdown = course_breakdown.filter(Payment.created_at >= start)
    if end:
        course_breakdown = course_breakdown.filter(Payment.created_at <= end)

    by_course = [
        {"course": course or "Unknown", "amount": amount}
        for course, amount in course_breakdown.group_by(Student.course).all()
    ]

    defaulters = []
    students = Student.query.all()
    for student in students:
        outstanding = student.outstanding_amount()
        if outstanding > 0:
            defaulters.append({"studentId": student.id, "amount": outstanding})

    data = {
        "totalCollected": total_collected,
        "byCourse": by_course,
        "defaulters": defaulters,
    }
    return json_response(True, data)


@reports_bp.route("/export", methods=["GET"])
def export_report():
    report_type = (request.args.get("type") or "daily").lower()
    fmt = (request.args.get("format") or "pdf").lower()

    # Reuse the same aggregation as reports_index
    start = _parse_date(request.args.get("from"))
    end = _parse_date(request.args.get("to"))

    payment_query = Payment.query.filter_by(status="captured")
    if start:
        payment_query = payment_query.filter(Payment.created_at >= start)
    if end:
        payment_query = payment_query.filter(Payment.created_at <= end)

    total_collected = (
        payment_query.with_entities(func.coalesce(func.sum(Payment.amount_paise), 0)).scalar() or 0
    )

    course_breakdown = (
        db.session.query(Student.course, func.coalesce(func.sum(Payment.amount_paise), 0))
        .join(Payment, Payment.student_id == Student.id)
        .filter(Payment.status == "captured")
    )
    if start:
        course_breakdown = course_breakdown.filter(Payment.created_at >= start)
    if end:
        course_breakdown = course_breakdown.filter(Payment.created_at <= end)

    by_course = [
        {"course": course or "Unknown", "amount": amount}
        for course, amount in course_breakdown.group_by(Student.course).all()
    ]

    defaulters = []
    students = Student.query.all()
    for student in students:
        outstanding = student.outstanding_amount()
        if outstanding > 0:
            defaulters.append({"studentId": student.id, "amount": outstanding})

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Section", "Key", "Value"])
        writer.writerow(["Summary", "TotalCollected", total_collected / 100])
        writer.writerow(["Course", "Name", "Amount"])
        for item in by_course:
            writer.writerow(["Course", item["course"], item["amount"] / 100])
        writer.writerow(["Defaulter", "StudentId", "Amount"])
        for d in defaulters:
            writer.writerow(["Defaulter", d["studentId"], d["amount"] / 100])
        mem = io.BytesIO(output.getvalue().encode("utf-8"))
        filename = f"BEC_{report_type}_report.csv"
        return send_file(mem, mimetype="text/csv", download_name=filename, as_attachment=True)

    # pdf
    title = f"Basaveshwar Engineering College (BEC) {report_type.capitalize()} Report"
    html = f"""
    <html><head><meta charset='utf-8'>
    <style>body {{ font-family: Arial, sans-serif; padding: 24px; }} h1 {{ text-align:center; }}
    table {{ width:100%; border-collapse: collapse; margin-top: 16px; }}
    th, td {{ border:1px solid #ddd; padding:8px; text-align:left; }}
    </style></head>
    <body>
    <h1>{title}</h1>
    <h3>Total Collected: ₹{(total_collected/100):,.2f}</h3>
    <h3>By Course</h3>
    <table><tr><th>Course</th><th>Amount (INR)</th></tr>
    {''.join([f"<tr><td>{item['course']}</td><td>{(item['amount']/100):,.2f}</td></tr>" for item in by_course])}
    </table>
    <h3>Defaulters</h3>
    <table><tr><th>Student ID</th><th>Outstanding (INR)</th></tr>
    {''.join([f"<tr><td>{d['studentId']}</td><td>{(d['amount']/100):,.2f}</td></tr>" for d in defaulters])}
    </table>
    </body></html>
    """

    reports_dir = Path(current_app.instance_path) / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    filename = f"BEC_{report_type}_report_{dt.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    file_path = reports_dir / filename
    try:
        HTML(string=html).write_pdf(str(file_path))
    except Exception:
        c = canvas.Canvas(str(file_path), pagesize=A4)
        w, h = A4
        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, h - 72, title)
        c.setFont("Helvetica", 12)
        c.drawString(72, h - 100, f"Total Collected: ₹{(total_collected/100):,.2f}")
        c.showPage()
        c.save()
    return send_file(str(file_path), mimetype="application/pdf", download_name=filename, as_attachment=True)


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None

