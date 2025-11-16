import os
import hmac
import json
import uuid
import hashlib
from datetime import datetime
import re

from django.conf import settings
from django.utils.text import slugify
from django.utils.timezone import now
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

import boto3

from .models import DocumentUpload, InsuranceQuotation


def _env(name: str, default=None):
    return os.environ.get(name, getattr(settings, name, default))


def _build_object_key(agent_id: str, filename: str, env_prefix: str = None) -> str:
    env_prefix = env_prefix or _env('ENV', 'dev')
    ts = now()
    uid = uuid.uuid4()
    safe_name = slugify(filename) or 'document'
    return f"{env_prefix}/{agent_id}/{ts.strftime('%Y')}/{ts.strftime('%m')}/{uid}/{safe_name}"


def _normalize_textract_kv(resp: dict) -> dict:
    """Extract simple key/value fields from Textract AnalyzeDocument response."""
    try:
        blocks = resp.get('Blocks', [])
        print(f"🔍 _normalize_textract_kv: Found {len(blocks)} blocks")
        
        block_map = {b.get('Id'): b for b in blocks if 'Id' in b}
        keys = [b for b in blocks if b.get('BlockType') == 'KEY_VALUE_SET' and 'KEY' in (b.get('EntityTypes') or [])]
        print(f"🔍 _normalize_textract_kv: Found {len(keys)} KEY blocks")
        
        # Print block types found for debugging
        block_types = {}
        for b in blocks[:20]:  # Sample first 20
            btype = b.get('BlockType', 'UNKNOWN')
            block_types[btype] = block_types.get(btype, 0) + 1
        print(f"🔍 Block types (sample): {block_types}")

        def child_text(block):
            out = []
            for rel in block.get('Relationships', []) or []:
                if rel.get('Type') == 'CHILD':
                    for cid in rel.get('Ids', []) or []:
                        w = block_map.get(cid)
                        if w and w.get('BlockType') == 'WORD':
                            out.append(w.get('Text', ''))
                        elif w and w.get('BlockType') == 'SELECTION_ELEMENT' and w.get('SelectionStatus') == 'SELECTED':
                            out.append('SELECTED')
            return ' '.join(out).strip()

        def value_for(key_block):
            for rel in key_block.get('Relationships', []) or []:
                if rel.get('Type') == 'VALUE':
                    for vid in rel.get('Ids', []) or []:
                        vb = block_map.get(vid)
                        if vb:
                            return child_text(vb)
            return ''

        fields = {}
        for k in keys:
            name = child_text(k)
            if name:
                fields[name] = value_for(k) or ''
        
        print(f"🔍 _normalize_textract_kv: Extracted {len(fields)} fields: {list(fields.keys())[:10]}")
        return fields
    except Exception as e:
        print(f"❌ _normalize_textract_kv exception: {e}")
        import traceback
        traceback.print_exc()
        return {}


def _parse_date_str(s: str) -> str | None:
    """Parse common date formats like '09 Nov 2002', '30 Apr 2028', '09/11/2002' to ISO YYYY-MM-DD."""
    if not s:
        return None
    s = s.strip()
    # Try formats with month names
    try:
        for fmt in ("%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y", "%d %b, %Y"):
            try:
                return datetime.strptime(s, fmt).date().isoformat()
            except Exception:
                pass
        # Numeric common variants
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y"):
            try:
                return datetime.strptime(s, fmt).date().isoformat()
            except Exception:
                pass
    except Exception:
        return None
    return None


def _collect_text_lines(resp: dict) -> list[str]:
    """Collect LINE-level texts from Textract response for regex-based extraction."""
    try:
        blocks = resp.get('Blocks', [])
        return [b.get('Text', '') for b in blocks if b.get('BlockType') == 'LINE' and b.get('Text')]
    except Exception:
        return []


