from datetime import datetime
from pathlib import Path

from weasyprint import HTML
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


def ensure_receipts_dir(path: str) -> Path:
    receipts_dir = Path(path)
    receipts_dir.mkdir(parents=True, exist_ok=True)
    return receipts_dir


def generate_receipt(invoice, payment, student, config) -> str:
    receipts_dir = ensure_receipts_dir(config["RECEIPTS_DIR"])
    file_path = receipts_dir / f"{invoice.invoice_no}.pdf"
    amount_rupees = payment.amount_paise / 100
    issued_on = datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
    html = f"""
    <html>
      <head>
        <style>
          body {{ font-family: Arial, sans-serif; padding: 32px; }}
          h1 {{ text-align: center; }}
          table {{ width: 100%; border-collapse: collapse; margin-top: 24px; }}
          td, th {{ border: 1px solid #ddd; padding: 8px; }}
          .meta {{ margin-top: 16px; }}
        </style>
      </head>
      <body>
        <h1>Basaveshwar Engineering College (BEC) - Receipt</h1>
        <p><strong>Invoice:</strong> {invoice.invoice_no}</p>
        <p><strong>Student:</strong> {student.name} ({student.regno})</p>
        <p><strong>Course:</strong> {student.course}</p>
        <div class="meta">
          <p><strong>Payment ID:</strong> {payment.razorpay_payment_id or 'N/A'}</p>
          <p><strong>Order ID:</strong> {payment.razorpay_order_id}</p>
          <p><strong>Issued On:</strong> {issued_on}</p>
        </div>
        <table>
          <tr>
            <th>Description</th>
            <th>Amount (INR)</th>
          </tr>
          <tr>
            <td>Fee Payment</td>
            <td>{amount_rupees:.2f}</td>
          </tr>
        </table>
        <p style="margin-top:24px;">Thank you for your payment.</p>
      </body>
    </html>
    """
    try:
        HTML(string=html).write_pdf(str(file_path))
    except Exception:
        c = canvas.Canvas(str(file_path), pagesize=A4)
        w, h = A4
        c.setFont("Helvetica-Bold", 18)
        c.drawString(72, h - 72, "Basaveshwar Engineering College (BEC) - Receipt")
        c.setFont("Helvetica", 12)
        y = h - 120
        c.drawString(72, y, f"Invoice: {invoice.invoice_no}")
        y -= 18
        c.drawString(72, y, f"Student: {student.name} ({student.regno})")
        y -= 18
        c.drawString(72, y, f"Course: {student.course}")
        y -= 18
        c.drawString(72, y, f"Payment ID: {payment.razorpay_payment_id or 'N/A'}")
        y -= 18
        c.drawString(72, y, f"Order ID: {payment.razorpay_order_id}")
        y -= 18
        c.drawString(72, y, f"Issued On: {issued_on}")
        y -= 36
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Description")
        c.drawString(300, y, "Amount (INR)")
        y -= 18
        c.setFont("Helvetica", 12)
        c.drawString(72, y, "Fee Payment")
        c.drawString(300, y, f"{amount_rupees:.2f}")
        c.showPage()
        c.save()
    return str(file_path)

