from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Audit app_motorsubcategory vs app_motorcovertype for overlaps, counts, and pricing references."

    def handle(self, *args, **options):
        self.stdout.write("Auditing motor tables (motorsubcategory vs motorcovertype)...")

        with connection.cursor() as cur:
            tables = connection.introspection.table_names()
            has_sub = 'app_motorsubcategory' in tables
            has_cov = 'app_motorcovertype' in tables

            if not has_sub and not has_cov:
                self.stdout.write(self.style.ERROR("Neither app_motorsubcategory nor app_motorcovertype exists in this DB."))
                return

            if has_sub:
                cur.execute("SELECT COUNT(*) FROM app_motorsubcategory")
                sub_count = cur.fetchone()[0]
            else:
                sub_count = 0

            if has_cov:
                cur.execute("SELECT COUNT(*) FROM app_motorcovertype")
                cov_count = cur.fetchone()[0]
            else:
                cov_count = 0

            self.stdout.write(f"- app_motorsubcategory rows: {sub_count}")
            self.stdout.write(f"- app_motorcovertype rows: {cov_count}")

            # Compare by code/name attributes if tables exist
            sub_codes = set()
            cov_codes = set()
            overlap = set()

            if has_sub:
                try:
                    cur.execute("SELECT subcategory_code FROM app_motorsubcategory WHERE subcategory_code IS NOT NULL")
                    sub_codes = {r[0].strip().upper() for r in cur.fetchall() if r[0]}
                except Exception:
                    pass

            if has_cov:
                try:
                    cur.execute("SELECT code FROM app_motorcovertype WHERE code IS NOT NULL")
                    cov_codes = {r[0].strip().upper() for r in cur.fetchall() if r[0]}
                except Exception:
                    pass

            if sub_codes and cov_codes:
                overlap = sub_codes.intersection(cov_codes)

            self.stdout.write(f"- Unique Subcategory codes: {len(sub_codes)}")
            self.stdout.write(f"- Unique CoverType codes: {len(cov_codes)}")
            self.stdout.write(f"- Overlapping codes: {len(overlap)}")

            # Pricing references via FK columns (best-effort raw SQL)
            # MotorPricing subcategory_id references app_motorsubcategory; verify coverage
            missing_pricing_refs = {}
            try:
                if 'app_motorpricing' in tables and has_sub:
                    cur.execute("""
                        SELECT COUNT(*)
                        FROM app_motorpricing p
                        LEFT JOIN app_motorsubcategory s ON p.subcategory_id = s.id
                        WHERE s.id IS NULL
                    """)
                    missing_pricing_refs['motorpricing_orphans'] = cur.fetchone()[0]
            except Exception:
                pass

            # CommercialTonnagePricing
            try:
                if 'app_commercialtonnagepricing' in tables and has_sub:
                    cur.execute("""
                        SELECT COUNT(*)
                        FROM app_commercialtonnagepricing t
                        LEFT JOIN app_motorsubcategory s ON t.subcategory_id = s.id
                        WHERE s.id IS NULL
                    """)
                    missing_pricing_refs['tonnage_orphans'] = cur.fetchone()[0]
            except Exception:
                pass

            # PSVPLLPricing
            try:
                if 'app_psvpllpricing' in tables and has_sub:
                    cur.execute("""
                        SELECT COUNT(*)
                        FROM app_psvpllpricing pll
                        LEFT JOIN app_motorsubcategory s ON pll.subcategory_id = s.id
                        WHERE s.id IS NULL
                    """)
                    missing_pricing_refs['pll_orphans'] = cur.fetchone()[0]
            except Exception:
                pass

            if missing_pricing_refs:
                self.stdout.write("- Orphan pricing rows (FK to subcategory missing):")
                for k, v in missing_pricing_refs.items():
                    self.stdout.write(f"  • {k}: {v}")

            # If both tables exist, show sample of mismatches
            if has_sub and has_cov:
                only_sub = sorted(list(sub_codes - cov_codes))[:10]
                only_cov = sorted(list(cov_codes - sub_codes))[:10]
                if only_sub:
                    self.stdout.write("- Codes only in motorsubcategory (sample):")
                    for c in only_sub:
                        self.stdout.write(f"  • {c}")
                if only_cov:
                    self.stdout.write("- Codes only in motorcovertype (sample):")
                    for c in only_cov:
                        self.stdout.write(f"  • {c}")

        self.stdout.write(self.style.SUCCESS("Audit complete."))
