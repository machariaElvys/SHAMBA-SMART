"""associate each crop with its account

Revision ID: c6b7e2a19d4f
Revises: f79c6fc58faa
Create Date: 2026-10-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c6b7e2a19d4f"
down_revision = "f79c6fc58faa"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("crops", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_crops_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
        batch_op.create_index("ix_crops_user_id", ["user_id"], unique=False)


def downgrade():
    with op.batch_alter_table("crops", schema=None) as batch_op:
        batch_op.drop_index("ix_crops_user_id")
        batch_op.drop_constraint("fk_crops_user_id_users", type_="foreignkey")
        batch_op.drop_column("user_id")