def _canonicalize_fields(raw_fields: dict, all_lines: list[str]) -> dict:
    """Map raw KV labels/values and text heuristics into canonical keys.
    Canonical schema (vehicle-first for logbooks):
    - registration_number, chassis_number, engine_number, make, model, year, color, body_type, owner_name
    - kra_pin, id_number, id_type, date_of_birth, id_expiry_date, age_category
    """
    canonical: dict[str, str] = {}

    # Helpers
    def pick_exact(*labels):
        for lb in labels:
            for k, v in raw_fields.items():
                if k.strip().lower() == lb:
                    return v
        return None

    def pick_contains(*parts):
        for part in parts:
            for k, v in raw_fields.items():
                if part in k.strip().lower():
                    return v
        return None

    # Prepare text context
    text_all = ' \n '.join(all_lines).strip()
    lowered = text_all.lower()

    # Detect if looks like a logbook to prioritize vehicle fields
    looks_logbook = any(w in lowered for w in ['logbook', 'registration', 'chassis', 'engine', 'ntsa', 'vehicle'])

    # Regex patterns
    re_kra_pin = re.compile(r"\b([AP]\d{9}[A-Z])\b")
    re_plate = re.compile(r"\bK[A-Z]{2,3}\s?\d{3}[A-Z]\b")
    re_vin = re.compile(r"\b[A-HJ-NPR-Z0-9]{17}\b")
    re_engine_line = re.compile(r"^\s*engine\s*(no\.?|number|#|:)\s*(.+)$", re.IGNORECASE)
    re_chassis_line = re.compile(r"^\s*(chassis|vin|frame)\s*(no\.?|number|#|:)\s*(.+)$", re.IGNORECASE)
    re_reg_line = re.compile(r"^\s*(reg(istration)?\.?\s*(no\.?|number|#|:)?|plate)\s*[:#-]?\s*(.+)$", re.IGNORECASE)
    re_id_label = re.compile(r"\bID\s*(No|Number|#|:)\s*(\d{7,8})\b", re.IGNORECASE)
    re_id_plain = re.compile(r"\b(\d{7,8})\b")

    # VEHICLE-FIRST MAPPING (insertion order preserved)
    # 1) Registration number
    val = pick_contains('registration', 'reg_no', 'reg no', 'plate') or pick_exact('registration number')
    
    # Validate: reject if looks like a date (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD patterns)
    if val:
        date_pattern = re.compile(r'^[\d\-/]{8,10}$')
        if date_pattern.match(str(val).strip()):
            val = None  # Reject date-like values
    
    if not val:
        m = re_plate.search(text_all)
        if m:
            val = m.group(0)
    if not val:
        for line in all_lines:
            m = re_reg_line.search(line)
            if m:
                potential_val = m.group(m.lastindex) if m.lastindex else None
                # Validate: reject if looks like a date
                if potential_val:
                    date_pattern = re.compile(r'^[\d\-/]{8,10}$')
                    if not date_pattern.match(str(potential_val).strip()):
                        val = potential_val
                        break
    if val:
        canonical['registration_number'] = str(val).strip()

    # 2) Chassis / VIN
    val = pick_contains('chassis', 'vin', 'frame')
    if not val:
        m = re_vin.search(text_all)
        if m:
            val = m.group(0)
    if not val:
        for line in all_lines:
            m = re_chassis_line.search(line)
            if m:
                val = m.group(m.lastindex) if m.lastindex else None
                break
    if val:
        canonical['chassis_number'] = str(val).strip()

    # 3) Engine number
    val = pick_contains('engine')
    if not val:
        for line in all_lines:
            m = re_engine_line.search(line)
            if m:
                val = m.group(m.lastindex) if m.lastindex else None
                break
    if val:
        canonical['engine_number'] = str(val).strip()

    # 4) Make/Model/Year/Color/Body type
    mk = pick_contains('make')
    if mk: canonical['make'] = str(mk).strip()
    md = pick_contains('model')
    if md: canonical['model'] = str(md).strip()
    yr = pick_contains('year', 'yom', 'manufacture') or pick_exact('year of manufacture')
    if yr: canonical['year'] = str(yr).strip()
    col = pick_contains('colour', 'color')
    if col: canonical['color'] = str(col).strip()
    bt = pick_contains('body type') or pick_contains('body')
    if bt: canonical['body_type'] = str(bt).strip()

    # OWNER NAME (works for both logbook and ID docs)
    # Try multiple patterns for owner name extraction
    name_val = (
        pick_exact('name', 'full name') or 
        pick_contains('owner name', 'owner') or
        pick_contains('registered owner') or
        pick_contains('proprietor') or
        pick_contains("owner's name") or
        pick_contains('ownersname') or
        pick_contains('name of owner')
    )
    if name_val:
        canonical['owner_name'] = str(name_val).strip()

    # SECONDARY SIGNALS
    # KRA PIN
    m_pin = re_kra_pin.search(text_all)
    if m_pin:
        canonical['kra_pin'] = m_pin.group(1)
        canonical.setdefault('id_type', 'kra_pin')

    # National ID number - try key-value first
    id_val = pick_contains('id number', 'id no', 'identity number', 'national id')
    if id_val:
        # Extract just the numeric part (7-8 digits)
        id_match = re.search(r'\b(\d{7,8})\b', str(id_val))
        if id_match:
            canonical['id_number'] = id_match.group(1)
            canonical.setdefault('id_type', 'national_id')
    
    # If not found, try regex patterns (only for non-logbook documents)
    if 'id_number' not in canonical:
        m_id_lab = re_id_label.search(text_all)
        if m_id_lab and not looks_logbook:
            canonical['id_number'] = m_id_lab.group(2)
            canonical.setdefault('id_type', 'national_id')
        elif (not looks_logbook and ('republic of kenya' in lowered or 'identity' in lowered or 'id card' in lowered)):
            candidates = [m.group(1) for m in re_id_plain.finditer(text_all)]
            for c in candidates:
                if not re.search(rf"\b{re.escape(c)}[\-/]", text_all):
                    canonical.setdefault('id_number', c)
                    canonical.setdefault('id_type', 'national_id')
                    break

    # General age mark
    if re.search(r"\b18\+\b", lowered):
        canonical['age_category'] = '18_plus'

    # DOB / Expiry (ID documents)
    def _line_value_after(label_regex):
        pattern = re.compile(label_regex, re.IGNORECASE)
        for line in all_lines:
            if pattern.search(line):
                parts = re.split(label_regex, line, flags=re.IGNORECASE)
                if len(parts) > 1:
                    return parts[-1].strip(' :.-')
        return None

    if 'date_of_birth' not in canonical:
        val = _line_value_after(r"^(dob|d\.o\.b\.|date of birth)[:\s-]*")
        iso = _parse_date_str(val) if val else None
        if iso:
            canonical['date_of_birth'] = iso

    if 'id_expiry_date' not in canonical:
        val = _line_value_after(r"^(expires on|expiry date|expiry|expires)[:\s-]*")
        iso = _parse_date_str(val) if val else None
        if iso:
            canonical['id_expiry_date'] = iso

    return canonical


