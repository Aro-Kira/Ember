import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Camera,
  Check,
  AlertCircle,
  UserCheck,
  Clock,
  Wifi,
  Video,
  Church,
  CalendarDays,
  ChevronDown,
  QrCode
} from 'lucide-react';
import { YouthMember } from '../types';
import toast from '../hooks/useToast.tsx';

interface AttendanceScannerViewProps {
  onCheckInMember: (rgId: string) => void;
  onCheckInSunday: (userId: string) => void;
  onCheckInEvent: (eventId: string, userId: string) => void;
  members: YouthMember[];
  liveEvents: { id: string; title: string; date: string; time: string }[];
}

type ScanMode = 'sunday' | 'event';
type ScanResult = 'idle' | 'scanning' | 'success' | 'error';

export default function AttendanceScannerView({
  onCheckInMember,
  onCheckInSunday,
  onCheckInEvent,
  members,
  liveEvents
}: AttendanceScannerViewProps) {
  const [scanMode, setScanMode] = useState<ScanMode>('sunday');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [checkedInMember, setCheckedInMember] = useState<YouthMember | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const initScanner = useCallback(() => {
    if (!scannerDivRef.current) return;

    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
    }

    setCameraError(null);

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minDim * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Scan failure - this fires continuously, don't spam errors
      }
    );

    scannerRef.current = scanner;
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (scannerActive) {
      const timer = setTimeout(() => initScanner(), 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [scannerActive, initScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (scanResult === 'success' || scanResult === 'scanning') return;

    const userId = decodedText.trim();
    if (!userId) return;

    setScanResult('scanning');
    stopScanner();

    const member = members.find(m => m.id === userId || m.rgId === userId);

    setTimeout(() => {
      if (scanMode === 'sunday') {
        onCheckInSunday(userId);
        setCheckedInMember(member || null);
        setScanResult('success');
      } else if (scanMode === 'event' && selectedEventId) {
        onCheckInEvent(selectedEventId, userId);
        setCheckedInMember(member || null);
        setScanResult('success');
      } else if (scanMode === 'event' && !selectedEventId) {
        setScanResult('error');
        toast.error('Please select an event first!');
      }
    }, 500);
  }, [scanMode, selectedEventId, members, onCheckInSunday, onCheckInEvent, scanResult, stopScanner]);

  const resetScanner = () => {
    setScanResult('idle');
    setCheckedInMember(null);
    if (scannerActive) {
      setTimeout(() => initScanner(), 100);
    }
  };

  const handleToggleScanner = () => {
    if (scannerActive) {
      setScannerActive(false);
    } else {
      setScanResult('idle');
      setCheckedInMember(null);
      setScannerActive(true);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start max-w-[1200px] mx-auto">
      {/* Scanner Control Deck (Span 8) */}
      <div className="col-span-12 lg:col-span-8 bg-surface-container border border-surface-variant rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[680px]">

        {/* Top Status Bar */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/60">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="font-sans text-sm font-bold text-on-surface">Live Check-In Portal</h3>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-primary" /> SECURE LINK
            </span>
            <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {scannerActive ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-xl border border-outline-variant overflow-hidden flex-1">
            <button
              onClick={() => { setScanMode('sunday'); setSelectedEventId(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold font-mono transition-all cursor-pointer ${
                scanMode === 'sunday'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <Church className="w-4 h-4" />
              SUNDAY SERVICE
            </button>
            <button
              onClick={() => setScanMode('event')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold font-mono transition-all cursor-pointer ${
                scanMode === 'event'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              EVENT
            </button>
          </div>

          {scanMode === 'event' && (
            <div className="relative flex-1">
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value || null)}
                className="w-full appearance-none bg-surface-container-high border border-outline-variant rounded-xl py-2.5 px-4 pr-10 text-xs font-bold font-mono text-on-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select an event...</option>
                {liveEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          )}
        </div>

        {/* Scanner Status */}
        {scanMode === 'event' && !selectedEventId && scannerActive && (
          <div className="mx-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-mono text-amber-500 font-bold">SELECT AN EVENT BEFORE SCANNING</p>
          </div>
        )}

        {/* Camera Viewfinder / QR Scanner */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {scannerActive ? (
            <div className="w-full h-full relative">
              <div
                id="qr-reader"
                ref={scannerDivRef}
                className="w-full h-full"
                style={{ minHeight: '340px' }}
              />
              {/* Custom scan box overlay */}
              {scanResult === 'idle' && (
                <>
                  <div className="scan-vignette" />
                  <div className="scan-box-overlay">
                    <div className="scan-box-corner top-left" />
                    <div className="scan-box-corner top-right" />
                    <div className="scan-box-corner bottom-left" />
                    <div className="scan-box-corner bottom-right" />
                    <div className="scan-box-line" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center font-sans">
              <Video className="w-10 h-10 text-on-surface-variant/40 mb-3" />
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider font-mono">Scanner Inactive</p>
              <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[200px] text-center">Toggle camera deck below to boot live scan ports.</p>
            </div>
          )}

          {/* Scanning overlay */}
          {scanResult === 'scanning' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 font-sans">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-on-surface tracking-wider uppercase font-mono">Decoding QR...</p>
            </div>
          )}

          {/* Success overlay */}
          {scanResult === 'success' && (
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/40 shadow-2xl">
                <Check className="w-8 h-8 text-primary animate-bounce" />
              </div>
              <p className="text-xl font-sans font-black text-on-surface tracking-tight">CHECK-IN SUCCESSFUL!</p>
              <p className="text-xs text-on-surface-variant font-mono mt-1">
                {scanMode === 'sunday' ? 'SUNDAY SERVICE' : 'EVENT'} • DATABASE SYNCHRONIZED
              </p>

              <button
                onClick={resetScanner}
                className="mt-6 px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-sans shadow-lg shadow-primary/20"
              >
                Scan Next Member
              </button>
            </div>
          )}

          {/* Error overlay */}
          {scanResult === 'error' && (
            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans text-center p-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/40">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xl font-sans font-black text-on-surface tracking-tight">SCAN FAILED</p>
              <p className="text-xs text-on-surface-variant font-mono mt-1">
                {scanMode === 'event' && !selectedEventId
                  ? 'Please select an event before scanning'
                  : 'No valid QR code detected. Try again.'}
              </p>
              <button
                onClick={resetScanner}
                className="mt-6 px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-sans shadow-lg shadow-primary/20"
              >
                Try Again
              </button>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 font-sans">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider font-mono text-center px-4">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleToggleScanner}
            className={`font-mono text-xs font-bold py-2.5 px-5 rounded-lg border transition-all cursor-pointer ${
              scannerActive
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-outline-variant hover:border-on-surface text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {scannerActive ? 'DEACTIVATE SCANNER' : 'ACTIVATE SCANNER'}
          </button>

          <div className="flex items-center gap-2 font-mono text-[10px] text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${scannerActive ? 'bg-green-500 animate-pulse' : 'bg-on-surface-variant/40'}`} />
            <span>{scannerActive ? 'CAMERA READY' : 'CAMERA OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Right Side: Scan Result / Profile Info Card (Span 4) */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface-variant">Scanner Output</h4>
          <span className="font-mono text-[9px] text-primary">REAL-TIME READOUT</span>
        </div>

        {checkedInMember ? (
          <div className="bg-surface-container border-2 border-primary rounded-2xl overflow-hidden p-6 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-1 bg-primary/20 text-primary text-[9px] font-mono font-bold py-1 px-3 rounded-full uppercase tracking-widest mx-auto">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Check-In Confirmed</span>
            </div>

            <div className="relative w-24 h-24 mx-auto">
              <img
                className="w-full h-full rounded-2xl object-cover ring-4 ring-primary"
                src={checkedInMember.avatar}
                alt={checkedInMember.name}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface shadow-md"></span>
            </div>

            <div>
              <h4 className="font-sans text-md font-bold text-on-surface leading-tight">
                {checkedInMember.name}
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">{checkedInMember.email}</p>
            </div>

            <div className="bg-surface-container-high/60 p-4 rounded-xl border border-outline-variant/30 text-left space-y-3 font-sans text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">RG ID</span>
                <span className="font-mono font-bold text-secondary">{checkedInMember.rgId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">YOUTH LEVEL</span>
                <span className="bg-primary/25 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded font-mono uppercase">
                  {checkedInMember.level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">MODE</span>
                <span className="font-mono text-on-surface font-semibold">
                  {scanMode === 'sunday' ? 'Sunday Service' : 'Event'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">TIMESTAMP</span>
                <span className="font-mono text-on-surface font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Just now
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] text-on-surface-variant font-mono leading-relaxed">
                Welcome to Risktaker Generation. This event logs to database instantly.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[320px] text-on-surface-variant">
            <QrCode className="w-16 h-16 text-on-surface-variant/30 mb-4 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider font-mono">Awaiting QR scan</p>
            <p className="text-xs text-on-surface-variant/60 max-w-[200px] mt-1.5 leading-relaxed">
              {scanMode === 'sunday'
                ? 'Point the camera at a youth member\'s QR code to record Sunday attendance.'
                : selectedEventId
                  ? 'Point the camera at a youth member\'s QR code to check them into this event.'
                  : 'Select an event first, then scan a youth member\'s QR code.'}
            </p>
          </div>
        )}

        {/* Scanner Hardware specifications */}
        <div className="bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/40 font-mono text-[10px] text-on-surface-variant space-y-2.5">
          <p className="font-bold uppercase tracking-wider text-on-surface text-[11px]">Hardware Specs</p>
          <div className="flex justify-between">
            <span>INTERFACE MODE</span>
            <span>Webcam POV Auto-Focus</span>
          </div>
          <div className="flex justify-between">
            <span>DECODING ENGINE</span>
            <span>ISO/IEC 18004 Core 3</span>
          </div>
          <div className="flex justify-between">
            <span>FPS SAMPLING</span>
            <span>10 frames/sec</span>
          </div>
          <div className="flex justify-between">
            <span>LIBRARY</span>
            <span>html5-qrcode v2.3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
