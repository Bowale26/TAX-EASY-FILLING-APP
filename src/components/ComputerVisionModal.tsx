import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  Scan,
  ShieldCheck,
  Building,
  DollarSign,
  Maximize2,
  AlertTriangle,
  FileCheck,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Wand2,
  Layers,
  Zap,
  RotateCcw,
  Sun,
  Lightbulb,
  Check,
  Smartphone,
  HelpCircle,
  FlipHorizontal,
  Info,
  Crop,
  RotateCw,
  SlidersHorizontal,
  EyeOff,
  Grid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  processAutoCropAndDeskew,
  rotateAndCropImage,
  DeskewCropResult,
} from '../utils/imageDeskewCrop';
import { ComputerVisionResult, T4Slip, SlipType, ExtractedSlipResultPayload, OtherIncomeSlip } from '../types/tax';
import { SAMPLE_DOCUMENTS } from '../services/sampleData';
import {
  ALL_19_TAX_SLIPS,
  TaxSlipDefinition,
  getSlipMetadataByCode,
  SlipCategory,
  getCategoryForSlip,
  autoDetectSlipFromTextOrName,
} from '../services/taxSlipsDirectory';
import { validateT4Slip } from '../utils/t4ValidationUtils';

interface ComputerVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedT4: (t4: T4Slip) => void;
  onApplyExtractedSlip?: (payload: ExtractedSlipResultPayload) => void;
  initialSlipType?: SlipType;
  initialTab?: 'samples' | 'upload' | 'camera';
  language: 'en' | 'fr';
}

export interface AutoCategorizeResult {
  detectedSlipType: SlipType;
  category: SlipCategory;
  confidence: number;
  slipTitle: string;
  reason: string;
}