def _extract_fields(resp: dict) -> tuple[dict, dict]:
    """Return (raw_fields, canonical_fields) from Textract response."""
    print(f"🔍 _extract_fields called with resp type: {type(resp)}")
    print(f"🔍 Response keys: {list(resp.keys()) if isinstance(resp, dict) else 'Not a dict'}")
    
    raw_fields = _normalize_textract_kv(resp)
    print(f"🔍 _normalize_textract_kv returned {len(raw_fields)} fields: {list(raw_fields.keys())}")
    
    lines = _collect_text_lines(resp)
    print(f"🔍 _collect_text_lines returned {len(lines)} lines")
    
    canonical = _canonicalize_fields({k.lower(): v for k, v in raw_fields.items()}, lines)
    print(f"🔍 _canonicalize_fields returned {len(canonical)} fields: {list(canonical.keys())}")
    
    # If name not in KV, try to deduce by finding line starting with various name labels
    if 'owner_name' not in canonical:
        # Try multiple patterns for name extraction from text lines
        name_patterns = [
            r"^name\b[:\s-]*(.+)",  # "Name: John Doe" or "Name John Doe"
            r"^owner'?s?\s+name\b[:\s-]*(.+)",  # "Owner Name:" or "Owner's Name:"
            r"^registered\s+owner\b[:\s-]*(.+)",  # "Registered Owner:"
            r"^proprietor\b[:\s-]*(.+)",  # "Proprietor:"
            r"^full\s+name\b[:\s-]*(.+)",  # "Full Name:"
        ]
        
        for line in lines:
            for pattern in name_patterns:
                match = re.match(pattern, line.strip(), re.IGNORECASE)
                if match:
                    nm = match.group(1).strip()
                    if nm and len(nm) > 2:  # Must be at least 3 characters
                        canonical['owner_name'] = nm
                        print(f"🔍 Extracted owner_name from lines: {nm}")
                        break
            if 'owner_name' in canonical:
                break
                
    return raw_fields, canonical


