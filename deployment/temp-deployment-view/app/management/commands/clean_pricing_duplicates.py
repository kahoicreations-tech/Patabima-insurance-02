from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from app.models import (
    InsuranceProvider,
    MotorPricing,
    CommercialTonnagePricing,
    PSVPLLPricing,
)
from django.db import connection
from django.db.utils import ProgrammingError, OperationalError
from app.models import Underwriter  # optional legacy model; table may not exist


class Command(BaseCommand):
    help = (
        "Normalize Underwriters -> InsuranceProvider and remove duplicate pricing rows.\n"
        "- Maps legacy Underwriter to InsuranceProvider by code/name (case-insensitive).\n"
        "- Deduplicates MotorPricing, CommercialTonnagePricing, PSVPLLPricing by their natural keys.\n"
        "Supports --commit to apply changes; default is dry-run."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--commit", action="store_true", help="Apply changes instead of dry-run"
        )

    def handle(self, *args, **options):
        commit = options.get("commit", False)
        self.stdout.write(self.style.WARNING("Starting pricing cleanup ({} mode)".format("COMMIT" if commit else "DRY-RUN")))

        # 0) Deduplicate InsuranceProvider entries by code/name (case-insensitive)
        prov_rm, prov_merge = self._dedupe_insurance_providers(commit)

        # 1) Map legacy Underwriter -> InsuranceProvider (if legacy table exists)
        uw_map_count = self._migrate_underwriters(commit)

        # 2) Deduplicate pricing tables
        mp_rm = self._dedupe_motor_pricing(commit)
        ton_rm = self._dedupe_tonnage_pricing(commit)
        pll_rm = self._dedupe_pll_pricing(commit)

        self.stdout.write(self.style.SUCCESS(
            f"Cleanup complete. Providers merged: {prov_merge}, providers removed: {prov_rm}. Underwriter mappings: {uw_map_count}. "
            f"Removed duplicates -> MotorPricing: {mp_rm}, CommercialTonnagePricing: {ton_rm}, PSVPLLPricing: {pll_rm}."
        ))

    def _dedupe_insurance_providers(self, commit: bool) -> tuple[int, int]:
        """Merge duplicate InsuranceProvider rows by case-insensitive code/name.
        Returns (removed_count, merged_groups).
        """
        from collections import defaultdict

        def norm(s: str):
            return (s or "").strip().upper()

        # Build groups by code and by name
        providers = list(InsuranceProvider.objects.all())
        by_code = defaultdict(list)
        by_name = defaultdict(list)
        for p in providers:
            if p.code:
                by_code[norm(p.code)].append(p)
            if p.name:
                by_name[norm(p.name)].append(p)

        removed = 0
        merged_groups = 0

        def merge_group(rows):
            nonlocal removed, merged_groups
            if len(rows) <= 1:
                return
            # Choose keeper: earliest created (older canonical id)
            keeper = sorted(rows, key=lambda r: (r.date_created or r.pk))[0]
            to_remove = [r for r in rows if r.id != keeper.id]
            if not to_remove:
                return
            merged_groups += 1
            self.stdout.write(self.style.WARNING(f"Merging {len(to_remove)} providers into {keeper.code} / {keeper.name}"))
            if commit:
                with transaction.atomic():
                    # Reassign FKs from all referencing models
                    MotorPricing.objects.filter(underwriter_id__in=[r.id for r in to_remove]).update(underwriter=keeper)
                    CommercialTonnagePricing.objects.filter(underwriter_id__in=[r.id for r in to_remove]).update(underwriter=keeper)
                    PSVPLLPricing.objects.filter(underwriter_id__in=[r.id for r in to_remove]).update(underwriter=keeper)
                    try:
                        from app.models import ExtendiblePricing, PolicyExtension
                        ExtendiblePricing.objects.filter(underwriter_id__in=[r.id for r in to_remove]).update(underwriter=keeper)
                        PolicyExtension.objects.filter(underwriter_id__in=[r.id for r in to_remove]).update(underwriter=keeper)
                    except Exception:
                        pass
                    # Finally delete duplicates
                    InsuranceProvider.objects.filter(id__in=[r.id for r in to_remove]).delete()
                removed += len(to_remove)
            else:
                # Dry-run: only count
                removed += len(to_remove)

        # Merge by code groups
        for rows in by_code.values():
            merge_group(rows)
        # Merge by name groups where code didn't already merge them
        for rows in by_name.values():
            # Avoid re-merging same sets: group by ids not yet merged (best-effort)
            unique_ids = {r.id for r in rows}
            if len(unique_ids) > 1:
                merge_group(rows)

        return removed, merged_groups

    def _normalize_code(self, s: str):
        return (s or "").strip().upper()

    def _migrate_underwriters(self, commit: bool) -> int:
        count = 0
        # Guard: check table exists via introspection to avoid lazy-eval errors
        try:
            tables = connection.introspection.table_names()
        except Exception:
            tables = []
        if 'app_underwriter' not in tables:
            self.stdout.write(self.style.WARNING("Underwriter table not found; skipping legacy mapping"))
            return 0

        count = 0
        # Iterate safely; if evaluation fails, abort this step
        try:
            iterator = list(Underwriter.objects.all())
        except Exception:
            self.stdout.write(self.style.WARNING("Unable to read Underwriter rows; skipping legacy mapping"))
            return 0

        for uw in iterator:
            code = self._normalize_code(getattr(uw, "company_code", ""))
            name = (uw.company_name or "").strip()
            if not code and not name:
                continue
            provider = (
                InsuranceProvider.objects.filter(Q(code__iexact=code) | Q(name__iexact=name)).first()
            )
            if not provider:
                # Create mirror provider entry on commit
                if commit:
                    provider = InsuranceProvider.objects.create(
                        code=code or name.replace(" ", "_").upper()[:20],
                        name=name or code,
                        supported_categories=uw.supported_categories or [],
                        contact_email=uw.contact_email,
                        contact_phone=uw.contact_phone,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created InsuranceProvider for legacy Underwriter {name} ({code})"))
                count += 1
        return count

    def _dedupe_motor_pricing(self, commit: bool) -> int:
        # Per model Meta.unique_together
        key = lambda r: (
            str(r.subcategory_id), str(r.underwriter_id), str(r.effective_from)
        )
        return self._dedupe_table(MotorPricing, key, commit)

    def _dedupe_tonnage_pricing(self, commit: bool) -> int:
        key = lambda r: (
            str(r.subcategory_id), str(r.underwriter_id), str(r.tonnage_from), str(r.tonnage_to or ""), str(r.effective_from)
        )
        return self._dedupe_table(CommercialTonnagePricing, key, commit)

    def _dedupe_pll_pricing(self, commit: bool) -> int:
        key = lambda r: (
            str(r.subcategory_id), str(r.underwriter_id), str(r.pll_amount), str(r.effective_from)
        )
        return self._dedupe_table(PSVPLLPricing, key, commit)

    def _dedupe_table(self, model, key_fn, commit: bool) -> int:
        removed = 0
        seen = set()
        qs = model.objects.all().order_by("-date_created")  # keep most recent, drop older duplicates
        to_delete_ids = []
        for row in qs:
            k = key_fn(row)
            if k in seen:
                to_delete_ids.append(row.id)
            else:
                seen.add(k)
        if to_delete_ids:
            msg = f"{model.__name__}: Found {len(to_delete_ids)} duplicate rows"
            if commit:
                with transaction.atomic():
                    model.objects.filter(id__in=to_delete_ids).delete()
                self.stdout.write(self.style.SUCCESS(msg + " -> deleted"))
            else:
                self.stdout.write(self.style.WARNING(msg + " (dry-run)"))
            removed = len(to_delete_ids)
        else:
            self.stdout.write(self.style.SUCCESS(f"{model.__name__}: No duplicates found"))
        return removed