export const ComputerVisionModal: React.FC<ComputerVisionModalProps> = ({
  isOpen,
  onClose,
  onApplyExtractedT4,
  onApplyExtractedSlip,
  initialSlipType = 'T4',
  initialTab = 'samples',
  language,
}) => {
  const isFrench = language === 'fr';

  const [activeTab, setActiveTab] = useState<'samples' | 'upload' | 'camera'>(initialTab);
  const [selectedSlipCategory, setSelectedSlipCategory] = useState<SlipCategory | 'all'>('all');
  const [activeSlipCode, setActiveSlipCode] = useState<SlipType>(initialSlipType);
  const [fileFormat, setFileFormat] = useState<'pdf' | 'image'>('image');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Camera settings
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [showGuidelinesDetails, setShowGuidelinesDetails] = useState<boolean>(true);
  const [captureFlash, setCaptureFlash] = useState<boolean>(false);
  const [autoPopulatedSuccess, setAutoPopulatedSuccess] = useState<boolean>(false);

  // Auto-categorization states
  const [isAutoCategorizing, setIsAutoCategorizing] = useState<boolean>(false);
  const [autoCategorizedResult, setAutoCategorizedResult] = useState<AutoCategorizeResult | null>(null);
  const [scanExecuted, setScanExecuted] = useState<boolean>(true); // initially true for sample, set false when new doc is presented
  const [pendingDocumentData, setPendingDocumentData] = useState<string | null>(null);

  // Find sample for active slip
  const activeSlipDef = useMemo<TaxSlipDefinition>(() => {
    return getSlipMetadataByCode(activeSlipCode) || ALL_19_TAX_SLIPS[0];
  }, [activeSlipCode]);

  const [selectedSampleId, setSelectedSampleId] = useState<string>(activeSlipDef.sampleDocument.id);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ComputerVisionResult | null>(
    activeSlipDef.sampleDocument.extractedResult
  );
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(
    activeSlipDef.sampleDocument.previewUrl
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [editableBoxes, setEditableBoxes] = useState<Record<string, number | string>>({
    ...activeSlipDef.sampleDocument.extractedResult.extractedBoxes,
  });
  const [employerName, setEmployerName] = useState<string>(
    activeSlipDef.sampleDocument.extractedResult.issuerName
  );

  // Auto-Crop & Deskew Engine States
  const [enableAutoDeskewCrop, setEnableAutoDeskewCrop] = useState<boolean>(true);
  const [isDeskewing, setIsDeskewing] = useState<boolean>(false);
  const [deskewInfo, setDeskewInfo] = useState<DeskewCropResult | null>(null);
  const [originalRawImage, setOriginalRawImage] = useState<string | null>(null);
  const [alignedImage, setAlignedImage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'aligned' | 'original'>('aligned');
  const [showManualAdjustment, setShowManualAdjustment] = useState<boolean>(false);
  const [manualSkewAngle, setManualSkewAngle] = useState<number>(0);
  const [showAlignmentGrid, setShowAlignmentGrid] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync when initialSlipType changes or modal opens
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialSlipType) {
      setActiveSlipCode(initialSlipType);
      const def = getSlipMetadataByCode(initialSlipType) || ALL_19_TAX_SLIPS[0];
      setSelectedSampleId(def.sampleDocument.id);
      setAnalysisResult(def.sampleDocument.extractedResult);
      setEditableBoxes({ ...def.sampleDocument.extractedResult.extractedBoxes });
      setEmployerName(def.sampleDocument.extractedResult.issuerName);
      setCurrentImageSrc(def.sampleDocument.previewUrl);
      setUploadedFileName(def.sampleDocument.fileName);
      setFileFormat(def.sampleDocument.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
      setPendingDocumentData(null);
      setAutoCategorizedResult(null);
      setScanExecuted(true);
    }
  }, [initialSlipType, initialTab, isOpen]);

  // When activeSlipCode changes manually, load its sample
  const handleSelectSlip = (code: SlipType) => {
    setActiveSlipCode(code);
    const def = getSlipMetadataByCode(code) || ALL_19_TAX_SLIPS[0];
    setSelectedSampleId(def.sampleDocument.id);
    setAnalysisResult(def.sampleDocument.extractedResult);
    setEditableBoxes({ ...def.sampleDocument.extractedResult.extractedBoxes });
    setEmployerName(def.sampleDocument.extractedResult.issuerName);
    setCurrentImageSrc(def.sampleDocument.previewUrl);
    setUploadedFileName(def.sampleDocument.fileName);
    setFileFormat(def.sampleDocument.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
    setScanExecuted(true);
  };

  /**
   * Auto-Categorization Engine:
   * Uses vision recognition to automatically detect the type of slip (T4, T5, etc.) presented,
   * pre-selecting the category before scan execution.
   */
  const runAutoCategorization = async (
    imageData: string,
    fileName?: string,
    triggerFullScanAfter: boolean = false
  ) => {
    setIsAutoCategorizing(true);
    try {
      const response = await fetch('/api/vision/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData.startsWith('data:') ? imageData : undefined,
          mimeType: fileFormat === 'pdf' ? 'application/pdf' : 'image/jpeg',
          fileName: fileName || uploadedFileName,
        }),
      });

      let catResult: AutoCategorizeResult;
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          catResult = data.result;
        } else {
          catResult = autoDetectSlipFromTextOrName(fileName || uploadedFileName || activeSlipCode);
        }
      } else {
        catResult = autoDetectSlipFromTextOrName(fileName || uploadedFileName || activeSlipCode);
      }

      setAutoCategorizedResult(catResult);

      // PRE-SELECT THE CATEGORY BEFORE SCAN EXECUTION
      setSelectedSlipCategory(catResult.category);

      // PRE-SELECT THE DETECTED SLIP
      setActiveSlipCode(catResult.detectedSlipType);

      // Initialize preview context
      const def = getSlipMetadataByCode(catResult.detectedSlipType) || ALL_19_TAX_SLIPS[0];
      setSelectedSampleId(def.sampleDocument.id);
      setEditableBoxes({ ...def.sampleDocument.extractedResult.extractedBoxes });
      setEmployerName(def.sampleDocument.extractedResult.issuerName);

      if (triggerFullScanAfter) {
        await runServerVisionAnalysis(imageData, catResult.detectedSlipType);
        setScanExecuted(true);
      } else {
        setScanExecuted(false);
      }
    } catch (err) {
      console.error('Auto-categorization error:', err);
      const fallback = autoDetectSlipFromTextOrName(fileName || uploadedFileName || activeSlipCode);
      setAutoCategorizedResult(fallback);
      setSelectedSlipCategory(fallback.category);
      setActiveSlipCode(fallback.detectedSlipType);
      setScanExecuted(false);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const executeFullScan = async () => {
    const targetData = pendingDocumentData || currentImageSrc;
    if (targetData) {
      await runServerVisionAnalysis(targetData, activeSlipCode);
      setScanExecuted(true);
    }
  };

  // Validate extracted T4 against CRA slip layout constraints
  const validationResult = useMemo(() => {
    if (activeSlipCode === 'T4') {
      return validateT4Slip(
        {
          id: 'cv-extracted',
          employerName,
          box14_employmentIncome: Number(editableBoxes['14']) || 0,
          box16_cppContributions: Number(editableBoxes['16']) || 0,
          box18_eiPremiums: Number(editableBoxes['18']) || 0,
          box20_rppContributions: Number(editableBoxes['20']) || 0,
          box22_incomeTaxDeducted: Number(editableBoxes['22']) || 0,
          box24_eiInsurableEarnings: Number(editableBoxes['24']) || 0,
          box26_cppPensionableEarnings: Number(editableBoxes['26']) || 0,
          box44_unionDues: Number(editableBoxes['44']) || 0,
          box52_pensionAdjustment: Number(editableBoxes['52']) || 0,
        },
        undefined,
        language
      );
    }

    // For other slips: verify non-negative numeric boxes
    const invalidBoxes = Object.entries(editableBoxes).filter(
      ([, val]) => typeof val === 'number' && val < 0
    );
    const isValid = invalidBoxes.length === 0 && employerName.trim().length > 0;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            {
              field: 'general',
              box: activeSlipCode,
              messageEn: 'Box values must be positive and payer/issuer name cannot be blank.',
              messageFr: 'Les montants des cases doivent être positifs et le nom de l’émetteur est requis.',
            },
          ],
      warnings: [],
      hasWarnings: false,
    };
  }, [activeSlipCode, employerName, editableBoxes, language]);

  // Clean up camera on unmount, tab change, or modal close
  useEffect(() => {
    if ((!isOpen || activeTab !== 'camera') && isCameraActive) {
      stopCamera();
    }
  }, [activeTab, isOpen, isCameraActive]);

  // If opened directly with camera tab, start camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !isCameraActive) {
      startCameraWithFacing(cameraFacing);
    }
  }, [isOpen, activeTab]);

  const startCameraWithFacing = async (facing: 'environment' | 'user') => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.info('Camera permission denied or device error:', err);
      setIsCameraActive(false);
      setCameraError(
        isFrench
          ? 'Caméra inaccessible ou autorisation refusée. Vous pouvez utiliser une image de démonstration ou téléverser une photo.'
          : 'Camera inaccessible or permission denied. You can select sample Canadian slips or upload a photo instead.'
      );
    }
  };

  const startCamera = async () => {
    await startCameraWithFacing(cameraFacing);
  };

  const toggleCameraFacing = async () => {
    const nextMode = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextMode);
    stopCamera();
    setTimeout(() => {
      startCameraWithFacing(nextMode);
    }, 150);
  };

  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track as any).getCapabilities?.();
          if (capabilities && 'torch' in capabilities) {
            const nextTorch = !isTorchOn;
            await (track as any).applyConstraints({ advanced: [{ torch: nextTorch }] });
            setIsTorchOn(nextTorch);
            return;
          }
        } catch (e) {
          console.warn('Torch constraint failed:', e);
        }
      }
    }
    setIsTorchOn((prev) => !prev);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Trigger visual flash feedback
        setCaptureFlash(true);
        setTimeout(() => setCaptureFlash(false), 220);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setOriginalRawImage(rawDataUrl);
        setManualSkewAngle(0);
        stopCamera();

        let finalImageToScan = rawDataUrl;

        // Perform browser-based auto-crop and deskew to align tax slip before AI vision
        if (enableAutoDeskewCrop) {
          setIsDeskewing(true);
          try {
            const deskewRes = await processAutoCropAndDeskew(rawDataUrl, {
              autoCrop: true,
              autoDeskew: true,
              enhanceContrast: true,
            });
            setDeskewInfo(deskewRes);
            setAlignedImage(deskewRes.processedDataUrl);
            finalImageToScan = deskewRes.processedDataUrl;
            setPreviewMode('aligned');
          } catch (err) {
            console.warn('Camera deskew failed, falling back to raw capture:', err);
          } finally {
            setIsDeskewing(false);
          }
        }

        setCurrentImageSrc(finalImageToScan);
        setFileFormat('image');
        const snapName = `${activeSlipCode}_Camera_Scan_${Date.now().toString().slice(-4)}.jpg`;
        setUploadedFileName(snapName);
        setPendingDocumentData(finalImageToScan);

        // Run auto-categorization and OCR optical extraction on the properly aligned slip
        await runAutoCategorization(finalImageToScan, snapName);
        await runServerVisionAnalysis(finalImageToScan, activeSlipCode);
        setScanExecuted(true);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdfFile = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      setFileFormat(isPdfFile ? 'pdf' : 'image');
      setUploadedFileName(file.name);

      const reader = new FileReader();
      reader.onload = async () => {
        const rawResult = reader.result as string;
        setOriginalRawImage(rawResult);
        setPendingDocumentData(rawResult);
        setManualSkewAngle(0);

        let finalImageToProcess = rawResult;

        // Execute browser-based auto-crop & deskew on uploaded image files before sending to AI
        if (!isPdfFile && enableAutoDeskewCrop) {
          setIsDeskewing(true);
          try {
            const deskewRes = await processAutoCropAndDeskew(rawResult, {
              autoCrop: true,
              autoDeskew: true,
              enhanceContrast: true,
            });
            setDeskewInfo(deskewRes);
            setAlignedImage(deskewRes.processedDataUrl);
            finalImageToProcess = deskewRes.processedDataUrl;
            setPreviewMode('aligned');
          } catch (err) {
            console.warn('Auto-crop/deskew error on upload:', err);
          } finally {
            setIsDeskewing(false);
          }
        }

        if (!isPdfFile) {
          setCurrentImageSrc(finalImageToProcess);
        }

        // Auto-categorize uploaded document and pre-select category with aligned image
        await runAutoCategorization(finalImageToProcess, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Explicitly triggers the browser-based Auto-Crop and Deskew engine
   * on the current slip image (works on uploaded, captured, or sample slips).
   */
  const handleTriggerAutoCropAndDeskew = async (customAngle?: number) => {
    const targetSource = originalRawImage || currentImageSrc;
    if (!targetSource || fileFormat === 'pdf') return;

    setIsDeskewing(true);
    try {
      const deskewRes = await processAutoCropAndDeskew(targetSource, {
        autoCrop: true,
        autoDeskew: true,
        enhanceContrast: true,
        manualAngle: customAngle !== undefined ? customAngle : undefined,
      });

      if (!originalRawImage) {
        setOriginalRawImage(targetSource);
      }

      setDeskewInfo(deskewRes);
      setAlignedImage(deskewRes.processedDataUrl);
      setCurrentImageSrc(deskewRes.processedDataUrl);
      setPendingDocumentData(deskewRes.processedDataUrl);
      setPreviewMode('aligned');

      // Re-run vision analysis with the aligned slip if scan was executed
      if (scanExecuted) {
        await runServerVisionAnalysis(deskewRes.processedDataUrl, activeSlipCode);
      }
    } catch (err) {
      console.error('Explicit auto-crop deskew error:', err);
    } finally {
      setIsDeskewing(false);
    }
  };

  /**
   * Toggle between the deskewed/cropped image and the raw original image
   */
  const handleTogglePreviewMode = () => {
    if (!originalRawImage && !alignedImage) return;
    const nextMode = previewMode === 'aligned' ? 'original' : 'aligned';
    setPreviewMode(nextMode);
    if (nextMode === 'original' && originalRawImage) {
      setCurrentImageSrc(originalRawImage);
    } else if (nextMode === 'aligned' && alignedImage) {
      setCurrentImageSrc(alignedImage);
    }
  };

  /**
   * Fine-tune angle manually using interactive slider (-15° to +15°)
   */
  const handleManualAngleSlider = async (newAngle: number) => {
    setManualSkewAngle(newAngle);
    const baseSource = originalRawImage || currentImageSrc;
    if (!baseSource || fileFormat === 'pdf') return;

    try {
      const rotated = await rotateAndCropImage(baseSource, newAngle, 1);
      setCurrentImageSrc(rotated);
      setPendingDocumentData(rotated);
      setAlignedImage(rotated);
      setPreviewMode('aligned');
    } catch (err) {
      console.error('Manual rotation error:', err);
    }
  };

  /**
   * Rotate 90 degrees clockwise
   */
  const handleRotate90Clockwise = async () => {
    const baseSource = currentImageSrc;
    if (!baseSource || fileFormat === 'pdf') return;
    try {
      const rotated = await rotateAndCropImage(baseSource, 90, 0);
      setCurrentImageSrc(rotated);
      setPendingDocumentData(rotated);
      setAlignedImage(rotated);
    } catch (err) {
      console.error('90 deg rotate error:', err);
    }
  };

  const runServerVisionAnalysis = async (imageBase64: string, targetSlipCode?: SlipType) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: fileFormat === 'pdf' ? 'application/pdf' : 'image/jpeg',
          documentHint: targetSlipCode || activeSlipCode,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setEditableBoxes(data.result.extractedBoxes || {});
        setEmployerName(data.result.issuerName || activeSlipDef.sampleDocument.extractedResult.issuerName);
      }
    } catch (err) {
      console.error('Vision analysis call failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (!analysisResult || !validationResult.isValid) return;

    const finalFileName = uploadedFileName || `${activeSlipCode}_CRA_Tax_Slip_${Date.now().toString().slice(-4)}.${fileFormat === 'pdf' ? 'pdf' : 'jpg'}`;

    // 1. Dispatch legacy T4 handler if slip is T4
    const newT4: T4Slip = {
      id: `t4-cv-${Date.now()}`,
      employerName: employerName || 'Verified Canadian Employer (AI Optical Scan)',
      box14_employmentIncome: Number(editableBoxes['14']) || 0,
      box16_cppContributions: Number(editableBoxes['16']) || 0,
      box18_eiPremiums: Number(editableBoxes['18']) || 0,
      box20_rppContributions: Number(editableBoxes['20']) || 0,
      box22_incomeTaxDeducted: Number(editableBoxes['22']) || 0,
      box24_eiInsurableEarnings: Number(editableBoxes['24']) || 0,
      box26_cppPensionableEarnings: Number(editableBoxes['26']) || 0,
      box44_unionDues: Number(editableBoxes['44']) || 0,
      box52_pensionAdjustment: Number(editableBoxes['52']) || 0,
      verifiedByUser: true,
    };

    if (activeSlipCode === 'T4') {
      onApplyExtractedT4(newT4);
    }

    // 2. Dispatch generalized ExtractedSlipResultPayload for all 19 slips
    if (onApplyExtractedSlip) {
      const ocrConf = Math.round((analysisResult.confidenceScore || 0.98) * 100);
      const numericalAmounts: Record<string, number> = {};
      Object.entries(editableBoxes).forEach(([k, v]) => {
        numericalAmounts[k] = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0;
      });

      const newOther: OtherIncomeSlip | undefined = activeSlipCode !== 'T4' ? {
        id: `slip-${activeSlipCode.toLowerCase()}-${Date.now()}`,
        type: activeSlipCode,
        payerName: employerName || 'Verified Canadian Payer',
        description: `${activeSlipCode} Income Slip`,
        amounts: numericalAmounts,
        verifiedByUser: true,
        sourceDocumentId: `doc-${Date.now()}`,
        taxYear: analysisResult.taxYear || 2025,
      } : undefined;

      const payload: ExtractedSlipResultPayload = {
        slipType: activeSlipCode,
        issuerName: employerName || 'Verified Canadian Payer',
        taxYear: analysisResult.taxYear || 2025,
        extractedBoxes: editableBoxes,
        fileType: fileFormat,
        fileName: finalFileName,
        previewUrl: currentImageSrc,
        ocrConfidence: ocrConf,
        rawSummary: analysisResult.rawSummary,
        t4Slip: activeSlipCode === 'T4' ? newT4 : undefined,
        otherSlip: newOther,
        documentAssociation: {
          id: `doc_scan_${activeSlipCode.toLowerCase()}_${Date.now()}`,
          documentCode: activeSlipCode,
          documentName: `${activeSlipCode} Slip`,
          fileName: finalFileName,
          fileType: fileFormat,
          fileSize: `${Math.max(140, Math.round((currentImageSrc.length * 0.75) / 1024))} KB`,
          scannedAt: new Date().toISOString(),
          status: 'verified',
          ocrConfidence: ocrConf,
          previewUrl: currentImageSrc,
          isValidated: validationResult.isValid,
        },
      };
      onApplyExtractedSlip(payload);
    }

    setAutoPopulatedSuccess(true);
    setTimeout(() => {
      setAutoPopulatedSuccess(false);
      onClose();
    }, 400);
  };

  const filteredSlipsList = useMemo(() => {
    if (selectedSlipCategory === 'all') return ALL_19_TAX_SLIPS;
    return ALL_19_TAX_SLIPS.filter((s) => s.category === selectedSlipCategory);
  }, [selectedSlipCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="cv-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header - Deep Green & Deep Blue */}
        <div className="bg-linear-to-r from-[#064e3b] via-[#0b294c] to-[#0d2346] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Scan className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {isFrench ? 'Vision par Ordinateur IA' : 'AI Computer Vision Engine'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  19 CRA Tax Slips Supported
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {isFrench
                  ? 'Reconnaissance & Auto-Catégorisation des Feuillets'
                  : 'Tax Slip Auto-Categorization & Optical Extraction'}
              </h2>
            </div>
          </div>

          <button
            id="cv-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slip Type Selection & Auto-Categorization Bar */}
        <div className="bg-slate-900 text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <div className="flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">
                {isFrench ? 'Feuillet actif :' : 'Active Slip:'}
              </span>
            </div>
            <select
              id="cv-slip-type-selector"
              value={activeSlipCode}
              onChange={(e) => handleSelectSlip(e.target.value as SlipType)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <optgroup label="T4 Slips (8)">
                <option value="T4">T4 — Remuneration Paid</option>
                <option value="T4A">T4A — Pension, Retirement & Other</option>
                <option value="T4A(OAS)">T4A(OAS) — Old Age Security</option>
                <option value="T4A(P)">T4A(P) — CPP Retirement Benefits</option>
                <option value="T4E">T4E — Employment Insurance</option>
                <option value="T4FHSA">T4FHSA — First Home Savings Account</option>
                <option value="T4RIF">T4RIF — RIF Income for Individuals</option>
                <option value="T4RSP">T4RSP — RRSP Income</option>
              </optgroup>
              <optgroup label="T5 Slips (5)">
                <option value="T5">T5 — Investment Income</option>
                <option value="T5007">T5007 — Statement of Benefits (WSIB)</option>
                <option value="T5008">T5008 — Securities Transactions</option>
                <option value="T5013">T5013 — Partnership Income</option>
                <option value="T5018">T5018 — Statement of Contract</option>
              </optgroup>
              <optgroup label="More Tax Slips (6)">
                <option value="T3">T3 — Trust Allocations & Mutual Funds</option>
                <option value="T2202">T2202 — Tuition Certificate</option>
                <option value="T1204">T1204 — Govt Contract Payments</option>
                <option value="RC62">RC62 — Child Care Benefit</option>
                <option value="RRSP">RRSP — Contribution Receipt</option>
                <option value="PRPP">PRPP — Contribution Receipt</option>
              </optgroup>
            </select>

            {/* Quick Auto-Categorize Button */}
            <button
              type="button"
              id="cv-quick-autodetect-btn"
              disabled={isAutoCategorizing}
              onClick={() => runAutoCategorization(pendingDocumentData || currentImageSrc, uploadedFileName || activeSlipCode)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {isAutoCategorizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>{isFrench ? 'Auto-catégoriser IA' : 'Auto-Categorize with AI'}</span>
            </button>
          </div>

          {/* File Format Indicator (PDF vs Image) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">
              {isFrench ? 'Format du fichier :' : 'File format:'}
            </span>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFileFormat('pdf')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                  fileFormat === 'pdf'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-3 h-3 text-rose-200" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setFileFormat('image')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                  fileFormat === 'image'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3 text-emerald-200" />
                <span>Image / Photo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              id="cv-tab-samples"
              onClick={() => setActiveTab('samples')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-white text-[#064e3b] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Feuillets types canadiens (19)' : 'Canadian Sample Slips (19)'}</span>
            </button>

            <button
              id="cv-tab-upload"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-[#064e3b] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Téléverser PDF / Image' : 'Upload PDF / Image'}</span>
            </button>

            <button
              id="cv-tab-camera"
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white text-[#064e3b] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Caméra mobile' : 'Device Camera'}</span>
            </button>
          </div>

          <div className="text-xs font-medium text-slate-500 hidden sm:block">
            {isFrench ? 'Auto-catégorisation vision certifiée ARC' : 'CRA-Certified Slip Auto-Categorization'}
          </div>
        </div>

        {/* Vision Auto-Categorization Card / Status Banner */}
        <div className="px-6 pt-4">
          {isAutoCategorizing ? (
            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-emerald-500/40 flex items-center space-x-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  {isFrench ? 'Reconnaissance Visuelle & Auto-Catégorisation en Cours...' : 'Vision Recognition & Auto-Categorization in Progress...'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isFrench
                    ? 'Analyse des en-têtes officiels de l’ARC, des cases numérotées et de la disposition du feuillet...'
                    : 'Inspecting official CRA slip headers, box patterns, and document geometry to pre-select category...'}
                </p>
              </div>
            </div>
          ) : autoCategorizedResult ? (
            <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950 text-white rounded-xl p-4 border border-emerald-500/50 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        {isFrench ? 'Auto-Catégorisation Réussie' : 'Vision Auto-Categorization Match'}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        {Math.round(autoCategorizedResult.confidence * 100)}% {isFrench ? 'Concordance' : 'Confidence'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5 flex items-center space-x-2">
                      <span>{autoCategorizedResult.slipTitle}</span>
                      <span className="text-emerald-400 font-mono">({autoCategorizedResult.detectedSlipType})</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      <span className="font-semibold text-emerald-300">
                        {isFrench ? 'Catégorie pré-sélectionnée :' : 'Pre-Selected Category:'}
                      </span>{' '}
                      <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded font-bold text-[11px]">
                        {autoCategorizedResult.category === 't4_slips'
                          ? isFrench ? 'Feuillets T4 (8)' : 'T4 Slips (8)'
                          : autoCategorizedResult.category === 't5_slips'
                          ? isFrench ? 'Feuillets T5 (5)' : 'T5 Slips (5)'
                          : isFrench ? 'Autres Feuillets (6)' : 'More Tax Slips (6)'}
                      </span>{' '}
                      • <span className="italic text-slate-300">{autoCategorizedResult.reason}</span>
                    </p>
                  </div>
                </div>

                {!scanExecuted ? (
                  <button
                    type="button"
                    id="cv-execute-scan-btn"
                    onClick={executeFullScan}
                    disabled={isAnalyzing}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shrink-0 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isFrench ? 'Extraction en cours...' : 'Extracting Boxes...'}</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span>
                          {isFrench
                            ? `Numériser & Extraire ${activeSlipCode}`
                            : `Execute Scan & Extract (${activeSlipCode})`}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isFrench ? 'Numérisation exécutée' : 'Scan Executed'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={executeFullScan}
                      className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                    >
                      {isFrench ? 'Re-numériser' : 'Re-scan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Content Area: Split View (Canvas on Left, Extracted Fields on Right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Analysis Canvas with Bounding Boxes */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {activeTab === 'samples' && (
              <div className="space-y-2">
                {/* Category Pills with Pre-selected indicator */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSlipCategory('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedSlipCategory === 'all'
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    All (19)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlipCategory('t4_slips')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                      selectedSlipCategory === 't4_slips'
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <span>T4 Slips (8)</span>
                    {autoCategorizedResult?.category === 't4_slips' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Auto-Selected" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlipCategory('t5_slips')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                      selectedSlipCategory === 't5_slips'
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <span>T5 Slips (5)</span>
                    {autoCategorizedResult?.category === 't5_slips' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Auto-Selected" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlipCategory('more_slips')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                      selectedSlipCategory === 'more_slips'
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <span>More Tax Slips (6)</span>
                    {autoCategorizedResult?.category === 'more_slips' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Auto-Selected" />
                    )}
                  </button>
                </div>

                {/* Sample document buttons */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {filteredSlipsList.map((slip) => (
                    <button
                      key={slip.code}
                      onClick={() => handleSelectSlip(slip.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-all cursor-pointer flex items-center space-x-1.5 ${
                        activeSlipCode === slip.code
                          ? 'bg-[#064e3b] text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono font-bold">{slip.code}</span>
                      <span className="text-[11px] opacity-85 truncate max-w-[120px]">
                        {isFrench ? slip.titleFr.split('(')[0] : slip.titleEn.split('(')[0]}
                      </span>
                      {autoCategorizedResult?.detectedSlipType === slip.code && (
                        <Sparkles className="w-3 h-3 text-amber-300 ml-0.5 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">
                    {isFrench
                      ? 'Glissez un fichier PDF ou Image ou cliquez pour sélectionner'
                      : 'Drag & drop PDF or Image file, or click to select'}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {isFrench
                      ? 'Reconnaissance visuelle automatique : détecte le type de feuillet (T4, T5, etc.) et pré-sélectionne la catégorie'
                      : 'Automatic vision recognition: detects slip type (T4, T5, etc.) and pre-selects category before scan execution'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="space-y-3">
                {/* Live Camera Viewfinder Card */}
                <div className="relative rounded-2xl overflow-hidden bg-[#0c2340] border-2 border-[#064e3b] shadow-xl aspect-16/10 sm:aspect-16/9 flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-6 text-center text-slate-300 flex flex-col items-center max-w-sm z-10">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">
                        {isFrench ? 'Caméra non disponible' : 'Camera Stream Unavailable'}
                      </p>
                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">{cameraError}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-lg bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isFrench ? 'Réessayer' : 'Retry Camera'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {isFrench ? 'Téléverser' : 'Upload Image'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Video element */}
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        autoPlay
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Visual Flash Effect on Capture */}
                      <AnimatePresence>
                        {captureFlash && (
                          <motion.div
                            initial={{ opacity: 0.9 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 bg-white pointer-events-none z-30"
                          />
                        )}
                      </AnimatePresence>

                      {/* Top Status & Controls Overlay */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                        <div className="flex items-center space-x-2 bg-[#0c2340]/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#064e3b] text-white text-xs shadow-md">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-bold tracking-wide uppercase text-[10px] text-emerald-300">
                            {isFrench ? 'Scanner en direct' : 'Live Camera OCR'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[11px] text-white font-bold">{activeSlipCode}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="p-1.5 rounded-lg bg-[#0c2340]/85 hover:bg-[#064e3b] text-white border border-[#064e3b] backdrop-blur-md transition-colors cursor-pointer text-xs"
                            title={isFrench ? 'Basculer la caméra' : 'Flip camera (front / back)'}
                          >
                            <FlipHorizontal className="w-4 h-4 text-emerald-300" />
                          </button>

                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-1.5 rounded-lg border backdrop-blur-md transition-colors cursor-pointer text-xs ${
                              isTorchOn
                                ? 'bg-amber-500/90 text-white border-amber-300'
                                : 'bg-[#0c2340]/85 hover:bg-[#064e3b] text-white border-[#064e3b]'
                            }`}
                            title={isFrench ? 'Éclairage d’appoint' : 'Torch / Light Boost'}
                          >
                            <Sun className="w-4 h-4 text-yellow-300" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowGuidelinesDetails((prev) => !prev)}
                            className="p-1.5 rounded-lg bg-[#0c2340]/85 hover:bg-[#064e3b] text-white border border-[#064e3b] backdrop-blur-md transition-colors cursor-pointer text-xs"
                            title={isFrench ? 'Directives de capture' : 'Capture Guidelines'}
                          >
                            <HelpCircle className="w-4 h-4 text-emerald-300" />
                          </button>
                        </div>
                      </div>

                      {/* Optical Corner Guides & Alignment Box */}
                      <div className="absolute inset-6 sm:inset-10 pointer-events-none flex items-center justify-center">
                        <div className="relative w-full h-full max-w-[480px] max-h-[300px] border border-dashed border-emerald-400/50 rounded-xl">
                          {/* 4 Corner L-Brackets */}
                          <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg shadow-sm" />
                          <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg shadow-sm" />
                          <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg shadow-sm" />
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg shadow-sm" />

                          {/* Animated Vertical Laser Sweep Line */}
                          <motion.div
                            animate={{ y: ['0%', '240%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                            className="absolute left-2 right-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                          />

                          {/* Centered Guide Pill */}
                          <div className="absolute -top-7 inset-x-0 flex justify-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0c2340]/90 border border-emerald-400/40 text-emerald-200 text-[10px] font-medium backdrop-blur-xs shadow-xs">
                              {isFrench ? 'Cadrez le feuillet dans les coins verts' : 'Align slip within green corner brackets'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Shutter Capture Button */}
                      <div className="absolute bottom-3 inset-x-0 flex flex-col items-center justify-center space-y-1 z-20 pointer-events-auto">
                        <button
                          id="capture-and-extract-btn"
                          type="button"
                          onClick={captureCameraFrame}
                          className="px-6 py-2.5 rounded-full bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs sm:text-sm flex items-center space-x-2 border-2 border-white ring-4 ring-[#0c2340]/60 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-emerald-300" />
                          <span>{isFrench ? 'Capturer et extraire (OCR)' : 'Capture & Extract OCR Data'}</span>
                        </button>
                        <span className="text-[10px] text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-medium">
                          {isFrench ? 'Extraction immédiate des cases fiscales' : 'Instant OCR field extraction into return'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Guidelines for Clear Image Capture (Deep Green, White, Deep Blue Theme) */}
                <div className="bg-[#0c2340] border border-[#064e3b] rounded-xl p-3.5 text-white shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-[#064e3b] border border-emerald-400/40 flex items-center justify-center">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {isFrench ? 'Directives pour une capture nette' : 'Guidelines for Clear Image Capture'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-mono bg-[#064e3b]/80 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      CRA OCR Optimized
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-lg border border-white/10 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-300 font-bold text-[10px] uppercase">
                        <Maximize2 className="w-3 h-3" />
                        <span>{isFrench ? '1. Repères' : '1. Center Frame'}</span>
                      </div>
                      <p className="text-slate-200 text-[10px] leading-tight">
                        {isFrench ? 'Cadrez les 4 coins du feuillet à l’intérieur' : 'Fit all 4 slip corners inside the guide box'}
                      </p>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-lg border border-white/10 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-300 font-bold text-[10px] uppercase">
                        <Sun className="w-3 h-3" />
                        <span>{isFrench ? '2. Éclairage' : '2. Even Light'}</span>
                      </div>
                      <p className="text-slate-200 text-[10px] leading-tight">
                        {isFrench ? 'Évitez les reflets et les ombres sur les cases' : 'Avoid glare, reflections & harsh shadows'}
                      </p>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-lg border border-white/10 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-300 font-bold text-[10px] uppercase">
                        <FileText className="w-3 h-3" />
                        <span>{isFrench ? '3. Surface' : '3. Flat Surface'}</span>
                      </div>
                      <p className="text-slate-200 text-[10px] leading-tight">
                        {isFrench ? 'Posez le feuillet à plat sur fond contrasté' : 'Lay slip flat on a dark contrasting surface'}
                      </p>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-lg border border-white/10 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-300 font-bold text-[10px] uppercase">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{isFrench ? '4. Stabilité' : '4. Hold Steady'}</span>
                      </div>
                      <p className="text-slate-200 text-[10px] leading-tight">
                        {isFrench ? 'Immobile pour un texte et chiffres nets' : 'Hold steady so CRA box numbers stay sharp'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Browser-Based Auto-Crop and Deskew Feature Bar */}
            {fileFormat !== 'pdf' && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 text-white space-y-2.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <Crop className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          {isFrench ? 'Recadrage & Redressement Automatique' : 'Auto-Crop & Deskew Engine'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          Client-Side CV
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {deskewInfo ? (
                          <span className="text-emerald-300 font-medium">
                            {isFrench
                              ? `Aligné : Angle ${deskewInfo.appliedAngle > 0 ? '+' : ''}${deskewInfo.appliedAngle}° • Bords recadrés (${Math.round(deskewInfo.confidence * 100)} % confiance, ${deskewInfo.processingTimeMs} ms)`
                              : `Aligned: Skew ${deskewInfo.appliedAngle > 0 ? '+' : ''}${deskewInfo.appliedAngle}° corrected • Borders trimmed (${Math.round(deskewInfo.confidence * 100)}% conf, ${deskewInfo.processingTimeMs}ms)`}
                          </span>
                        ) : (
                          <span>
                            {isFrench
                              ? 'Aligne les lignes de texte et supprime l’arrière-plan avant analyse'
                              : 'Level document text and crop out background margins before AI processing'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {/* Auto-Deskew & Crop Execution Button */}
                    <button
                      id="cv-trigger-deskew-btn"
                      type="button"
                      disabled={isDeskewing}
                      onClick={() => handleTriggerAutoCropAndDeskew()}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      title={isFrench ? 'Exécuter le redressement et recadrage automatique' : 'Run browser auto-crop and deskew alignment'}
                    >
                      {isDeskewing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Crop className="w-3.5 h-3.5" />
                      )}
                      <span>{isFrench ? 'Aligner / Recadrer' : 'Auto-Crop & Deskew'}</span>
                    </button>

                    {/* Toggle between Aligned and Original preview */}
                    {originalRawImage && (
                      <button
                        id="cv-toggle-aligned-original-btn"
                        type="button"
                        onClick={handleTogglePreviewMode}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1 transition-colors cursor-pointer ${
                          previewMode === 'original'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                        }`}
                        title={isFrench ? 'Basculer entre vue originale et redressée' : 'Toggle between raw original and deskewed alignment'}
                      >
                        {previewMode === 'original' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{isFrench ? 'Original (Brut)' : 'Raw Original'}</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-300" />
                            <span>{isFrench ? 'Aligné (IA)' : 'Aligned'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Alignment Grid Overlay Toggle */}
                    <button
                      id="cv-toggle-alignment-grid-btn"
                      type="button"
                      onClick={() => setShowAlignmentGrid((prev) => !prev)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        showAlignmentGrid
                          ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isFrench ? 'Grille de niveau optique' : 'Toggle alignment level grid overlay'}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>

                    {/* Fine-tune manual controls toggle */}
                    <button
                      id="cv-toggle-manual-adjust-btn"
                      type="button"
                      onClick={() => setShowManualAdjustment((prev) => !prev)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        showManualAdjustment
                          ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isFrench ? 'Ajustement manuel de l’angle' : 'Manual angle fine-tuning controls'}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Manual Adjustment Panel */}
                {showManualAdjustment && (
                  <div className="pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3 flex-1 max-w-sm">
                      <span className="text-slate-400 shrink-0 font-medium">
                        {isFrench ? 'Angle manuel :' : 'Fine-tune angle:'}
                      </span>
                      <input
                        id="cv-manual-angle-slider"
                        type="range"
                        min="-15"
                        max="15"
                        step="0.5"
                        value={manualSkewAngle}
                        onChange={(e) => handleManualAngleSlider(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-emerald-300 w-12 text-right">
                        {manualSkewAngle > 0 ? `+${manualSkewAngle}` : manualSkewAngle}°
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleRotate90Clockwise}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 cursor-pointer"
                        title={isFrench ? 'Pivoter de 90° vers la droite' : 'Rotate 90° clockwise'}
                      >
                        <RotateCw className="w-3 h-3 text-emerald-300" />
                        <span>90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleManualAngleSlider(0)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        {isFrench ? 'Réinitialiser' : 'Reset'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visual Canvas Display with Detected Bounding Boxes */}
            <div className="relative rounded-xl border border-slate-300 bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center min-h-[340px]">
              {/* Deskew in Progress Overlay */}
              {isDeskewing && (
                <div className="absolute inset-0 z-30 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                  <div className="relative">
                    <Crop className="w-10 h-10 text-emerald-400 animate-pulse" />
                    <RefreshCw className="w-5 h-5 text-emerald-300 animate-spin absolute -bottom-1 -right-1" />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">
                    {isFrench
                      ? 'Redressement et recadrage automatique du feuillet...'
                      : 'Auto-cropping borders & deskewing slip alignment...'}
                  </p>
                  <p className="text-xs text-emerald-300/80 font-mono">
                    Computing document contour & horizontal projection profiles
                  </p>
                </div>
              )}

              {/* Optical Level Alignment Grid Overlay */}
              {showAlignmentGrid && (
                <div className="absolute inset-0 pointer-events-none z-15 flex flex-col justify-between p-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-full border-b border-dashed border-emerald-400/35 relative"
                    >
                      <span className="absolute right-1 -top-2 text-[9px] font-mono text-emerald-400/60">
                        level {i * 20}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-200">
                    {isFrench
                      ? 'Extraction optique des cases et analyse en cours...'
                      : 'Optical analysis & box extraction in progress...'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Target Slip: {activeSlipCode} • Extracting CRA boxes...
                  </p>
                </div>
              )}

              {fileFormat === 'pdf' && !currentImageSrc.startsWith('http') && !currentImageSrc.startsWith('data:image') ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center">
                    <FileCheck className="w-8 h-8 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {uploadedFileName || `${activeSlipCode}_Receipt.pdf`}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFrench
                        ? 'Document PDF officiel chargé et prêt pour extraction'
                        : 'Official Canadian PDF document loaded and ready for extraction'}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={currentImageSrc}
                  alt="Tax Slip Analyzed"
                  className="w-full h-auto object-contain max-h-[380px]"
                />
              )}

              {/* Bounding Box Highlights */}
              {analysisResult?.boundingBoxes?.map((box, idx) => {
                const [ymin, xmin, ymax, xmax] = box.box_2d;
                const top = `${ymin / 10}%`;
                const left = `${xmin / 10}%`;
                const width = `${(xmax - xmin) / 10}%`;
                const height = `${(ymax - ymin) / 10}%`;

                const isIncome = box.label.includes('14') || box.label.includes('Income') || box.label.includes('21') || box.label.includes('13');
                const isTax = box.label.includes('22');
                const borderColor = isIncome
                  ? 'border-emerald-400 bg-emerald-500/15'
                  : isTax
                  ? 'border-blue-400 bg-blue-500/15'
                  : 'border-amber-400 bg-amber-500/15';

                return (
                  <div
                    key={idx}
                    style={{ top, left, width, height }}
                    className={`absolute z-10 border-2 rounded-sm ${borderColor} transition-all pointer-events-none group`}
                  >
                    <div className="absolute -top-5 left-0 bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md flex items-center space-x-1">
                      <span>{box.label}</span>
                      <span className="text-emerald-400 font-bold">
                        {Math.round(box.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs border-2 border-emerald-500 bg-emerald-500/20" />
                <span>{isFrench ? 'Revenu / Montant principal' : 'Primary Income / Box'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs border-2 border-blue-500 bg-blue-500/20" />
                <span>{isFrench ? 'Impôt retenu' : 'Tax Withheld'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs border-2 border-amber-500 bg-amber-500/20" />
                <span>{isFrench ? 'Déductions / Cotisations' : 'Deductions & Contributions'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Extraction Verification Form */}
          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div>
                  <div className="text-[11px] font-bold uppercase text-emerald-700 flex items-center space-x-1.5">
                    <span>{isFrench ? 'Résultats d’Extraction' : 'Slip Verification & Fields'}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] uppercase font-bold ${
                        fileFormat === 'pdf'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {fileFormat.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeSlipCode} • {isFrench ? activeSlipDef.titleFr : activeSlipDef.titleEn}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {Math.round((analysisResult?.confidenceScore || 0.98) * 100)}%{' '}
                    {isFrench ? 'Précision' : 'Match'}
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 text-xs text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>{isFrench ? 'Vérification requise :' : 'Verification required:'}</strong>{' '}
                  {isFrench
                    ? 'L’IA a pré-sélectionné la catégorie et extrait les montants. Vérifiez chaque case avant confirmation.'
                    : 'AI has pre-selected the category and extracted boxes. Please confirm each value against your slip.'}
                </p>
              </div>

              {/* Editable Slip Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isFrench ? 'Nom de l’émetteur / Payer' : 'Issuer / Payer Name'}
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Slip Specific Boxes */}
                {activeSlipCode === 'T4' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">
                        Case 14 — {isFrench ? 'Revenus' : 'Income'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={editableBoxes['14'] ?? ''}
                          onChange={(e) =>
                            setEditableBoxes({ ...editableBoxes, '14': parseFloat(e.target.value) || 0 })
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">
                        Case 22 — {isFrench ? 'Impôt retenu' : 'Tax Deducted'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={editableBoxes['22'] ?? ''}
                          onChange={(e) =>
                            setEditableBoxes({ ...editableBoxes, '22': parseFloat(e.target.value) || 0 })
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">
                        Case 16 — {isFrench ? 'Cotisation RPC' : 'CPP (Box 16)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={editableBoxes['16'] ?? ''}
                          onChange={(e) =>
                            setEditableBoxes({ ...editableBoxes, '16': parseFloat(e.target.value) || 0 })
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">
                        Case 18 — {isFrench ? 'Cotisation AE' : 'EI (Box 18)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={editableBoxes['18'] ?? ''}
                          onChange={(e) =>
                            setEditableBoxes({ ...editableBoxes, '18': parseFloat(e.target.value) || 0 })
                          }
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {activeSlipDef.keyBoxes.map((kb) => (
                        <div key={kb.box}>
                          <label className="block font-semibold text-slate-700 mb-0.5 truncate" title={isFrench ? kb.nameFr : kb.nameEn}>
                            {kb.box ? `Case ${kb.box}` : ''} {isFrench ? kb.nameFr : kb.nameEn}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              value={editableBoxes[kb.box] ?? ''}
                              onChange={(e) =>
                                setEditableBoxes({
                                  ...editableBoxes,
                                  [kb.box]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CRA Standard Slip Layout Verification */}
                <div className="pt-2 border-t border-slate-200">
                  {validationResult.isValid ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          {isFrench
                            ? 'Conformité CRA validée :'
                            : 'CRA Slip Layout Constraints Validated:'}
                        </span>{' '}
                        <span className="text-[11px] text-emerald-800">
                          {isFrench
                            ? 'Revenus, impôt retenu et montants respectent les exigences de l’ARC.'
                            : 'Amounts, withholdings, and fields meet CRA tax slip layout specifications.'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          {isFrench
                            ? 'Écarts avec le format standard CRA :'
                            : 'CRA Slip Layout Violations:'}
                        </span>
                        <ul className="mt-1 list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                          {validationResult.errors.map((err, idx) => (
                            <li key={idx}>{isFrench ? err.messageFr : err.messageEn}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
              >
                {isFrench ? 'Annuler' : 'Cancel'}
              </button>

              <button
                type="button"
                id="cv-confirm-apply-btn"
                disabled={!validationResult.isValid}
                onClick={handleConfirmAndApply}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all ${
                  validationResult.isValid
                    ? 'bg-[#064e3b] hover:bg-[#08634c] cursor-pointer ring-2 ring-[#0c2340]/40 hover:shadow-lg'
                    : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {autoPopulatedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>{isFrench ? 'Données renseignées avec succès !' : 'Fields Auto-Populated Successfully!'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>
                      {validationResult.isValid
                        ? isFrench
                          ? `Renseigner automatiquement & ajouter ${activeSlipCode} (${fileFormat.toUpperCase()})`
                          : `Auto-Populate & Add ${activeSlipCode} to Tax Return (${fileFormat.toUpperCase()})`
                        : isFrench
                        ? 'Corriger les erreurs CRA pour appliquer'
                        : 'Resolve CRA Errors to Apply'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