def _diagnose_document(resp: dict, expected_doc_type: str | None) -> dict:
    """Heuristic diagnostics: guess type by keywords, estimate clarity by average WORD confidence and line count."""
    try:
        blocks = resp.get('Blocks', [])
    except Exception:
        blocks = []
    lines = [b.get('Text', '') for b in blocks if b.get('BlockType') == 'LINE' and b.get('Text')]
    words = [b for b in blocks if b.get('BlockType') == 'WORD']
    avg_conf = None
    if words:
        try:
            avg_conf = sum(float(w.get('Confidence', 0)) for w in words) / max(1, len(words))
        except Exception:
            avg_conf = None

    # Keyword sets per doc type
    keyword_map = {
        'national_id': ['national', 'identity', 'republic of kenya', 'identification', 'id card'],
        'kra_pin': ['kra', 'pin', 'kenya revenue', 'itax', 'tax'],
        'logbook': ['logbook', 'registration', 'chassis', 'ntsa', 'national transport', 'chief registrar'],
        'business_permit': ['business permit', 'county', 'permit'],
        'valuation_report': ['valuation', 'assessor', 'assessed', 'value'],
    }
    lowered_lines = ' \n '.join(lines).lower()
    # Regex patterns (strong signals)
    re_kra_pin = re.compile(r"\b[AP]\d{9}[A-Z]\b")
    re_plate = re.compile(r"\bK[A-Z]{2,3}\s?\d{3}[A-Z]\b")
    re_vin = re.compile(r"\b[A-HJ-NPR-Z0-9]{17}\b")
    re_id_label = re.compile(r"\bID\s*(No|Number|#|:)\s*(\d{7,8})\b", re.IGNORECASE)

    score_by_type = {k: 0 for k in keyword_map.keys()}
    signals = {k: [] for k in keyword_map.keys()}
    # Base keyword scores
    for dtype, keys in keyword_map.items():
        kw_hits = [k for k in keys if k in lowered_lines]
        score_by_type[dtype] += len(kw_hits)  # +1 per keyword
        signals[dtype].extend([f"kw:{k}" for k in kw_hits])
    # Strong signals
    if re_kra_pin.search(lowered_lines):
        score_by_type['kra_pin'] += 6
        signals['kra_pin'].append('re:kra_pin')
    if re_plate.search(lowered_lines):
        score_by_type['logbook'] += 4
        signals['logbook'].append('re:plate')
    if re_vin.search(lowered_lines):
        score_by_type['logbook'] += 5
        signals['logbook'].append('re:vin')
    if re_id_label.search(lowered_lines):
        score_by_type['national_id'] += 4
        signals['national_id'].append('re:id_label')

    # Bonus for co-existence of multiple strong signals per type
    if {'re:vin', 're:plate'} <= set(signals['logbook']):
        score_by_type['logbook'] += 2
        signals['logbook'].append('bonus:vin+plate')

    # MUTUAL EXCLUSIVITY: If logbook signals are strong, disqualify other types
    # This prevents vehicle documents from being accepted as ID/KRA PIN docs
    logbook_score = score_by_type['logbook']
    has_vehicle_signals = logbook_score >= 4 or any(s.startswith('re:') for s in signals['logbook'])
    
    if has_vehicle_signals:
        # Strong vehicle indicators present - this CANNOT be an ID or KRA PIN document
        score_by_type['national_id'] = 0
        score_by_type['kra_pin'] = 0
        signals['national_id'].append('disqualified:vehicle_doc')
        signals['kra_pin'].append('disqualified:vehicle_doc')
    
    # Conversely, if strong ID/KRA signals present, reduce logbook score
    has_id_signals = score_by_type['national_id'] >= 4 or any(s.startswith('re:') for s in signals['national_id'])
    has_kra_signals = score_by_type['kra_pin'] >= 6 or 're:kra_pin' in signals['kra_pin']
    
    if has_id_signals or has_kra_signals:
        # Strong personal/tax document indicators - unlikely to be logbook
        if not has_vehicle_signals:  # Only if no vehicle signals
            score_by_type['logbook'] = max(0, score_by_type['logbook'] - 3)

    # Pick best
    guessed = None
    best_score = -1
    for dtype, sc in score_by_type.items():
        if sc > best_score:
            best_score = sc
            guessed = dtype

    # Determine clarity bucket
    line_count = len(lines)
    word_count = len(words)
    if avg_conf is None:
        clarity = 'unknown'
    elif avg_conf >= 93 and line_count >= 8:
        clarity = 'good'
    elif avg_conf >= 85 and line_count >= 5:
        clarity = 'fair'
    else:
        clarity = 'poor'

    expected = (expected_doc_type or '').lower() or None
    type_match = True
    if expected and guessed:
        # Allow loose match for synonyms
        synonyms = {
            'id_copy': 'national_id',
            'id': 'national_id',
            'rc': 'logbook',
            'vehicle_logbook': 'logbook',
        }
        exp_norm = synonyms.get(expected, expected)
        type_match = (exp_norm == guessed)

    present = []
    missing = []
    if expected:
        keys = keyword_map.get(synonyms.get(expected, expected), []) if 'synonyms' in locals() else keyword_map.get(expected, [])
        for k in keys:
            (present if k in lowered_lines else missing).append(k)

    return {
        'guessedType': guessed,
        'expectedType': expected,
        'typeMatch': type_match,
        'clarity': clarity,
        'avgWordConfidence': round(avg_conf, 2) if isinstance(avg_conf, (int, float)) else None,
        'lineCount': line_count,
        'wordCount': word_count,
        'presentKeywords': present,
        'missingKeywords': missing,
        'typeScores': score_by_type,
        'signals': signals,
    }


