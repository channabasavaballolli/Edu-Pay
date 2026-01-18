"""create core tables

Revision ID: 0001_create_tables
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_create_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("regno", sa.String(length=64), nullable=False),
        sa.Column("course", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
    )
    op.create_index(op.f("ix_students_email"), "students", ["email"], unique=True)
    op.create_index(op.f("ix_students_regno"), "students", ["regno"], unique=True)

    op.create_table(
        "fee_components",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=False),
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("invoice_no", sa.String(length=64), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("items", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=True),
    )
    op.create_index(op.f("ix_invoices_invoice_no"), "invoices", ["invoice_no"], unique=True)

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("invoice_id", sa.Integer(), sa.ForeignKey("invoices.id"), nullable=False),
        sa.Column("razorpay_order_id", sa.String(length=128)),
        sa.Column("razorpay_payment_id", sa.String(length=128)),
        sa.Column("invoice_no", sa.String(length=64), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("receipt_path", sa.String(length=255)),
    )


def downgrade():
    op.drop_table("payments")
    op.drop_index(op.f("ix_invoices_invoice_no"), table_name="invoices")
    op.drop_table("invoices")
    op.drop_table("fee_components")
    op.drop_index(op.f("ix_students_regno"), table_name="students")
    op.drop_index(op.f("ix_students_email"), table_name="students")
    op.drop_table("students")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

