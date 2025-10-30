# Motor Cover Seeding Alignment Plan

Goal: Align backend MotorCategory/MotorCoverType seeding with the MD cover lists so the frontend can rely on backend names/codes without extra UI curation. This avoids bracket hints in names and moves field requirements into flags on category/cover types.

## Naming rules

- Use clean display names with no bracketed hints.
- Use stable codes: <CATEGORY>_<GROUP>_<VARIANT>, all uppercase with underscores.
- Put field requirements into flags (category.requires*\* or cover.requires*\*). Do NOT encode fields in names.

## Private

- PRIVATE_TOR: "TOR For Private" (cover_type: TOR)
- PRIVATE_THIRD_PARTY: "Private Third-Party" (THIRD_PARTY)
- PRIVATE_TP_EXT: "Private Third-Party Extendible" (THIRD_PARTY_EXT)
- PRIVATE_COMPREHENSIVE: "Private Comprehensive" (COMPREHENSIVE, requires_sum_insured=true, requires_vehicle_valuation=true, supports_optional_addons=true)

Flags: Private category has no special inputs (no tonnage/passenger/etc.).

## Commercial

Third Party group (use category.requires_tonnage=true or cover.requires_tonnage=true for those covers):

- COMM_TOR: "TOR For Commercial" (TOR)
- COMM_TP_OWN_GOODS: "Own Goods Third-Party" (THIRD_PARTY)
- COMM_TP_GEN_CARTAGE: "General Cartage Third-Party" (THIRD_PARTY)
- COMM_TP_TUKTUK: "Commercial TukTuk Third-Party" (THIRD_PARTY)
- COMM_TP_TUKTUK_EXT: "Commercial TukTuk Third-Party Extendible" (THIRD_PARTY_EXT)
- COMM_TP_OWN_GOODS_EXT: "Own Goods Third-Party Extendible" (THIRD_PARTY_EXT)
- COMM_TP_GEN_CARTAGE_EXT: "General Cartage Third-Party Extendible" (THIRD_PARTY_EXT)
- COMM_TP_GEN_CARTAGE_PM: "General Cartage Third-Party Prime Mover" (THIRD_PARTY, cover.requires_tonnage=true)
- COMM_TP_GEN_CARTAGE_PM_EXT: "General Cartage Third-Party Extendible Prime Mover" (THIRD_PARTY_EXT, cover.requires_tonnage=true)

Comprehensive group:

- COMM_COMP_TUKTUK: "Commercial TukTuk Comprehensive" (COMPREHENSIVE, requires_sum_insured=true)
- COMM_COMP_GEN_CARTAGE: "General Cartage Comprehensive" (COMPREHENSIVE)
- COMM_COMP_OWN_GOODS: "Own Goods Comprehensive" (COMPREHENSIVE)

Recommended category flags: requires_tonnage=true (Commercial).

## PSV

Third Party group (set requires_passenger_count, requires_passenger_type where needed):

- PSV_UBER_TP: "PSV Uber Third-Party" (THIRD_PARTY)
- PSV_TUKTUK_TP: "PSV Tuk-Tuk Third-Party" (THIRD_PARTY)
- PSV_TUKTUK_TP_EXT: "PSV Tuk-Tuk Third-Party Extendible" (THIRD_PARTY_EXT)
- PSV_MATATU_TP_1M: "1 Month PSV Matatu Third-Party" (THIRD_PARTY, time_period=1_MONTH, category.supports_time_period_variants=true)
- PSV_MATATU_TP_2W: "2 Weeks PSV Matatu Third-Party" (THIRD_PARTY, time_period=2_WEEKS)
- PSV_UBER_TP_EXT: "PSV Uber Third-Party Extendible" (THIRD_PARTY_EXT)
- PSV_TOUR_VAN_TP: "PSV Tour Van Third-Party" (THIRD_PARTY)
- PSV_MATATU_TP_1W_EXT: "1 week PSV Matatu-third party Extendible" (THIRD_PARTY_EXT, time_period=1_WEEK)
- PSV_PLAIN_TPO: "PSV Plain TPO" (THIRD_PARTY)
- PSV_TOUR_VAN_TP_EXT: "PSV Tour Van Third-party Extendible" (THIRD_PARTY_EXT)

