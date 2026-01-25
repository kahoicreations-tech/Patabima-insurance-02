import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import S3DocumentService from '../../../../../services/S3DocumentService';
import HybridTextractService from '../../../../../services/HybridTextractService';
import StepNavigation from './StepNavigation';
import { Colors } from '../../../../../constants/Colors';
import { Typography } from '../../../../../constants/Typography';
import { Spacing } from '../../../../../constants/Spacing';
import { moderateScale, ResponsiveSpacing, ResponsiveFontSize } from '../../utils/responsive';
import Motor3Stepper from '../../components/Motor3Stepper';
import { detectDocumentType, validateDocumentType } from '../../../../../utils/documentTypeDetector';

const DOC_RULES = {
  logbook: {
    allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'],
    minBytes: 150 * 1024,
    minImageDims: { minW: 1000, minH: 700 },
    enforceOcr: true,
  },
  id_copy: {
    allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'],
    minBytes: 100 * 1024,
    minImageDims: { minW: 900, minH: 600 },
    enforceOcr: false,
  },
  kra_pin: {
    allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'],
    minBytes: 100 * 1024,
    minImageDims: { minW: 900, minH: 600 },
    enforceOcr: false,
  },
  finance_cert: {
    allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'],
    minBytes: 50 * 1024,
    minImageDims: { minW: 800, minH: 500 },
    enforceOcr: false,
  },
};

const DEFAULT_DOC_RULE = {
  allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'],
  minBytes: 50 * 1024,
  minImageDims: { minW: 800, minH: 500 },
  enforceOcr: false,
};

