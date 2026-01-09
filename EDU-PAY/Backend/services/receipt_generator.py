from datetime import datetime
from pathlib import Path

try:
    from weasyprint import HTML
except (ImportError, OSError):
    HTML = None
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
    
    # Generate items rows
    items_html = ""
    items = invoice.items or [{"label": "Fee Payment", "amount": invoice.amount_paise / 100}]
    for item in items:
        # handle both structure formats (FeeComponent dict or simplified)
        label = item.get("label") or item.get("name") or "Fee"
        amt = item.get("amount", 0)
        # if amount is in rupees already (which it seems to be in fees.py)
        items_html += f"<tr><td>{label}</td><td>₹{amt:,.2f}</td></tr>"

    html = f"""
    <html>
      <head>
        <style>
          body {{ font-family: Arial, sans-serif; padding: 32px; }}
          h1 {{ text-align: center; }}
          table {{ width: 100%; border-collapse: collapse; margin-top: 24px; }}
          td, th {{ border: 1px solid #ddd; padding: 8px; }}
          .meta {{ margin-top: 16px; }}
          .status {{ color: green; font-weight: bold; }}
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
          <p class="status"><strong>Status:</strong> Paid</p>
        </div>
        <table>
          <tr>
            <th>Description</th>
            <th>Amount (INR)</th>
          </tr>
          {items_html}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>₹{amount_rupees:,.2f}</strong></td>
          </tr>
        </table>
        <p style="margin-top:24px;">Thank you for your payment.</p>
      </body>
    </html>
    """
    try:
        HTML(string=html).write_pdf(str(file_path))
    except Exception:
        # Fallback to reportlab if WeasyPrint fails
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
        y -= 18
        c.drawString(72, y, "Status: Paid")
        y -= 36
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Description")
        c.drawString(400, y, "Amount (INR)")
        y -= 18
        c.setFont("Helvetica", 12)
        
        for item in items:
            label = item.get("label") or item.get("name") or "Fee"
            amt = item.get("amount", 0)
            c.drawString(72, y, label)
            c.drawString(400, y, f"{amt:,.2f}")
            y -= 18
            
        y -= 10
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Total")
        c.drawString(400, y, f"{amount_rupees:,.2f}")
        
        c.showPage()
        c.save()
    return str(file_path)