Comprehensive group:

- PSV_UBER_COMP: "PSV UBER COMPREHENSIVE" (COMPREHENSIVE, requires_sum_insured=true)
- PSV_TOUR_VAN_COMP: "PSV TOUR VAN COMPREHENSIVE" (COMPREHENSIVE)

Recommended category flags: requires_passenger_count=true, requires_passenger_type=true.

## Motorcycle

Third Party group:

- MOTO_PRIVATE_TP: "Private motorcycle third party" (THIRD_PARTY)
- MOTO_PSV_TP: "Psv motorcycle third party" (THIRD_PARTY)
- MOTO_PSV_TP_6M: "PSV Motocycle third-party 6 months" (THIRD_PARTY, time_period=6_MONTHS)

Comprehensive group:

- MOTO_PRIVATE_COMP: "Private Motorcyle comprehensive" (COMPREHENSIVE, requires_sum_insured=true)
- MOTO_PSV_COMP: "PSV Motorcycle comprehensive" (COMPREHENSIVE)
- MOTO_PSV_COMP_6M: "Psv motorcycle comprehensive 6 month" (COMPREHENSIVE, time_period=6_MONTHS)

Recommended category flags: requires_engine_capacity=true (if needed by products).

## TukTuk

Third Party group:

- TUKTUK_PSV_TP: "PSV Tuk-Tuk Third-Party" (THIRD_PARTY)
- TUKTUK_PSV_TP_EXT: "PSV Tuk-Tuk Third-Party Extendible" (THIRD_PARTY_EXT)
- TUKTUK_COMM_TP: "Commercial TukTuk Third-Party" (THIRD_PARTY)
- TUKTUK_COMM_TP_EXT: "Commercial Tuktuk Third-Party Extendible" (THIRD_PARTY_EXT)

Comprehensive group:

- TUKTUK_COMM_COMP: "Commercial TukTuk Comprehensive" (COMPREHENSIVE)
- TUKTUK_PSV_COMP: "PSV Tuk-Tuk Comprehensive" (COMPREHENSIVE)

## Special Classes

Third Party:

- SPECIAL_AGR_TRACTOR_TP: "Agricultural Tractor Third-Party" (THIRD_PARTY)
- SPECIAL_COMM_INST_TP: "Commercial Institutional Third-Party" (THIRD_PARTY)
- SPECIAL_COMM_INST_TP_EXT: "Commercial Institutional Third-Party Extendible" (THIRD_PARTY_EXT)
- SPECIAL_KG_PLATE_TP: "KG Plate Third-Party" (THIRD_PARTY)
- SPECIAL_DRIVING_SCHOOL_TP: "Driving School Third-Party" (THIRD_PARTY)

Comprehensive:

- SPECIAL_AGR_TRACTOR_COMP: "Agricultural Tractor Comprehensive" (COMPREHENSIVE)
- SPECIAL_COMM_INST_COMP: "Commercial Institutional Comprehensive" (COMPREHENSIVE)
- SPECIAL_DRIVING_SCHOOL_COMP: "Driving School Comprehensive" (COMPREHENSIVE)
- SPECIAL_FUEL_TANKERS_COMP: "Fuel Tankers Comprehensive" (COMPREHENSIVE)
- SPECIAL_AMBULANCE_COMP: "Commercial Ambulance Comprehensive" (COMPREHENSIVE)

Recommended category flags: requires_carrying_capacity=true for tankers/ambulance where relevant.

## Validation and date rules (global)

- Field requirements already provide dynamic year bounds.
- cover_start_date: no backdating, max 30 days forward; default policy term = 365 days (admin can override).

## Seeding steps

- Update management command (seed_motor_categories.py) to:
  - Use the codes and names above
  - Set category flags per section
  - Set cover_type, time_period, and cover flags (requires_sum_insured, vehicle_valuation, supports_optional_addons) where indicated
- Re-run migrations/seed on dev DB, verify endpoints:
  - GET /api/v1/motor/cover-types?category=…
  - GET /api/v1/motor/field-requirements?category=…&cover_type=…

---

This plan makes UI curation redundant long-term and ensures new covers integrate without frontend tweaks.