const Step5_DocumentUpload = ({ onNext, onBack, currentStep, totalSteps }) => {
  const {
    uploadedDocuments,
    addDocument,
    removeDocument,
    financialInterest,
    clientDetailsSource,
    clientDetails,
    updateClientDetails,
    dmvicSearchResult,
  } = useMotor3();
  const { formData, updateMultipleFields } = useThirdParty();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  // Simplified UI: no separate "Select Details" section

  const cleanExtractedString = useCallback((v) => {
    if (v == null) return '';
    const s = String(v).trim();
    if (!s) return '';
    const upper = s.toUpperCase();
    if (['.', '-', '—', 'N/A', 'NA', 'NONE', 'NULL', 'NIL'].includes(upper)) return '';
    return s;
  }, []);

  const isBlankish = useCallback((v) => {
    const s = cleanExtractedString(v);
    if (!s) return true;
    return s === '0';
  }, [cleanExtractedString]);

  const getUnifiedFields = useCallback((extractedResult) => {
    const canonical =
      extractedResult?.fields ||
      extractedResult?.canonicalFields ||
      extractedResult?.data?.fields ||
      extractedResult?.data?.canonicalFields ||
      {};

    const raw =
      extractedResult?.rawFields ||
      extractedResult?.raw_fields ||
      extractedResult?.data?.rawFields ||
      extractedResult?.data?.raw_fields ||
      {};

    return {
      canonical: (canonical && typeof canonical === 'object') ? canonical : {},
      raw: (raw && typeof raw === 'object') ? raw : {},
    };
  }, []);

  const pickByContains = useCallback((obj, containsList) => {
    if (!obj || typeof obj !== 'object') return null;
    const keys = Object.keys(obj);
    for (const needleRaw of (containsList || [])) {
      const needle = String(needleRaw).toLowerCase();
      const foundKey = keys.find((k) => String(k).toLowerCase().includes(needle));
      if (foundKey) return obj[foundKey];
    }
    return null;
  }, []);

  const normalizePlate = useCallback((v) => {
    const s = cleanExtractedString(v);
    if (!s) return '';
    // Remove ALL non-alphanumeric characters to avoid false mismatches
    // caused by invisible unicode, punctuation, or OCR artifacts.
    return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }, [cleanExtractedString]);

  const normalizePlateForCompare = useCallback((v) => {
    const p = normalizePlate(v);
    if (!p) return '';

    // Handle common OCR confusions in the 3-digit block (O->0, I->1).
    // This reduces false mismatches where the agent can visually see a match.
    const m = p.match(/^(K[A-Z]{2,3})([A-Z0-9]{3})([A-Z])$/);
    if (!m) return p;

    const prefix = m[1];
    const digitsLike = m[2].replace(/O/g, '0').replace(/I/g, '1');
    const suffix = m[3];
    return `${prefix}${digitsLike}${suffix}`;
  }, [normalizePlate]);

  const isValidKenyanPlate = useCallback((plate) => {
    const p = normalizePlate(plate);
    if (!p) return false;
    // Supports KAA123A / KAC040R / KDN234H etc (K + 2-3 letters + 3 digits + 1 letter)
    return /^K[A-Z]{2,3}\d{3}[A-Z]$/.test(p);
  }, [normalizePlate]);

  const findPlateInValues = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const joined = Object.values(obj)
      .map((v) => cleanExtractedString(v))
      .filter(Boolean)
      .join(' ');
    if (!joined) return '';
    const m = joined.toUpperCase().match(/\bK[A-Z]{2,3}\s?\d{3}[A-Z]\b/);
    return m ? m[0] : '';
  }, [cleanExtractedString]);

  const normalizeKraPin = useCallback((pin) => {
    const s = cleanExtractedString(pin);
    if (!s) return '';
    return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }, [cleanExtractedString]);

  const extractKraPinFromResult = useCallback((extractedResult) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const fields = { ...(raw || {}), ...(canonical || {}) };

    const direct = normalizeKraPin(
      fields.kra_pin ||
        fields.kraPin ||
        fields.pin_number ||
        fields.pinNumber ||
        fields.pin_no ||
        fields.pinNo ||
        fields.pin ||
        fields.kra_pin_number ||
        fields.kraPinNumber ||
        canonical?.kra_pin
    );
    if (direct) return direct;

    const valuesText = Object.values(fields)
      .filter((v) => v != null)
      .map((v) => String(v))
      .join('\n');

    const fullText =
      extractedResult?.rawText ||
      extractedResult?.text ||
      extractedResult?.fullText ||
      extractedResult?.data?.rawText ||
      extractedResult?.data?.text ||
      '';

    const haystack = `${valuesText}\n${fullText}`.toUpperCase();

    // Typical KRA PIN: A012345678B (1 letter + 9 digits + 1 letter)
    // OCR/PDF text may include spaces between digit groups.
    const match = haystack.match(/\b[A-Z](?:\s*\d){9}\s*[A-Z]\b/);
    if (match && match[0]) return normalizeKraPin(match[0]);

    return '';
  }, [getUnifiedFields, normalizeKraPin]);

  const getFileExtension = useCallback((filename) => {
    const name = String(filename || '');
    const idx = name.lastIndexOf('.');
    if (idx < 0) return '';
    return name.slice(idx + 1).toLowerCase();
  }, []);

  const isImageMime = useCallback((mimeOrType) => {
    const t = String(mimeOrType || '').toLowerCase();
    return t.startsWith('image/');
  }, []);

  const isPdfMime = useCallback((mimeOrType) => {
    const t = String(mimeOrType || '').toLowerCase();
    return t === 'application/pdf' || t.includes('pdf');
  }, []);

  const validateFileTypeForDoc = useCallback((docType, file) => {
    const ext = getFileExtension(file?.name);
    const mime = String(file?.type || '').toLowerCase();

    const rule = DOC_RULES[docType] || DEFAULT_DOC_RULE;
    const allowedExts = new Set((rule.allowedExts || DEFAULT_DOC_RULE.allowedExts).map((e) => String(e).toLowerCase()));
    const isPdf = isPdfMime(mime) || ext === 'pdf';
    const isImg = isImageMime(mime) || (ext && allowedExts.has(ext) && ext !== 'pdf');
    const allowed = (ext && allowedExts.has(ext)) || isPdf || isImg;
    if (!allowed) {
      return {
        ok: false,
        message: 'Unsupported file type. Please upload a PDF or clear photo (JPG/PNG/HEIC).',
      };
    }

    // Finance certs can be PDF/photo; others also support PDF/photo.
    // (We keep it consistent across docs to avoid surprises for agents.)
    return { ok: true };
  }, [getFileExtension, isImageMime, isPdfMime]);

  const getImageSize = useCallback((uri) => {
    return new Promise((resolve) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        () => resolve(null)
      );
    });
  }, []);

  const preflightReadabilityCheck = useCallback(async (docType, file) => {
    const info = await FileSystem.getInfoAsync(file?.uri || '', { size: true });
    const sizeBytes = typeof info?.size === 'number' ? info.size : (typeof file?.size === 'number' ? file.size : null);

    const rule = DOC_RULES[docType] || DEFAULT_DOC_RULE;

    const res = {
      ok: true,
      level: 'ok', // ok | warn
      code: null,
      message: null,
      sizeBytes,
      imageDims: null,
    };

    // Size heuristics (bad scans are often tiny)
    const minSize = rule.minBytes ?? DEFAULT_DOC_RULE.minBytes;
    if (typeof sizeBytes === 'number' && sizeBytes > 0 && sizeBytes < minSize) {
      res.ok = false;
      res.level = 'warn';
      res.code = 'LOW_FILE_SIZE';
      res.message = 'This file looks small/low quality. Extraction may fail. You can proceed or re-upload a clearer photo/scan.';
    }

    // Resolution heuristics for images only (PDFs can’t be reliably measured client-side)
    const mime = String(file?.type || '').toLowerCase();
    const allowedExts = new Set((rule.allowedExts || DEFAULT_DOC_RULE.allowedExts).map((e) => String(e).toLowerCase()));
    const isImg = isImageMime(mime) || (allowedExts.has(getFileExtension(file?.name)) && getFileExtension(file?.name) !== 'pdf');
    const isPdf = isPdfMime(mime) || getFileExtension(file?.name) === 'pdf';

    if (isPdf) return res;
    if (!isImg) return res;

    const dim = await getImageSize(file.uri);
    if (!dim) {
      if (res.level !== 'warn') {
        res.ok = false;
        res.level = 'warn';
        res.code = 'DIMENSIONS_UNAVAILABLE';
        res.message = 'Could not read image dimensions. Extraction may fail. You can proceed or re-upload.';
      }
      return res;
    }

    const { width, height } = dim;
    res.imageDims = { width, height };
    const req = rule.minImageDims ?? DEFAULT_DOC_RULE.minImageDims;

    const ok = width >= req.minW && height >= req.minH;
    if (!ok) {
      res.ok = false;
      res.level = 'warn';
      res.code = 'LOW_RESOLUTION';
      res.message = 'Image resolution looks low. Extraction may fail. You can proceed or re-upload a clearer photo/scan (no blur, fill the frame).';
    }

    return res;
  }, [getFileExtension, getImageSize, isImageMime, isPdfMime]);

  const extractLogbookOwnerName = useCallback((extractedResult) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const ownerNameRaw =
      canonical?.owner_name ||
      canonical?.ownerName ||
      canonical?.full_name ||
      raw?.owner_name ||
      raw?.ownerName ||
      raw?.full_name ||
      pickByContains(raw, ['registered owner', "owner's name", 'owner name', 'proprietor', 'name of owner']);
    return cleanExtractedString(ownerNameRaw);
  }, [cleanExtractedString, getUnifiedFields, pickByContains]);

  const extractLogbookChassis = useCallback((extractedResult) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const v =
      canonical?.chassis_number ||
      canonical?.chassisNumber ||
      canonical?.vin ||
      raw?.chassis_number ||
      raw?.chassisNumber ||
      raw?.vin ||
      pickByContains(raw, ['chassis', 'vin', 'frame']);
    return cleanExtractedString(v);
  }, [cleanExtractedString, getUnifiedFields, pickByContains]);

  const extractLogbookEngine = useCallback((extractedResult) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const v =
      canonical?.engine_number ||
      canonical?.engineNumber ||
      raw?.engine_number ||
      raw?.engineNumber ||
      pickByContains(raw, ['engine']);
    return cleanExtractedString(v);
  }, [cleanExtractedString, getUnifiedFields, pickByContains]);

  const extractLogbookMakeModel = useCallback((extractedResult) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const make = cleanExtractedString(canonical?.make || raw?.make || pickByContains(raw, ['make']));
    const model = cleanExtractedString(canonical?.model || raw?.model || pickByContains(raw, ['model']));
    return { make, model };
  }, [cleanExtractedString, getUnifiedFields, pickByContains]);

  const validateMandatoryFields = useCallback((docType, extractedResult, extractedRegForLogbook) => {
    const missing = [];
    const criticalMissing = [];

    const scoresRaw =
      extractedResult?.confidenceScores ||
      extractedResult?.confidence_scores ||
      extractedResult?.data?.confidenceScores ||
      extractedResult?.data?.confidence_scores ||
      null;

    const getScore = (keyCandidates) => {
      if (!scoresRaw || typeof scoresRaw !== 'object') return null;
      const keys = Object.keys(scoresRaw);
      for (const k of (keyCandidates || [])) {
        const found = keys.find((kk) => String(kk).toLowerCase() === String(k).toLowerCase());
        if (found == null) continue;
        const v = scoresRaw[found];
        if (typeof v !== 'number') continue;
        // Normalize 0..1 to 0..100 if needed
        return v <= 1 ? (v * 100) : v;
      }
      return null;
    };

    const isLowConfidence = (score, threshold = 70) => {
      if (typeof score !== 'number') return false;
      return score < threshold;
    };

    if (docType === 'logbook') {
      const ownerName = extractLogbookOwnerName(extractedResult);
      const chassis = extractLogbookChassis(extractedResult);
      const engine = extractLogbookEngine(extractedResult);
      const { make, model } = extractLogbookMakeModel(extractedResult);

      const ownerScore = getScore(['owner_name', 'ownerName', 'registered_owner', 'registeredOwner', 'full_name', 'name']);
      const regScore = getScore(['registration_number', 'registrationNumber', 'vehicle_registration', 'reg_no', 'plate']);
      const chassisScore = getScore(['chassis_number', 'chassisNumber', 'vin']);
      const engineScore = getScore(['engine_number', 'engineNumber']);
      const makeScore = getScore(['make']);
      const modelScore = getScore(['model']);

      // Hard requirements for reconciliation
      if (!extractedRegForLogbook) criticalMissing.push('Registration number');
      if (!ownerName) criticalMissing.push('Registered owner name');

      // If backend provided field scores, enforce minimum quality for critical items
      if (isLowConfidence(regScore)) criticalMissing.push('Registration number (low confidence)');
      if (isLowConfidence(ownerScore)) criticalMissing.push('Registered owner name (low confidence)');

      // Strong requirements (can be confirmed/manual in review)
      if (!chassis) missing.push('Chassis/VIN number');
      if (!engine) missing.push('Engine number');
      if (!make) missing.push('Vehicle make');
      if (!model) missing.push('Vehicle model');

      if (isLowConfidence(chassisScore)) missing.push('Chassis/VIN number (low confidence)');
      if (isLowConfidence(engineScore)) missing.push('Engine number (low confidence)');
      if (isLowConfidence(makeScore)) missing.push('Vehicle make (low confidence)');
      if (isLowConfidence(modelScore)) missing.push('Vehicle model (low confidence)');
    }

    if (docType === 'kra_pin') {
      const { canonical, raw } = getUnifiedFields(extractedResult);
      const fields = { ...(raw || {}), ...(canonical || {}) };
      const pin = extractKraPinFromResult(extractedResult);
      const name = cleanExtractedString(fields.owner_name || fields.ownerName || fields.full_name || fields.name || canonical?.owner_name);

      const pinScore = getScore(['kra_pin', 'pin_number', 'pin']);
      const nameScore = getScore(['owner_name', 'ownerName', 'full_name', 'name']);
      if (!pin) criticalMissing.push('KRA PIN');
      if (!name) criticalMissing.push('Legal name');

      if (isLowConfidence(pinScore)) criticalMissing.push('KRA PIN (low confidence)');
      if (isLowConfidence(nameScore)) criticalMissing.push('Legal name (low confidence)');
    }

    // We don’t enforce OCR on finance cert yet (varies widely)
    return { missing, criticalMissing };
  }, [cleanExtractedString, extractKraPinFromResult, extractLogbookChassis, extractLogbookEngine, extractLogbookMakeModel, extractLogbookOwnerName, getUnifiedFields]);

  const getExtractionConfidence = useCallback((result) => {
    // Backend currently returns either:
    // - confidenceScores (map) OR
    // - diagnostics.avgWordConfidence (0-100)
    const avgWord = result?.diagnostics?.avgWordConfidence;
    if (typeof avgWord === 'number' && Number.isFinite(avgWord)) return avgWord;

    const scoresRaw = result?.confidenceScores || result?.confidence_scores || result?.data?.confidenceScores || result?.data?.confidence_scores;
    if (scoresRaw && typeof scoresRaw === 'object') {
      const vals = Object.values(scoresRaw)
        .map((v) => (typeof v === 'number' ? (v <= 1 ? v * 100 : v) : null))
        .filter((v) => typeof v === 'number' && Number.isFinite(v));
      if (vals.length > 0) {
        const sum = vals.reduce((a, b) => a + b, 0);
        return sum / vals.length;
      }
    }
    return null;
  }, []);

  const normalizeYear = useCallback((year) => {
    if (!year) return '';
    const yearStr = String(year).trim();
    if (yearStr.length === 4) return yearStr;
    if (yearStr.length === 2) {
      const yearNum = parseInt(yearStr, 10);
      if (!Number.isFinite(yearNum)) return yearStr;
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const currentYearLast2 = currentYear % 100;
      if (yearNum > currentYearLast2) return String(currentCentury - 100 + yearNum);
      return String(currentCentury + yearNum);
    }
    return yearStr;
  }, []);

  const normalizeLoose = useCallback((v) => {
    const s = cleanExtractedString(v);
    if (!s) return '';
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }, [cleanExtractedString]);

  const areSimilar = useCallback((a, b) => {
    const aa = normalizeLoose(a);
    const bb = normalizeLoose(b);
    if (!aa || !bb) return false;
    if (aa === bb) return true;
    if (aa.includes(bb) || bb.includes(aa)) return true;

    const aTokens = new Set(aa.split(' ').filter(Boolean));
    const bTokens = new Set(bb.split(' ').filter(Boolean));
    let inter = 0;
    for (const t of aTokens) {
      if (bTokens.has(t)) inter += 1;
    }
    const denom = Math.max(1, Math.min(aTokens.size, bTokens.size));
    return (inter / denom) >= 0.6;
  }, [normalizeLoose]);

  const getDmvicVehicleNormalized = useCallback(() => {
    const response = dmvicSearchResult?.response;
    const vehicle = response?.vehicle || response;
    if (!vehicle) return null;
    return {
      registration: cleanExtractedString(vehicle?.registration_number || vehicle?.registration),
      chassis: cleanExtractedString(vehicle?.chassis_number || vehicle?.chassis),
      make: cleanExtractedString(vehicle?.make),
      model: cleanExtractedString(vehicle?.model),
      year: normalizeYear(vehicle?.year_of_manufacture || vehicle?.year),
    };
  }, [cleanExtractedString, dmvicSearchResult, normalizeYear]);

  const buildFieldAudit = useCallback((docType, extractedResult, extractedAtIso, extractionStatus, userDecision) => {
    const scoresRaw =
      extractedResult?.confidenceScores ||
      extractedResult?.confidence_scores ||
      extractedResult?.data?.confidenceScores ||
      extractedResult?.data?.confidence_scores ||
      null;

    const scoreFor = (keyCandidates) => {
      if (!scoresRaw || typeof scoresRaw !== 'object') return null;
      const keys = Object.keys(scoresRaw);
      for (const k of (keyCandidates || [])) {
        const found = keys.find((kk) => String(kk).toLowerCase() === String(k).toLowerCase());
        if (found == null) continue;
        const v = scoresRaw[found];
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        return v <= 1 ? (v * 100) : v;
      }
      return null;
    };

    const out = {};
    if (docType === 'logbook') {
      const { canonical, raw } = getUnifiedFields(extractedResult);
      const reg = cleanExtractedString(
        canonical?.registration_number ||
        canonical?.registrationNumber ||
        canonical?.vehicle_registration ||
        raw?.registration_number ||
        raw?.registrationNumber ||
        raw?.vehicle_registration
      );
      const owner = extractLogbookOwnerName(extractedResult);
      const chassis = extractLogbookChassis(extractedResult);
      const engine = extractLogbookEngine(extractedResult);
      const { make, model } = extractLogbookMakeModel(extractedResult);
      const year = normalizeYear(canonical?.year_of_manufacture || canonical?.year || raw?.year_of_manufacture || raw?.year);

      out.registration_number = {
        value: reg,
        sourceDoc: docType,
        confidenceScore: scoreFor(['registration_number', 'registrationNumber', 'vehicle_registration', 'reg_no', 'plate']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.owner_name = {
        value: owner,
        sourceDoc: docType,
        confidenceScore: scoreFor(['owner_name', 'ownerName', 'registered_owner', 'registeredOwner', 'full_name', 'name']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.chassis_number = {
        value: chassis,
        sourceDoc: docType,
        confidenceScore: scoreFor(['chassis_number', 'chassisNumber', 'vin']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.engine_number = {
        value: engine,
        sourceDoc: docType,
        confidenceScore: scoreFor(['engine_number', 'engineNumber']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.make = {
        value: make,
        sourceDoc: docType,
        confidenceScore: scoreFor(['make']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.model = {
        value: model,
        sourceDoc: docType,
        confidenceScore: scoreFor(['model']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.vehicle_year = {
        value: year,
        sourceDoc: docType,
        confidenceScore: scoreFor(['year_of_manufacture', 'year']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
    }

    if (docType === 'kra_pin') {
      const { canonical, raw } = getUnifiedFields(extractedResult);
      const fields = { ...(raw || {}), ...(canonical || {}) };
      const pin = extractKraPinFromResult(extractedResult);
      const name = cleanExtractedString(fields.owner_name || fields.ownerName || fields.full_name || fields.name || canonical?.owner_name);

      out.kra_pin = {
        value: pin,
        sourceDoc: docType,
        confidenceScore: scoreFor(['kra_pin', 'pin_number', 'pin']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
      out.legal_name = {
        value: name,
        sourceDoc: docType,
        confidenceScore: scoreFor(['owner_name', 'ownerName', 'full_name', 'name']),
        extractedAt: extractedAtIso,
        validationStatus: extractionStatus,
        userDecision,
      };
    }

    return out;
  }, [cleanExtractedString, extractKraPinFromResult, extractLogbookChassis, extractLogbookEngine, extractLogbookMakeModel, extractLogbookOwnerName, getUnifiedFields, normalizeYear]);

  const promptConfirm = useCallback((title, message, confirmLabel = 'Confirm', cancelLabel = 'Re-upload') => {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'default', onPress: () => resolve(true) },
      ]);
    });
  }, []);

  const handleDocumentUploadComplete = useCallback((docRecord) => {
    addDocument(docRecord);
  }, [addDocument]);

  const handleDocumentRemove = useCallback((documentId) => {
    removeDocument(documentId);
  }, [removeDocument]);

  const mergeExtractedIntoClientDetails = useCallback((extractedResult, docType) => {
    const { canonical, raw } = getUnifiedFields(extractedResult);
    const fields = { ...(raw || {}), ...(canonical || {}) };
    if (!fields || typeof fields !== 'object') return;

    const existing = clientDetails || {};
    const updates = {};

    // For logbooks: Only extract owner name (logbooks don't contain email, ID, phone)
    if (docType === 'logbook') {
      const ownerNameRaw =
        canonical?.owner_name ||
        fields.owner_name ||
        fields.ownerName ||
        fields.full_name ||
        fields.name ||
        pickByContains(raw, ['registered owner', "owner's name", 'owner name', 'proprietor', 'name of owner']);

      const ownerName = cleanExtractedString(ownerNameRaw);
      const existingHasMeaningfulName =
        !isBlankish(existing.first_name) || !isBlankish(existing.last_name);

      if (ownerName && !existingHasMeaningfulName) {
        const normalized = String(ownerName).trim().replace(/\s+/g, ' ');
        const parts = normalized.split(' ').filter(Boolean);
        if (parts.length === 1) {
          updates.first_name = parts[0];
        } else if (parts.length > 1) {
          updates.first_name = parts[0];
          updates.last_name = parts.slice(1).join(' ');
        }
      }
    } 
    // For ID documents: Extract ID number, name, phone (if available)
    else if (docType === 'id_copy') {
      const idNumberRaw = fields.id_number || fields.owner_id_number || fields.ownerIdNumber;
      const idNumber = cleanExtractedString(idNumberRaw);
      if (idNumber && !(existing.id_number || '').trim()) {
        updates.id_number = String(idNumber).trim();
      }

      const ownerNameRaw = fields.owner_name || fields.ownerName || fields.full_name || fields.name;
      const ownerName = cleanExtractedString(ownerNameRaw);
      if (ownerName && !(!isBlankish(existing.first_name) || !isBlankish(existing.last_name))) {
        const normalized = String(ownerName).trim().replace(/\s+/g, ' ');
        const parts = normalized.split(' ').filter(Boolean);
        if (parts.length === 1) {
          updates.first_name = parts[0];
        } else if (parts.length > 1) {
          updates.first_name = parts[0];
          updates.last_name = parts.slice(1).join(' ');
        }
      }

      const phone = cleanExtractedString(fields.phone || fields.owner_phone || fields.mobile || fields.msisdn);
      if (phone && !(existing.phone || '').trim()) {
        updates.phone = String(phone).trim();
      }
    }
    // For KRA PIN: Extract KRA PIN and name
    else if (docType === 'kra_pin') {
      const kraPIN = extractKraPinFromResult(extractedResult);
      if (kraPIN && !(existing.kra_pin || '').trim()) {
        updates.kra_pin = kraPIN;
      }

      const ownerName = fields.owner_name || fields.ownerName || fields.full_name || fields.name;
      if (ownerName && !((existing.first_name || '').trim() || (existing.last_name || '').trim())) {
        const normalized = String(ownerName).trim().replace(/\s+/g, ' ');
        const parts = normalized.split(' ').filter(Boolean);
        if (parts.length === 1) {
          updates.first_name = parts[0];
        } else if (parts.length > 1) {
          updates.first_name = parts[0];
          updates.last_name = parts.slice(1).join(' ');
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updateClientDetails(updates);
    }
  }, [cleanExtractedString, clientDetails, extractKraPinFromResult, getUnifiedFields, isBlankish, pickByContains, updateClientDetails]);

  const requiredDocIds = useMemo(() => {
    const req = ['logbook'];
    if ((financialInterest || '').toLowerCase() === 'yes') {
      req.push('finance_cert');
    }
    if ((clientDetailsSource || '').toLowerCase().includes('kra')) {
      req.push('kra_pin');
    }
    return req;
  }, [clientDetailsSource, financialInterest]);

  const hasDoc = useCallback(
    (docId) => {
      const d = uploadedDocuments?.find(x => x?.id === docId);
      if (!d) return false;

      // Required documents must actually be uploaded (not just picked).
      // This prevents passing the step without completing the S3 upload/verification flow.
      if (d.status !== 'uploaded') return false;

      // If we have extraction validation, enforce it for required docs.
      // When pipeline is disabled or extraction missing, we allow selected/uploaded.
      const extraction = d.extraction;
      if (!extraction) return true;
      if (extraction.status === 'rejected' || extraction.status === 'needs_confirmation') return false;
      return true;
    },
    [uploadedDocuments]
  );

  const handleNext = useCallback(() => {
    const missing = requiredDocIds.filter((id) => !hasDoc(id));
    if (missing.length > 0) {
      const labels = missing
        .map((id) => {
          if (id === 'logbook') return 'Logbook';
          if (id === 'finance_cert') return 'Bank/Finance Certificate';
          if (id === 'kra_pin') return 'KRA PIN Certificate';
          return id;
        })
        .join(', ');
      Alert.alert('Missing Required Documents', `Please upload: ${labels}`);
      return;
    }
    onNext();
  }, [hasDoc, onNext, requiredDocIds]);

  const documentsList = useMemo(() => {
    const base = [
      { id: 'logbook', label: 'Logbook', icon: 'book', required: true },
      { id: 'id_copy', label: 'National ID', icon: 'card', required: false },
      { id: 'kra_pin', label: 'KRA PIN Certificate', icon: 'document-text', required: (clientDetailsSource || '').toLowerCase().includes('kra') },
    ];

    if ((financialInterest || '').toLowerCase() === 'yes') {
      base.splice(1, 0, { id: 'finance_cert', label: 'Bank/Finance Certificate', icon: 'briefcase', required: true });
    }

    return base;
  }, [clientDetailsSource, financialInterest]);

  const pickAndUpload = useCallback(async (docType) => {
    try {
      const pickerRes = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });

      // Expo SDK 53+ shape: { canceled: boolean, assets: [{ uri, name, size, mimeType, ... }] }
      if (pickerRes?.canceled === true) return;

      // Legacy shape: { type: 'success'|'cancel', uri, name, size, mimeType }
      if (pickerRes?.type && pickerRes.type !== 'success') return;

      const asset = (Array.isArray(pickerRes?.assets) && pickerRes.assets.length > 0)
        ? pickerRes.assets[0]
        : pickerRes;

      const file = {
        uri: asset?.uri,
        name: asset?.name,
        size: asset?.size,
        type: asset?.mimeType || asset?.type || 'application/octet-stream',
      };

      if (!file.uri || !file.name) {
        Alert.alert('Upload Error', 'Could not read the selected file. Please try again.');
        return;
      }

      // 1) File type validation (must pass)
      const fileTypeOk = validateFileTypeForDoc(docType, file);
      if (!fileTypeOk.ok) {
        Alert.alert('Invalid File Type', fileTypeOk.message);
        return;
      }

      // 2) Readability preflight (before Textract) - size/resolution heuristics
      const preflight = await preflightReadabilityCheck(docType, file);
      if (!preflight.ok) {
        const proceed = await promptConfirm(
          'Low Document Quality',
          preflight.message || 'This document may be hard to read. You can proceed or re-upload a clearer copy.',
          'Proceed',
          'Re-upload'
        );
        if (!proceed) return;
      }

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const ext = getFileExtension(file?.name);
        console.log('[Motor3][Docs][Preflight]', {
          docType,
          name: file?.name,
          ext,
          mime: file?.type,
          size: file?.size,
        });
      }

      // Add a local record immediately
      handleDocumentUploadComplete({
        id: docType,
        label: documentsList.find(d => d.id === docType)?.label || docType,
        name: file.name,
        uri: file.uri,
        size: file.size,
        type: file.type,
        status: 'selected',
        preflight,
      });

      // Use the same Motor2 upload pipeline: presign -> PUT -> submit.
      setUploading(true);
      setPhase('preparing');
      setProgress(5);
      const backendDocType = (() => {
        if (docType === 'id_copy') return 'national_id';
        if (docType === 'logbook') return 'logbook';
        if (docType === 'kra_pin') return 'kra_pin';
        if (docType === 'finance_cert') return 'generic';
        return docType;
      })();

      const uploadRes = await S3DocumentService.uploadDocument(
        file,
        { docType: backendDocType },
        (pPhase, pct) => { setPhase(pPhase); setProgress(pct); },
      );

      if (!uploadRes?.success) {
        setUploading(false);
        Alert.alert('Upload Error', uploadRes?.error || 'Upload failed');
        return;
      }

      // If the backend says extraction is supported (logbook), poll for DONE and fetch result.
      let extracted = null;
      let jobId = uploadRes?.job_id || uploadRes?.document_id || null;
      if (uploadRes?.supports_extraction && jobId && typeof jobId === 'string' && !jobId.startsWith('skip-')) {
        setPhase('processing');
        setProgress(75);
        const poll = await HybridTextractService.pollUntilDone(jobId, { timeoutMs: 120000, intervalMs: 1500 });
        if (poll?.success) {
          extracted = poll.result;
        }
      }

      setUploading(false);

      // CRITICAL: For logbooks, extraction is MANDATORY (not optional)
      if (docType === 'logbook' && !extracted) {
        handleDocumentUploadComplete({
          id: docType,
          label: documentsList.find(d => d.id === docType)?.label || docType,
          name: file.name,
          uri: file.uri,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          jobId,
          result: null,
          extraction: {
            status: 'rejected',
            reason: 'extraction_failed',
            message: 'Failed to extract data from logbook. Please re-upload a clearer copy.',
            extractedAt: new Date().toISOString(),
          },
        });
        Alert.alert('Extraction Failed', 'Could not extract data from logbook. Please re-upload a clearer photo or scan.');
        return;
      }

      // For non-extractable docs or when no result is available, store upload-only.
      if (!extracted) {
        handleDocumentUploadComplete({
          id: docType,
          label: documentsList.find(d => d.id === docType)?.label || docType,
          name: file.name,
          uri: file.uri,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          jobId,
          result: null,
          extraction: { status: 'accepted', reason: 'upload_only', extractedAt: new Date().toISOString() },
        });
        Alert.alert('Document Uploaded', `${file.name} uploaded successfully.`);
        return;
      }

      // We have extracted fields (logbook): run client-side verification + confidence confirmation.
      {
        const extractedAtIso = new Date().toISOString();
        const expectedType = (() => {
          // Map upload slot -> expected doc type for detection
          if (docType === 'logbook') return 'logbook';
          if (docType === 'id_copy') return 'national_id';
          if (docType === 'kra_pin') return 'kra_pin';
          // Finance cert is not reliably classifiable with current heuristics
          if (docType === 'finance_cert') return 'generic';
          return 'generic';
        })();

        const detectedType = detectDocumentType(extracted);
        const confidence = getExtractionConfidence(extracted);

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[Motor3][Docs][Extracted]', {
            docType,
            expectedType,
            detectedType,
            confidence,
            hasConfidenceScores: !!(extracted?.confidenceScores || extracted?.confidence_scores),
            hasDiagnostics: !!extracted?.diagnostics,
          });
        }

        // Validate type when we have a meaningful expectation
        if (expectedType !== 'generic') {
          const v = validateDocumentType(expectedType, detectedType);
          if (!v.valid) {
            handleDocumentUploadComplete({
              id: docType,
              label: documentsList.find(d => d.id === docType)?.label || docType,
              name: file.name,
              uri: file.uri,
              size: file.size,
              type: file.type,
              status: 'uploaded',
              jobId,
              result: extracted,
              extraction: {
                status: 'rejected',
                reason: 'type_mismatch',
                expectedType,
                detectedType,
                confidence,
                message: v.message,
                extractedAt: extractedAtIso,
              },
            });
            Alert.alert('Wrong Document Uploaded', v.message);
            return;
          }
        }

        // Confidence thresholds (use 0-100 scale when available)
        // NOTE: For finance certificates we don't depend on OCR fields, so don't block on confidence.
        let extractionStatus = 'accepted';
        let extractionReason = (docType === 'finance_cert') ? 'not_required' : 'auto_accepted';

        if (docType !== 'finance_cert') {
          if (typeof confidence === 'number') {
            if (confidence >= 90) {
              extractionStatus = 'accepted';
              extractionReason = 'auto_accepted';
            } else if (confidence >= 70) {
              extractionStatus = 'needs_confirmation';
              extractionReason = 'needs_confirmation';
            } else {
              extractionStatus = 'rejected';
              extractionReason = 'low_confidence';
            }
          } else {
            // If confidence is unavailable, do not block the flow.
            extractionStatus = 'accepted';
            extractionReason = 'no_confidence_provided';
          }
        }

        if (extractionStatus === 'needs_confirmation') {
          const ok = await promptConfirm(
            'Confirm Extracted Details',
            `We extracted details from ${file.name}, but confidence is moderate${confidence != null ? ` (${Math.round(confidence)}%)` : ''}.\n\nConfirm to use this document, or re-upload a clearer copy.`,
            'Confirm & Use',
            'Re-upload'
          );
          if (!ok) {
            handleDocumentUploadComplete({
              id: docType,
              label: documentsList.find(d => d.id === docType)?.label || docType,
              name: file.name,
              uri: file.uri,
              size: file.size,
              type: file.type,
              status: 'uploaded',
              jobId,
              result: extracted,
              extraction: {
                status: 'rejected',
                reason: 'user_reupload',
                expectedType,
                detectedType,
                confidence,
                extractedAt: extractedAtIso,
              },
            });
            return;
          }

          extractionStatus = 'accepted';
          extractionReason = 'user_confirmed';
        }

        if (extractionStatus === 'rejected' && extractionReason === 'low_confidence') {
          handleDocumentUploadComplete({
            id: docType,
            label: documentsList.find(d => d.id === docType)?.label || docType,
            name: file.name,
            uri: file.uri,
            size: file.size,
            type: file.type,
            status: 'uploaded',
            jobId,
            result: extracted,
            extraction: {
              status: 'rejected',
              reason: 'low_confidence',
              expectedType,
              detectedType,
              confidence,
              message: 'Low extraction confidence. Please re-upload a clearer photo/scan.',
              extractedAt: extractedAtIso,
            },
          });
          Alert.alert('Low Document Quality', 'We could not reliably read this document. Please re-upload a clearer photo/scan.');
          return;
        }

        // For logbooks, validate registration number but don't block (show warning in Step 7 instead)
        let registrationWarning = null;
        let logbookExtractedReg = '';
        let logbookOwnerName = '';
        let logbookChassis = '';
        let logbookEngine = '';
        let logbookMake = '';
        let logbookModel = '';
        let logbookYear = '';
        if (docType === 'logbook') {
          const { canonical, raw } = getUnifiedFields(extracted);
          const extractedRegRaw =
            canonical?.registration_number ||
            canonical?.registrationNumber ||
            canonical?.vehicle_registration ||
            raw?.registration_number ||
            raw?.registrationNumber ||
            raw?.vehicle_registration ||
            (() => pickByContains(raw, ['registration', 'reg no', 'plate']))();

          // Primary: canonical/raw single-field
          let extractedReg = normalizePlate(extractedRegRaw);

          // If OCR gave junk (date/., etc), attempt to find a plate pattern within ANY extracted values
          if (!isValidKenyanPlate(extractedReg)) {
            const plateFromCanonical = findPlateInValues(canonical);
            const plateFromRaw = findPlateInValues(raw);
            extractedReg = normalizePlate(plateFromCanonical || plateFromRaw);
          }

          // If still not a valid plate, treat as missing instead of mismatch
          if (!isValidKenyanPlate(extractedReg)) {
            extractedReg = '';
          }

          logbookExtractedReg = extractedReg;

          logbookOwnerName = extractLogbookOwnerName(extracted);
          logbookChassis = extractLogbookChassis(extracted);
          logbookEngine = extractLogbookEngine(extracted);
          const mm = extractLogbookMakeModel(extracted);
          logbookMake = cleanExtractedString(mm?.make);
          logbookModel = cleanExtractedString(mm?.model);
          logbookYear = normalizeYear(
            canonical?.year_of_manufacture || canonical?.year || raw?.year_of_manufacture || raw?.year
          );

          // Auto-fill vehicle details into the Motor3 ThirdParty form data (Step 3/Review)
          // without overwriting any existing agent inputs.
          const nextVehicleUpdates = {};
          if (logbookChassis && !cleanExtractedString(formData?.chasisNumber)) nextVehicleUpdates.chasisNumber = logbookChassis.toUpperCase();
          if (logbookEngine && !cleanExtractedString(formData?.engineNumber)) nextVehicleUpdates.engineNumber = logbookEngine.toUpperCase();
          if (logbookMake && !cleanExtractedString(formData?.make)) nextVehicleUpdates.make = logbookMake;
          if (logbookModel && !cleanExtractedString(formData?.model)) nextVehicleUpdates.model = logbookModel;
          if (logbookYear && !cleanExtractedString(formData?.year)) nextVehicleUpdates.year = String(logbookYear);

          if (Object.keys(nextVehicleUpdates).length > 0) {
            updateMultipleFields?.(nextVehicleUpdates);
          }
          
          // Get user-entered registration from multiple possible sources
          const userReg = (
            formData?.registrationNumber || 
            dmvicSearchResult?.response?.registration_number || 
            dmvicSearchResult?.response?.vehicle?.registration_number ||
            ''
          );

          const userRegNorm = normalizePlate(userReg);

          // If the user-entered plate appears in extracted text, trust it over a conflicting OCR guess.
          if (userRegNorm && extractedReg && userRegNorm !== extractedReg) {
            const canonicalJoined = Object.values(canonical || {}).map((v) => String(v ?? '')).join(' ');
            const rawJoined = Object.values(raw || {}).map((v) => String(v ?? '')).join(' ');
            const joinedNorm = normalizePlate(`${canonicalJoined} ${rawJoined}`);
            if (joinedNorm.includes(userRegNorm)) {
              extractedReg = userRegNorm;
              logbookExtractedReg = extractedReg;
            }
          }
          const extractedRegCmp = normalizePlateForCompare(extractedReg);
          const userRegCmp = normalizePlateForCompare(userRegNorm);
          
          if (extractedReg && userRegNorm && extractedRegCmp !== userRegCmp) {
            registrationWarning = {
              type: 'mismatch',
              userEntered: userRegNorm,
              logbookShows: extractedReg,
              message: `Registration mismatch: You entered "${userRegNorm}" but logbook shows "${extractedReg}"`,
            };
          } else if (!extractedReg) {
            registrationWarning = {
              type: 'missing',
              message: 'Could not extract registration number from logbook',
            };
          }

          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // Debug: inspect what OCR returned for logbooks
            // eslint-disable-next-line no-console
            console.log('[Motor3][LogbookExtract] canonicalKeys:', Object.keys(canonical || {}));
            // eslint-disable-next-line no-console
            console.log('[Motor3][LogbookExtract] rawKeys:', Object.keys(raw || {}));
            // eslint-disable-next-line no-console
            console.log('[Motor3][LogbookExtract] owner_name:', canonical?.owner_name);
            // eslint-disable-next-line no-console
            console.log('[Motor3][LogbookExtract] extractedReg:', extractedReg, 'userReg:', userReg);
          }
        }

        // 3) Mandatory field checks per document type
        const mandatory = validateMandatoryFields(docType, extracted, logbookExtractedReg);
        const missingFields = mandatory?.missing || [];
        const criticalMissingFields = mandatory?.criticalMissing || [];

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[Motor3][Docs][Mandatory]', {
            docType,
            missingFields,
            criticalMissingFields,
          });
        }

        if (criticalMissingFields.length > 0) {
          handleDocumentUploadComplete({
            id: docType,
            label: documentsList.find(d => d.id === docType)?.label || docType,
            name: file.name,
            uri: file.uri,
            size: file.size,
            type: file.type,
            status: 'uploaded',
            jobId,
            result: extracted,
            extraction: {
              status: 'rejected',
              reason: 'missing_mandatory_fields',
              expectedType,
              detectedType,
              confidence,
              missingFields,
              criticalMissingFields,
              extractedAt: extractedAtIso,
              message: `Missing mandatory fields: ${criticalMissingFields.join(', ')}`,
              registrationWarning,
            },
          });
          Alert.alert(
            'Missing Mandatory Fields',
            `We could not reliably extract: ${criticalMissingFields.join(', ')}.\n\nPlease re-upload a clearer copy.`
          );
          return;
        }

        // If non-critical mandatory fields are missing, require human confirmation
        if (missingFields.length > 0) {
          const ok = await promptConfirm(
            'Confirm Extracted Details',
            `Some required fields were not detected: ${missingFields.join(', ')}.\n\nConfirm to proceed and manually verify/correct in Review, or re-upload a clearer copy.`,
            'Confirm & Proceed',
            'Re-upload'
          );
          if (!ok) {
            handleDocumentUploadComplete({
              id: docType,
              label: documentsList.find(d => d.id === docType)?.label || docType,
              name: file.name,
              uri: file.uri,
              size: file.size,
              type: file.type,
              status: 'uploaded',
              jobId,
              result: extracted,
              extraction: {
                status: 'rejected',
                reason: 'user_reupload_missing_fields',
                expectedType,
                detectedType,
                confidence,
                missingFields,
                extractedAt: extractedAtIso,
                registrationWarning,
              },
            });
            return;
          }
          extractionReason = 'user_confirmed_missing_fields';
        }

        // 4) Reconciliation (human-in-loop) - no new UI, just confirm prompts
        const conflicts = [];
        const userReg = normalizePlate(formData?.registrationNumber || formData?.registration_number || '');
        const userRegCmp = normalizePlateForCompare(userReg);
        const dmvicVehicle = getDmvicVehicleNormalized();

        // Registration: user entry vs logbook
        if (docType === 'logbook' && logbookExtractedReg && userReg) {
          const logReg = normalizePlate(logbookExtractedReg);
          const logRegCmp = normalizePlateForCompare(logReg);
          if (logReg && userReg && logRegCmp !== userRegCmp) {
            conflicts.push({
              code: 'REGISTRATION_MISMATCH',
              severity: 'high',
              message: `Logbook plate (${logReg}) does not match entered plate (${userReg}).`,
            });
          }
        }

        // DMVIC vs Logbook vehicle checks (only when we have both)
        if (docType === 'logbook' && dmvicVehicle) {
          const dMake = cleanExtractedString(dmvicVehicle.make);
          const dModel = cleanExtractedString(dmvicVehicle.model);
          const dYear = cleanExtractedString(dmvicVehicle.year);
          const dChassis = cleanExtractedString(dmvicVehicle.chassis);

          if (logbookMake && dMake && !areSimilar(logbookMake, dMake)) {
            conflicts.push({ code: 'DMVIC_MAKE_MISMATCH', severity: 'medium', message: `DMVIC make (${dMake}) differs from logbook make (${logbookMake}).` });
          }
          if (logbookModel && dModel && !areSimilar(logbookModel, dModel)) {
            conflicts.push({ code: 'DMVIC_MODEL_MISMATCH', severity: 'medium', message: `DMVIC model (${dModel}) differs from logbook model (${logbookModel}).` });
          }
          if (logbookYear && dYear && String(logbookYear) !== String(dYear)) {
            conflicts.push({ code: 'DMVIC_YEAR_MISMATCH', severity: 'medium', message: `DMVIC year (${dYear}) differs from logbook year (${logbookYear}).` });
          }
          if (logbookChassis && dChassis && !areSimilar(logbookChassis, dChassis)) {
            conflicts.push({ code: 'DMVIC_CHASSIS_MISMATCH', severity: 'high', message: `DMVIC chassis differs from logbook chassis.` });
          }
        }

        // Logbook owner vs KRA PIN name (if KRA doc already uploaded)
        if (docType === 'logbook' && logbookOwnerName) {
          const kraDoc = (uploadedDocuments || []).find((d) => d?.id === 'kra_pin' && d?.extraction?.status === 'accepted');
          const kraAuditName = kraDoc?.extraction?.fieldAudit?.legal_name?.value;
          if (kraAuditName && !areSimilar(kraAuditName, logbookOwnerName)) {
            conflicts.push({ code: 'OWNER_NAME_MISMATCH', severity: 'high', message: `KRA name differs from logbook owner name.` });
          }
        }

        if (docType === 'kra_pin') {
          const kraAuditName = (() => {
            const { canonical, raw } = getUnifiedFields(extracted);
            const fields = { ...(raw || {}), ...(canonical || {}) };
            return cleanExtractedString(fields.owner_name || fields.ownerName || fields.full_name || fields.name || canonical?.owner_name);
          })();
          const logbookDoc = (uploadedDocuments || []).find((d) => d?.id === 'logbook' && d?.extraction?.status === 'accepted');
          const logbookOwner = logbookDoc?.extraction?.fieldAudit?.owner_name?.value;
          if (kraAuditName && logbookOwner && !areSimilar(kraAuditName, logbookOwner)) {
            conflicts.push({ code: 'OWNER_NAME_MISMATCH', severity: 'high', message: `KRA name differs from logbook owner name.` });
          }
        }

        let reconciliationDecision = 'no_conflicts';
        if (conflicts.length > 0) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[Motor3][Docs][Reconcile]', { docType, conflicts });
          }
          const summary = conflicts.map((c) => `• ${c.message}`).join('\n');
          const ok = await promptConfirm(
            'Confirm Conflicting Details',
            `We detected differences between sources:\n\n${summary}\n\nConfirm to proceed (you can correct later), or re-upload/correct documents.`,
            'Confirm & Proceed',
            'Re-upload'
          );
          if (!ok) {
            handleDocumentUploadComplete({
              id: docType,
              label: documentsList.find(d => d.id === docType)?.label || docType,
              name: file.name,
              uri: file.uri,
              size: file.size,
              type: file.type,
              status: 'uploaded',
              jobId,
              result: extracted,
              extraction: {
                status: 'rejected',
                reason: 'reconciliation_conflict',
                expectedType,
                detectedType,
                confidence,
                extractedAt: extractedAtIso,
                registrationWarning,
                reconciliation: { conflicts, decision: 'user_reupload' },
                missingFields: missingFields || [],
                criticalMissingFields: criticalMissingFields || [],
              },
            });
            return;
          }
          reconciliationDecision = 'user_confirmed';
        }

        const fieldAudit = buildFieldAudit(docType, extracted, extractedAtIso, 'accepted', reconciliationDecision);

        // Upsert with processed info
        handleDocumentUploadComplete({
          id: docType,
          label: documentsList.find(d => d.id === docType)?.label || docType,
          name: file.name,
          uri: file.uri,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          jobId,
          result: extracted,
          extraction: {
            status: 'accepted',
            reason: extractionReason,
            expectedType,
            detectedType,
            confidence,
            registrationWarning, // Store warning to display in Step 7
            extractedAt: extractedAtIso,
            missingFields: missingFields || [],
            criticalMissingFields: criticalMissingFields || [],
            reconciliation: {
              conflicts: conflicts || [],
              decision: reconciliationDecision,
              dmvicPresent: !!dmvicVehicle,
            },
            fieldAudit,
          },
        });

        // Auto-fill client details from extracted fields (only fills missing fields).
        mergeExtractedIntoClientDetails(extracted, docType);
        Alert.alert('Document Uploaded', `${file.name} uploaded successfully.`);
      }
    } catch (e) {
      setUploading(false);
      Alert.alert('Upload Error', e.message || 'Failed to upload document');
    }
  }, [documentsList, handleDocumentUploadComplete, mergeExtractedIntoClientDetails]);

  // Removed DMVIC check per request

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <View style={styles.contentWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Simplified: Only horizontal documents uploader */}
        <Text style={styles.sectionTitle}>Upload Documents</Text>
        <View style={styles.documentsList}>
          {documentsList.map((doc) => {
            const uploaded = hasDoc(doc.id);
            return (
              <TouchableOpacity key={doc.id} style={[styles.documentRow, uploaded && styles.documentRowUploaded]} onPress={() => pickAndUpload(doc.id)}>
                <View style={styles.documentIconWrapper}>
                  <Ionicons name={doc.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentLabel}>
                    {doc.label}{doc.required ? ' *' : ''}
                  </Text>
                  {uploaded && <Text style={styles.documentStatus}>Uploaded</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {uploading && (
          <View style={styles.uploadStatus}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadStatusText}>{phase}… {Math.max(0, Math.min(100, Math.round(progress)))}%</Text>
          </View>
        )}

      </ScrollView>
      </View>
      <StepNavigation currentStep={currentStep} totalSteps={totalSteps} onNext={handleNext} onBack={onBack} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    flex: 1,
  },
  scrollContent: {
    paddingVertical: moderateScale(16),
  },
  sectionTitle: {
    // Align with Motor3/Step2 typography
    fontSize: Typography.sizes.h3,
    fontFamily: Typography.families.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  documentsCarousel: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  documentsList: {
    paddingVertical: moderateScale(4),
    gap: moderateScale(10),
  },
  documentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(110),
    marginRight: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  documentRowUploaded: {
    borderColor: '#22C55E',
  },
  documentCardUploaded: {
    borderColor: '#22C55E',
  },
  documentIconWrapper: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentInfo: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  documentLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
    textAlign: 'left',
    fontFamily: Typography.families.medium,
  },
  documentStatus: {
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.caption,
    color: '#22C55E',
    fontFamily: Typography.families.medium,
  },
  uploadStatus: {
    marginTop: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    justifyContent: 'center',
  },
  uploadStatusText: {
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
    fontFamily: Typography.families.medium,
  },
});

export default Step5_DocumentUpload;