def _maybe_complete_from_s3(doc: DocumentUpload):
    """If Lambda wrote raw results to S3 at results/{jobId}.json, read and complete the job here.
    This allows end-to-end without a public callback URL in dev/staging.
    """
    bucket = _env('RESULTS_S3_BUCKET') or _env('S3_BUCKET')
    if not bucket:
        print("Docs pipeline: S3_BUCKET not set; cannot poll results")
        return False
    prefix = (_env('RESULTS_S3_PREFIX') or _env('S3_PREFIX') or '').strip().rstrip('/')
    template = (_env('RESULTS_KEY_TEMPLATE') or '').strip()
    object_key = (doc.file_path or '').lstrip('/')
    basename = object_key.split('/')[-1] if object_key else ''

    candidate_keys = []
    # 1) Explicit template override
    if template:
        try:
            key_from_tpl = template.replace('{jobId}', str(doc.id)).replace('{objectKey}', object_key).replace('{basename}', basename)
            if key_from_tpl:
                candidate_keys.append(key_from_tpl.lstrip('/'))
        except Exception:
            pass
    
    # 2) Common default locations - prevent double "results/" when prefix already contains it
    if prefix:
        # If prefix already ends with 'results' or 'textract-results', don't add '/results' again
        if prefix.endswith('results') or prefix.endswith('textract-results') or prefix.endswith('textract/results'):
            candidate_keys.append(f"{prefix}/{doc.id}.json")
        else:
            candidate_keys.append(f"{prefix}/results/{doc.id}.json")
            candidate_keys.append(f"{prefix}/textract/results/{doc.id}.json")
            candidate_keys.append(f"{prefix}/textract-results/{doc.id}.json")
    
    # 3) Fallback locations without prefix
    candidate_keys.append(f"results/{doc.id}.json")
    candidate_keys.append(f"textract/results/{doc.id}.json")
    candidate_keys.append(f"textract-results/{doc.id}.json")
    
    # 4) Also try basename-oriented locations (some Lambdas emit results by original filename)
    if basename:
        if prefix:
            if prefix.endswith('results') or prefix.endswith('textract-results') or prefix.endswith('textract/results'):
                candidate_keys.append(f"{prefix}/{basename}.json")
            else:
                candidate_keys.append(f"{prefix}/results/{basename}.json")
                candidate_keys.append(f"{prefix}/textract/results/{basename}.json")
                candidate_keys.append(f"{prefix}/textract-results/{basename}.json")
        candidate_keys.append(f"results/{basename}.json")
        candidate_keys.append(f"textract/results/{basename}.json")
        candidate_keys.append(f"textract-results/{basename}.json")
    
    # 5) Heuristics relative to uploaded object
    if object_key:
        candidate_keys.append(f"{object_key}.json")
    
    s3 = boto3.client('s3', region_name=_env('AWS_REGION'))
    raw = None
    found_key = None
    
    for key in candidate_keys:
        try:
            s3.head_object(Bucket=bucket, Key=key)
            # Found the object, now try to read it
            try:
                obj = s3.get_object(Bucket=bucket, Key=key)
                raw = json.loads(obj['Body'].read())
                found_key = key
                print(f"✅ Docs pipeline: Found results at s3://{bucket}/{key}")
                break
            except Exception as read_err:
                print(f"Docs pipeline: get_object/read failed for s3://{bucket}/{key}: {read_err}")
                continue
        except Exception:
            # Object not found at this location, try next
            continue
    
    if raw is None:
        # Only log once if no results found anywhere
        print(f"Docs pipeline: No results found for job {doc.id} in bucket {bucket}. Tried {len(candidate_keys)} locations.")
        return False

    print(f"📦 Raw data type: {type(raw)}")
    print(f"📦 Raw data keys: {list(raw.keys()) if isinstance(raw, dict) else 'Not a dict'}")
    print(f"📦 Has 'Blocks': {'Blocks' in raw if isinstance(raw, dict) else False}")
    
    raw_fields, canonical = _extract_fields(raw)
    
    print(f"📊 Extracted raw_fields: {len(raw_fields)} fields")
    print(f"📊 Canonical fields: {len(canonical)} fields")
    if canonical:
        print(f"   Canonical keys: {list(canonical.keys())}")
    
    diagnostics = _diagnose_document(raw, doc.document_type)
    with transaction.atomic():
        doc = DocumentUpload.objects.select_for_update().get(id=doc.id)
        # Store raw, canonical and diagnostics for flexibility
        doc.extracted_data = {'fields': raw_fields or {}, 'canonicalFields': canonical or {}, 'diagnostics': diagnostics}
        doc.extraction_confidence = None
        doc.processing_status = 'DONE'
        doc.save(update_fields=['extracted_data', 'extraction_confidence', 'processing_status', 'date_updated'])
        # mirror onto quotation.textract_data
        try:
            q = doc.quotation
            q.textract_data = (q.textract_data or {})
            keyname = (doc.document_type or 'document').lower()
            q.textract_data[keyname] = doc.extracted_data
            q.save(update_fields=['textract_data', 'date_updated'])
        except Exception:
            pass
    return True


class PresignUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = request.data or {}
            filename = data.get('filename')
            mime_type = data.get('mimeType') or 'application/octet-stream'
            size_bytes = int(data.get('sizeBytes') or 0)
            doc_type = data.get('docType') or 'generic'
            quote_id = data.get('quoteId')

            if not filename:
                return Response({'code': 'VALIDATION', 'message': 'filename required'}, status=400)
            if size_bytes <= 0 or size_bytes > (int(_env('MAX_UPLOAD_MB', 15)) * 1024 * 1024):
                return Response({'code': 'LIMIT', 'message': 'invalid file size'}, status=400)

            bucket = _env('S3_BUCKET')
            if not bucket:
                return Response({'code': 'CONFIG', 'message': 'S3 bucket not configured'}, status=500)

            s3 = boto3.client('s3')
            agent_id = str(getattr(request.user, 'id', 'unknown'))
            prefix = _env('S3_PREFIX', '')
            key = _build_object_key(agent_id, filename)
            if prefix:
                key = f"{prefix.rstrip('/')}/{key}"

            # Restrict to PUT only, short expiry, specific content type and length
            conditions = [
                {"Content-Type": mime_type},
                ["content-length-range", size_bytes, size_bytes],
            ]

            presigned = s3.generate_presigned_url(
                ClientMethod='put_object',
                Params={
                    'Bucket': bucket,
                    'Key': key,
                    'ContentType': mime_type,
                    'ServerSideEncryption': 'aws:kms' if _env('KMS_KEY_ID') else 'AES256',
                    **({'SSEKMSKeyId': _env('KMS_KEY_ID')} if _env('KMS_KEY_ID') else {}),
                },
                ExpiresIn=int(_env('PRESIGN_EXPIRES_SEC', 600)),
            )

            return Response({
                'uploadUrl': presigned,
                'objectKey': key,
                'headers': {
                    'Content-Type': mime_type,
                },
                'expiresInSec': int(_env('PRESIGN_EXPIRES_SEC', 600)),
            })
        except Exception as e:
            return Response({'code': 'TEMPORARY', 'message': str(e)}, status=500)


class SubmitExtractionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            body = request.data or {}
            object_key = body.get('objectKey')
            doc_type = body.get('docType') or 'generic'
            correlation_id = body.get('correlationId') or str(uuid.uuid4())
            quote_id = body.get('quoteId')
            if not object_key:
                return Response({'code': 'VALIDATION', 'message': 'objectKey required'}, status=400)

            # Create job row in our DocumentUpload with PROCESSING state
            with transaction.atomic():
                quotation = None
                if quote_id:
                    try:
                        quotation = InsuranceQuotation.objects.get(id=quote_id, agent=request.user)
                    except InsuranceQuotation.DoesNotExist:
                        return Response({'code': 'NOT_ALLOWED', 'message': 'quotation not found or not owned by you'}, status=403)
                # If no quotation was provided or found, create a minimal draft so FK is satisfied
                if quotation is None:
                    quotation = InsuranceQuotation.objects.create(
                        agent=request.user,
                        insurance_type='MOTOR_PRIVATE',
                        form_data={
                            'source': 'docs_upload',
                            'docType': doc_type,
                            'autoCreated': True,
                        },
                    )
                doc = DocumentUpload.objects.create(
                    quotation=quotation,
                    document_type=doc_type,
                    file_path=object_key,
                    original_filename=object_key.split('/')[-1],
                    processing_status='PROCESSING',
                )

            # Enqueue to SQS for Lambda processing
            queue_url = _env('SQS_QUEUE_URL')
            # Basic URL validation; treat placeholder/invalid as not configured
            def _valid_queue(u: str) -> bool:
                if not u or u.strip() in ('<QueueUrl>', 'QueueUrl', 'None'):
                    return False
                return u.startswith('https://') and '.amazonaws.com' in u

            if queue_url and not _valid_queue(queue_url):
                # Invalid placeholder or malformed URL; treat as not configured
                print("Docs pipeline: SQS_QUEUE_URL appears invalid; skipping SQS enqueue.")
                queue_url = None

            if queue_url:
                try:
                    sqs = boto3.client('sqs')
                    # Compute absolute callback URL
                    base = _env('DJANGO_API_URL')
                    if not base:
                        # Build from the incoming request host if not explicitly configured
                        base = request.build_absolute_uri('/')[:-1]
                    msg = {
                        'jobId': str(doc.id),
                        'objectKey': object_key,
                        'docType': doc_type,
                        'callbackUrl': (base or '').rstrip('/') + '/api/v1/public_app/docs/callback',
                    }
                    # Optional: include quotation id
                    if quotation:
                        msg['quoteId'] = str(quotation.id)
                    sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(msg))
                except Exception as send_err:
                    # Log and continue; S3 event/Lambda may process the object without SQS
                    print(f"Docs pipeline: SQS send failed: {send_err}")
                    queue_url = None
            else:
                # Helpful guidance to aid setup when SQS is not configured
                print(
                    "Docs pipeline: SQS_QUEUE_URL not configured. No Lambda will be triggered unless you set up an S3 ObjectCreated event to your Lambda. "
                    "Set SQS_QUEUE_URL in .env and attach the queue as a trigger to your Lambda (recommended)."
                )

            # Always proceed in PROCESSING state; completion will occur via S3 results polling or callback
            state = 'PROCESSING'

            # No hard failure when queue is missing; allow S3/Lambda event flow to complete asynchronously

            return Response({'jobId': str(doc.id), 'state': state, 'quoteId': str(quotation.id)})
        except Exception as e:
            return Response({'code': 'TEMPORARY', 'message': str(e)}, status=500)


class JobStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id: str):
        doc = get_object_or_404(DocumentUpload, id=job_id, quotation__agent=request.user)
        # If still processing, attempt S3-based completion (Lambda writes results/{jobId}.json)
        if (doc.processing_status or 'UPLOADED') in ('UPLOADED', 'PROCESSING'):
            try:
                if _maybe_complete_from_s3(doc):
                    # Reload to reflect changes
                    doc.refresh_from_db()
            except Exception:
                pass
        return Response({
            'jobId': str(doc.id),
            'state': doc.processing_status or 'UPLOADED',
            'error': None,
        })


class JobResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id: str):
        doc = get_object_or_404(DocumentUpload, id=job_id, quotation__agent=request.user)
        data = doc.extracted_data or {}
        # Backward compatible: if canonical present, expose as 'fields' and also include rawFields
        if isinstance(data, dict) and 'canonicalFields' in data:
            fields_out = data.get('canonicalFields') or {}
            raw_out = data.get('fields') or {}
            diagnostics = data.get('diagnostics') or None
        else:
            # Derive canonical from raw KV if possible
            fields_out = data
            raw_out = data
            try:
                if isinstance(data, dict):
                    lower = {str(k).lower(): v for k, v in data.items()}
                    canonical_only = _canonicalize_fields(lower, [])
                    if canonical_only:
                        fields_out = canonical_only
            except Exception:
                pass
            diagnostics = None
        result = {
            'jobId': str(doc.id),
            'objectKey': doc.file_path,
            'docType': doc.document_type,
            'fields': fields_out,
            'rawFields': raw_out,
            'diagnostics': diagnostics,
            'confidenceScores': doc.extraction_confidence,
        }
        return Response(result)


class CallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Validate HMAC header if present
        # Support both legacy and new variable names
        secret = _env('CALLBACK_SECRET') or _env('DOCS_HMAC_SECRET')
        if secret:
            sig = request.headers.get('X-PB-Signature')
            body_bytes = request.body or b''
            expected = hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()
            if not sig or not hmac.compare_digest(sig, expected):
                return Response({'code': 'AUTH', 'message': 'invalid signature'}, status=401)

        payload = request.data or {}
        job_id = payload.get('jobId')
        result = payload.get('result') or {}
        success = bool(result)
        if not job_id:
            return Response({'code': 'VALIDATION', 'message': 'jobId required'}, status=400)

        try:
            with transaction.atomic():
                doc = DocumentUpload.objects.select_for_update().get(id=job_id)
                # If Lambda already provided canonicalFields keep them; otherwise compute a minimal canonical set if raw Textract provided
                provided_fields = result.get('fields') if isinstance(result, dict) else None
                provided_canonical = result.get('canonicalFields') if isinstance(result, dict) else None
                if provided_fields is not None or provided_canonical is not None:
                    doc.extracted_data = {
                        'fields': provided_fields or {},
                        'canonicalFields': provided_canonical or {},
                        'diagnostics': result.get('diagnostics') or None,
                    }
                else:
                    # If callback supplies raw Textract, attempt to normalize
                    if 'Blocks' in result:
                        raw_fields, canonical = _extract_fields(result)
                        diag = _diagnose_document(result, doc.document_type)
                        doc.extracted_data = {'fields': raw_fields, 'canonicalFields': canonical, 'diagnostics': diag}
                    else:
                        # As a fallback, store the result dict
                        doc.extracted_data = result
                conf = result.get('confidence') or result.get('confidenceScores')
                try:
                    doc.extraction_confidence = float(conf) if conf is not None else None
                except Exception:
                    doc.extraction_confidence = None
                doc.processing_status = 'DONE' if success else 'FAILED'
                doc.save(update_fields=['extracted_data', 'extraction_confidence', 'processing_status', 'date_updated'])

                # Also persist onto quotation.textract_data for convenience/aggregation
                try:
                    q = doc.quotation
                    q.textract_data = (q.textract_data or {})
                    key = (doc.document_type or 'document').lower()
                    q.textract_data[key] = doc.extracted_data
                    q.save(update_fields=['textract_data', 'date_updated'])
                except Exception:
                    pass
        except DocumentUpload.DoesNotExist:
            return Response({'code': 'NOT_FOUND', 'message': 'job not found'}, status=404)

        return Response({'ok': True})


