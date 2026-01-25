import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.db import connection

# Drop and recreate the MonthlyAgentBonus table with correct column name
sql = """
DROP TABLE IF EXISTS app_monthlyagentbonus CASCADE;

CREATE TABLE app_monthlyagentbonus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    total_policies INTEGER NOT NULL DEFAULT 0,
    total_premium DECIMAL(12,2) NOT NULL DEFAULT 0,
    bonus_rate DECIMAL(5,2) NOT NULL DEFAULT 0.30,
    bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_date DATE,
    payment_reference VARCHAR(100) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    agent_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE INDEX app_monthly_period_idx ON app_monthlyagentbonus(period);
CREATE INDEX app_monthly_payment_idx ON app_monthlyagentbonus(payment_status);
CREATE INDEX app_monthly_agent_idx ON app_monthlyagentbonus(agent_id, year DESC, month DESC);
CREATE UNIQUE INDEX app_monthly_agent_period_uniq ON app_monthlyagentbonus(agent_id, period);
"""

with connection.cursor() as cursor:
    cursor.execute(sql)

print("✅ MonthlyAgentBonus table recreated successfully with correct 'id' column!")
