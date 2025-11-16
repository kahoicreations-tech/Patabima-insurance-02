import json
from collections import defaultdict
import csv
import os
from typing import Dict, List, Set, Tuple

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from app.models import (
    MotorSubcategory,
    MotorCoverType,
    MotorPricing,
    CommercialTonnagePricing,
    PSVPLLPricing,
    AdditionalFieldPricing,
    ExtendiblePricing,
)


class Command(BaseCommand):
    help = (
        "Consolidate MotorSubcategory records into a canonical set (default: 22 cover types).\n"
        "Dry-run by default: prints what would change and detects conflicts.\n"
        "Provide a mapping of old_subcategory_code -> canonical_code via --mapping-file (JSON).\n"
        "Canonical set can be sourced from MotorCoverType (use --from-cover-types) or via --canonical-list."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--from-cover-types",
            action="store_true",
            help="Use MotorCoverType.code values as the canonical 22 codes.",
        )
        parser.add_argument(
            "--canonical-list",
            type=str,
            help="Comma-separated list of canonical subcategory codes (overrides --from-cover-types).",
        )
        parser.add_argument(
            "--mapping-file",
            type=str,
            help="Path to a JSON file: { 'OLD_CODE': 'CANONICAL_CODE', ... }",
        )
        parser.add_argument(
            "--write-mapping-template",
            type=str,
            help="Write a JSON template file with existing subcategory codes mapped to canonical (identity for canonical, empty string for others).",
        )
        parser.add_argument(
            "--commit",
            action="store_true",
            help="Apply the consolidation. Without this, it only prints a dry-run plan.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow consolidation even if some old codes are unmapped (they will be left untouched).",
        )
        parser.add_argument(
            "--export-conflicts-dir",
            type=str,
            help="If set (dry-run only), write CSV files with detailed duplicate groups causing potential conflicts.",
        )
        parser.add_argument(
            "--auto-merge-duplicates",
            action="store_true",
            help="On commit: automatically keep the most recent row per duplicate key and delete older ones before reassignment.",
        )

    def handle(self, *args, **options):
        canonical_codes: Set[str] = set()
        if options.get("canonical_list"):
            canonical_codes = {c.strip() for c in options["canonical_list"].split(",") if c.strip()}
        elif options.get("from_cover_types"):
            canonical_codes = set(MotorCoverType.objects.values_list("code", flat=True))
        else:
            # Default to cover types if available
            cover_codes = list(MotorCoverType.objects.values_list("code", flat=True))
            if cover_codes:
                canonical_codes = set(cover_codes)
            else:
                raise CommandError(
                    "No canonical source provided. Use --from-cover-types or --canonical-list."
                )

        if not canonical_codes:
            raise CommandError("Canonical set is empty.")

        # Load optional mapping
        mapping: Dict[str, str] = {}
        mapping_file = options.get("mapping_file")
        if mapping_file:
            try:
                with open(mapping_file, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    if not isinstance(loaded, dict):
                        raise ValueError("Mapping JSON must be an object/dict")
                    # Normalize to strings
                    mapping = {str(k): str(v) for k, v in loaded.items()}
            except Exception as e:
                raise CommandError(f"Failed to read mapping file: {e}")

        # Build identity mappings for already-canonical subcategories not present in mapping
        subs = list(MotorSubcategory.objects.values("id", "subcategory_code"))
        sub_by_code = {s["subcategory_code"]: s["id"] for s in subs}

        for code in sub_by_code.keys():
            if code in canonical_codes and code not in mapping:
                mapping[code] = code

        # Optionally write a mapping template and exit
        if options.get("write_mapping_template"):
            dest = options["write_mapping_template"]
            template = {}
            for code in sorted(sub_by_code.keys()):
                template[code] = code if code in canonical_codes else ""
            try:
                with open(dest, "w", encoding="utf-8") as f:
                    json.dump(template, f, indent=2)
                self.stdout.write(self.style.SUCCESS(f"Mapping template written to {dest}"))
            except Exception as e:
                raise CommandError(f"Failed to write mapping template: {e}")
            return

        # Identify unmapped existing subcategory codes
        existing_codes = set(sub_by_code.keys())
        mapped_sources = set(mapping.keys())
        unmapped = [c for c in existing_codes if c not in mapped_sources]

        # Only warn for unmapped if they are not canonical; canonical should have identity mapping
        unmapped = [c for c in unmapped if c not in canonical_codes]

        self.stdout.write(self.style.WARNING(f"Canonical codes count: {len(canonical_codes)}"))
        self.stdout.write(f"Canonical: {sorted(list(canonical_codes))}")
        self.stdout.write("")

        if unmapped:
            self.stdout.write(self.style.WARNING(f"Unmapped existing subcategories: {len(unmapped)}"))
            self.stdout.write(
                "Examples: " + ", ".join(sorted(unmapped)[:15]) + (" ..." if len(unmapped) > 15 else "")
            )
            if not options.get("force"):
                self.stdout.write(
                    self.style.ERROR(
                        "Some existing subcategories are not mapped to canonical codes. "
                        "Provide --mapping-file or use --force to proceed while leaving them untouched."
                    )
                )
        else:
            self.stdout.write(self.style.SUCCESS("All existing subcategories are mapped or canonical."))

        # Validate mapping targets belong to canonical set
        bad_targets = [t for t in mapping.values() if t not in canonical_codes]
        if bad_targets:
            raise CommandError(
                f"Mapping targets not in canonical set: {sorted(list(set(bad_targets)))}"
            )

        # Prepare id mapping source_id -> target_id
        missing_targets = [t for t in set(mapping.values()) if t not in sub_by_code]
        if missing_targets:
            self.stdout.write(
                self.style.WARNING(
                    "Some canonical codes do not exist as MotorSubcategory yet. They will be created on commit: "
                    + ", ".join(sorted(missing_targets))
                )
            )

        # Build reverse lookup: get/create target IDs for canonical codes
        target_ids: Dict[str, int] = {}
        for code in canonical_codes:
            if code in sub_by_code:
                target_ids[code] = sub_by_code[code]

        # Helper to lazily get/create a target subcategory on commit
        def ensure_target_id(code: str) -> int:
            if code in target_ids:
                return target_ids[code]
            # Create a minimal placeholder; real metadata can be migrated later
            cat = MotorSubcategory.objects.first().category  # heuristic: reuse an existing category; adjust manually if needed
            new_sub = MotorSubcategory.objects.create(
                category=cat,
                subcategory_code=code,
                subcategory_name=code,
                product_type='THIRD_PARTY',
                pricing_model='FIXED',
                is_complex=False,
                additional_fields=[],
                pricing_requirements={},
                is_active=True,
            )
            target_ids[code] = new_sub.id
            return new_sub.id

        # Build source->target id plan (skip identity unless we need to ensure existence)
        plan: Dict[int, int] = {}
        for src_code, tgt_code in mapping.items():
            if src_code not in sub_by_code:
                continue
            src_id = sub_by_code[src_code]
            tgt_id = target_ids.get(tgt_code)
            if tgt_id is None:
                # Not present yet; only create on commit
                pass
            if src_code == tgt_code:
                # identity; no reassignment needed
                continue
            plan[src_id] = tgt_id or -1  # -1 marks to-be-created on commit

        # Conflict detection across pricing tables
        conflicts: List[str] = []
        conflict_details = {}

        def detect_conflicts_for_model(qs, unique_fields: Tuple[str, ...], label: str):
            # Build predicted unique keys after reassignment
            groups: Dict[Tuple, List[int]] = defaultdict(list)
            rows = list(qs.values("id", *unique_fields, "subcategory_id"))
            # Map subcategory_id to target id if in plan
            for r in rows:
                sid = r["subcategory_id"]
                tgt = plan.get(sid)
                if tgt is None:
                    # identity or not in scope
                    key = tuple(r[f] for f in unique_fields)
                else:
                    # replace the subcategory part in unique_fields
                    new_vals = []
                    for f in unique_fields:
                        if f == "subcategory_id":
                            new_vals.append(tgt if tgt != -1 else sid)  # sid placeholder; actual id resolved on commit
                        else:
                            new_vals.append(r[f])
                    key = tuple(new_vals)
                groups[key].append(r["id"])

            dups = {k: v for k, v in groups.items() if len(v) > 1}
            if dups:
                conflicts.append(
                    f"{label}: {len(dups)} potential unique key collisions after consolidation."
                )
                # Prepare details for export
                detail_rows = []
                id_to_row = {r["id"]: r for r in rows}
                for key, ids in dups.items():
                    for rid in ids:
                        r = id_to_row[rid]
                        detail = {"row_id": rid}
                        for f in unique_fields:
                            detail[f] = r.get(f)
                        detail["original_subcategory_id"] = r.get("subcategory_id")
                        detail_rows.append(detail)
                conflict_details[label] = {
                    "unique_fields": unique_fields,
                    "rows": detail_rows,
                }
            return dups

        mp_dups = detect_conflicts_for_model(
            MotorPricing.objects.all(),
            unique_fields=("subcategory_id", "underwriter_id", "effective_from"),
            label="MotorPricing",
        )
        ton_dups = detect_conflicts_for_model(
            CommercialTonnagePricing.objects.all(),
            unique_fields=("subcategory_id", "underwriter_id", "tonnage_from", "tonnage_to", "effective_from"),
            label="CommercialTonnagePricing",
        )
        pll_dups = detect_conflicts_for_model(
            PSVPLLPricing.objects.all(),
            unique_fields=("subcategory_id", "underwriter_id", "pll_amount", "effective_from"),
            label="PSVPLLPricing",
        )
        add_dups = detect_conflicts_for_model(
            AdditionalFieldPricing.objects.all(),
            unique_fields=("subcategory_id", "field_code", "effective_from"),
            label="AdditionalFieldPricing",
        )
        ext_dups = detect_conflicts_for_model(
            ExtendiblePricing.objects.all(),
            unique_fields=("subcategory_id", "underwriter_id"),
            label="ExtendiblePricing",
        )

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("Dry-run plan"))
        self.stdout.write(f"Existing subcategories: {len(existing_codes)}")
        self.stdout.write(f"Canonical to keep: {len(canonical_codes)}")
        self.stdout.write(f"Reassignments planned (source->target): {len(plan)}")
        sample_pairs = list(plan.items())[:15]
        if sample_pairs:
            # Print source_code -> target_code pairs
            inv_lookup = {v: k for k, v in sub_by_code.items()}
            for src_id, tgt_id in sample_pairs:
                src_code = inv_lookup.get(src_id, f"id:{src_id}")
                # Determine target code string robustly (UUID-safe)
                tgt_code = None
                if tgt_id is not None and tgt_id != -1:
                    tgt_code = inv_lookup.get(tgt_id)
                if not tgt_code:
                    # Find mapping target by src_code
                    tgt_code = mapping.get(src_code, "<to-be-created>")
                self.stdout.write(f"- {src_code} -> {tgt_code}")

        # Report potential conflicts
        if conflicts:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Potential unique key conflicts detected:"))
            for c in conflicts:
                self.stdout.write("- " + c)
            self.stdout.write(
                self.style.WARNING(
                    "Resolve conflicts (merge or deduplicate pricing rows) before committing."
                )
            )

        if not options.get("commit"):
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS("Dry-run complete. No changes applied."))
            # Optionally export conflicts
            export_dir = options.get("export_conflicts_dir")
            if export_dir and conflicts:
                os.makedirs(export_dir, exist_ok=True)
                for label, payload in conflict_details.items():
                    path = os.path.join(export_dir, f"{label.lower()}_conflicts.csv")
                    rows = payload["rows"]
                    if not rows:
                        continue
                    fieldnames = ["row_id", *payload["unique_fields"], "original_subcategory_id"]
                    with open(path, "w", newline="", encoding="utf-8") as f:
                        writer = csv.DictWriter(f, fieldnames=fieldnames)
                        writer.writeheader()
                        for row in rows:
                            writer.writerow(row)
                    self.stdout.write(self.style.WARNING(f"Exported conflict details to {path}"))
            return

        # Guarded commit path
        if conflicts and not options.get("auto_merge_duplicates"):
            raise CommandError(
                "Conflicts detected in dry-run. Aborting commit to protect data integrity. "
                "Re-run with --auto-merge-duplicates to keep latest rows and delete older duplicates."
            )

        # Perform updates inside a transaction
        with transaction.atomic():
            # Ensure target canonical subcategories exist
            for code in canonical_codes:
                ensure_target_id(code)

            # Refresh id maps
            sub_by_code_live = {
                s.subcategory_code: s.id for s in MotorSubcategory.objects.all().only("id", "subcategory_code")
            }
            id_plan: Dict[int, int] = {}
            for src_code, tgt_code in mapping.items():
                src_id = sub_by_code_live.get(src_code)
                tgt_id = sub_by_code_live.get(tgt_code)
                if src_id and tgt_id and src_id != tgt_id:
                    id_plan[src_id] = tgt_id

            # If auto-merge is enabled, proactively delete duplicates that would violate unique keys after reassignment
            if options.get("auto_merge_duplicates"):
                # Build predicted duplicate groups again with current id_plan
                def predicted_dupes(qs, unique_fields: Tuple[str, ...]):
                    rows = list(qs.values("id", *unique_fields, "subcategory_id", "date_created"))
                    groups: Dict[Tuple, List[dict]] = defaultdict(list)
                    for r in rows:
                        sid = r["subcategory_id"]
                        tgt = id_plan.get(sid)
                        new_vals = []
                        for f in unique_fields:
                            if f == "subcategory_id":
                                new_vals.append(tgt if tgt else sid)
                            else:
                                new_vals.append(r[f])
                        key = tuple(new_vals)
                        groups[key].append(r)
                    return {k: v for k, v in groups.items() if len(v) > 1}

                mp_groups = predicted_dupes(
                    MotorPricing.objects.all(),
                    ("subcategory_id", "underwriter_id", "effective_from"),
                )

                # For each duplicate group, keep the most recent (by date_created, fallback id), delete others
                def delete_older(groups: Dict[Tuple, List[dict]], model, label: str):
                    to_delete = []
                    for key, rows in groups.items():
                        rows_sorted = sorted(
                            rows,
                            key=lambda r: (r.get("date_created") or "", str(r["id"])),
                            reverse=True,
                        )
                        keep = rows_sorted[0]
                        for r in rows_sorted[1:]:
                            to_delete.append(r["id"])
                    if to_delete:
                        model.objects.filter(id__in=to_delete).delete()
                        self.stdout.write(self.style.WARNING(f"{label}: auto-merged {len(to_delete)} older duplicate rows"))

                delete_older(mp_groups, MotorPricing, "MotorPricing")

            def reassign(model, label: str):
                rows = model.objects.filter(subcategory_id__in=id_plan.keys()).only("id", "subcategory_id")
                for obj in rows:
                    obj.subcategory_id = id_plan[obj.subcategory_id]
                    obj.save(update_fields=["subcategory_id"])  # small batches to respect constraints
                self.stdout.write(self.style.SUCCESS(f"Reassigned {rows.count()} rows in {label}."))

            reassign(MotorPricing, "MotorPricing")
            reassign(CommercialTonnagePricing, "CommercialTonnagePricing")
            reassign(PSVPLLPricing, "PSVPLLPricing")
            reassign(AdditionalFieldPricing, "AdditionalFieldPricing")
            reassign(ExtendiblePricing, "ExtendiblePricing")

            # Delete redundant subcategories not in canonical set and not referenced
            to_delete = MotorSubcategory.objects.filter(
                subcategory_code__in=[c for c in existing_codes if c not in canonical_codes]
            )
            deleted_count = 0
            for sub in to_delete:
                # Safety: skip if still referenced
                if (
                    sub.pricing.exists()
                    or sub.tonnage_pricing.exists()
                    or sub.pll_pricing.exists()
                    or sub.additional_pricing.exists()
                    or ExtendiblePricing.objects.filter(subcategory=sub).exists()
                ):
                    continue
                sub.delete()
                deleted_count += 1

            self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} redundant subcategories."))

        self.stdout.write(self.style.SUCCESS("Consolidation committed successfully."))