def _apply_canonical_to_form(doc_type: str, canonical: dict, form_data: dict) -> tuple[dict, list[str]]:
    """Map canonical fields to form_data keys depending on document type.
    Returns (updated_form_data, applied_keys)
    
    Enhanced for Motor2 with:
    - isAutoFilled and autoFillSource metadata flags
    - Multiple field name aliases for registration
    - Support for make, model, year, chassisNumber from logbook
    """
    form = dict(form_data or {})
    applied = []
    dt = (doc_type or '').lower()
    
    # Common mappings
    if canonical.get('owner_name') and not form.get('ownerName'):
        form['ownerName'] = canonical['owner_name']
        form['ownerName_isAutoFilled'] = True
        form['ownerName_autoFillSource'] = dt
        applied.append('ownerName')
        
    if canonical.get('date_of_birth') and not form.get('ownerDob'):
        form['ownerDob'] = canonical['date_of_birth']
        form['ownerDob_isAutoFilled'] = True
        form['ownerDob_autoFillSource'] = dt
        applied.append('ownerDob')
        
    if canonical.get('id_number') and not form.get('ownerIdNumber'):
        form['ownerIdNumber'] = canonical['id_number']
        form['ownerIdNumber_isAutoFilled'] = True
        form['ownerIdNumber_autoFillSource'] = dt
        applied.append('ownerIdNumber')
        
    # KRA PIN appears on its own document; map to both legacy and new fields if missing
    if canonical.get('kra_pin'):
        if not form.get('kra_pin'):
            form['kra_pin'] = canonical['kra_pin']
            form['kra_pin_isAutoFilled'] = True
            form['kra_pin_autoFillSource'] = dt
            applied.append('kra_pin')
        if not form.get('owner_kra_pin'):
            form['owner_kra_pin'] = canonical['kra_pin']
            form['owner_kra_pin_isAutoFilled'] = True
            form['owner_kra_pin_autoFillSource'] = dt
            applied.append('owner_kra_pin')
    
    # Document-type specific
    if dt in ('national_id', 'id', 'id_copy', 'passport'):
        # nothing extra beyond common for now
        pass
    elif dt in ('logbook', 'rc', 'vehicle_logbook'):
        # Registration number - map to multiple possible field names
        registration_value = (
            canonical.get('registration_number') or 
            canonical.get('registrationNumber') or 
            canonical.get('registration') or
            canonical.get('vehicle_registration')
        )
        
        if registration_value:
            # Map to all common registration field aliases
            registration_fields = ['registrationNumber', 'registration', 'vehicle_registration']
            for field in registration_fields:
                if not form.get(field):
                    form[field] = registration_value
                    form[f'{field}_isAutoFilled'] = True
                    form[f'{field}_autoFillSource'] = 'logbook'
                    applied.append(field)
        
        # Vehicle make
        make_value = canonical.get('make') or canonical.get('vehicle_make')
        if make_value and not form.get('make'):
            form['make'] = make_value
            form['make_isAutoFilled'] = True
            form['make_autoFillSource'] = 'logbook'
            applied.append('make')
        
        # Vehicle model
        model_value = canonical.get('model') or canonical.get('vehicle_model')
        if model_value and not form.get('model'):
            form['model'] = model_value
            form['model_isAutoFilled'] = True
            form['model_autoFillSource'] = 'logbook'
            applied.append('model')
        
        # Vehicle year
        year_value = canonical.get('year') or canonical.get('yearOfManufacture') or canonical.get('year_of_manufacture')
        if year_value and not form.get('year'):
            form['year'] = year_value
            form['year_isAutoFilled'] = True
            form['year_autoFillSource'] = 'logbook'
            applied.append('year')
        
        # Chassis number
        chassis_value = canonical.get('chassisNumber') or canonical.get('chassis_number') or canonical.get('chassis')
        if chassis_value and not form.get('chassisNumber'):
            form['chassisNumber'] = chassis_value
            form['chassisNumber_isAutoFilled'] = True
            form['chassisNumber_autoFillSource'] = 'logbook'
            applied.append('chassisNumber')
    
    return form, applied


class ApplyResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, job_id: str):
        # Load doc and ensure ownership
        doc = get_object_or_404(DocumentUpload, id=job_id, quotation__agent=request.user)
        if (doc.processing_status or '').upper() != 'DONE':
            return Response({'code': 'STATE', 'message': 'job not DONE'}, status=400)
        data = doc.extracted_data or {}
        # Ensure canonical exists (compute if needed)
        if isinstance(data, dict) and 'canonicalFields' in data:
            canonical = data.get('canonicalFields') or {}
        else:
            canonical = {}
            try:
                if isinstance(data, dict):
                    canonical = _canonicalize_fields({str(k).lower(): v for k, v in data.items()}, [])
            except Exception:
                pass
        # Update quotation.form_data
        with transaction.atomic():
            q = InsuranceQuotation.objects.select_for_update().get(id=doc.quotation_id)
            updated_form, applied = _apply_canonical_to_form(doc.document_type, canonical, q.form_data or {})
            q.form_data = updated_form
            # Also persist canonical summary onto textract_data for traceability
            q.textract_data = (q.textract_data or {})
            key = (doc.document_type or 'document').lower()
            q.textract_data[key] = data
            q.save(update_fields=['form_data', 'textract_data', 'date_updated'])
        return Response({'ok': True, 'quoteId': str(q.id), 'applied': applied, 'formData': q.form_data})
