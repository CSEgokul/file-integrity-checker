'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Copy,
  FileCheck2,
  FileKey2,
  FileQuestion,
  Files,
  FileText,
  Fingerprint,
  Hash,
  Info,
  LockKeyhole,
  Menu,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import {
  computeHash,
  computeAllHashes,
  SUPPORTED_ALGORITHMS,
  type SupportedAlgorithm,
} from '@/lib/hash'

interface ScanHistoryItem {
  id: string
  timestamp: string
  fileName: string
  fileSize: number
  algorithm: SupportedAlgorithm
  hash: string
  expectedHash?: string
  status: 'matched' | 'mismatched' | 'scanned'
}

type ActiveTab = 'scan' | 'compare' | 'explorer' | 'history'

export default function Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan')
  const [showMobileNav, setShowMobileNav] = useState(false)

  // Tab 1: Single File Scan state
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [hash, setHash] = useState<string>('')
  const [algorithm, setAlgorithm] = useState<SupportedAlgorithm>('SHA-256')
  const [expectedHash, setExpectedHash] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  // Tab 2: Compare Two Files state
  const fileAInputRef = useRef<HTMLInputElement>(null)
  const fileBInputRef = useRef<HTMLInputElement>(null)
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [hashA, setHashA] = useState<string>('')
  const [hashB, setHashB] = useState<string>('')
  const [compareAlgorithm, setCompareAlgorithm] = useState<SupportedAlgorithm>('SHA-256')
  const [isComparing, setIsComparing] = useState(false)

  // Tab 3: Hash Explorer state
  const [explorerMode, setExplorerMode] = useState<'file' | 'text'>('file')
  const [explorerText, setExplorerText] = useState('Verify file integrity with cryptographic hashing.')
  const [allHashes, setAllHashes] = useState<Record<SupportedAlgorithm, string> | null>(null)
  const [isCalculatingAll, setIsCalculatingAll] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // History state
  const [history, setHistory] = useState<ScanHistoryItem[]>([])

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // Calculate single hash
  const processFile = useCallback(async (selectedFile: File, algo: SupportedAlgorithm) => {
    setIsScanning(true)
    setFile(selectedFile)
    try {
      const buffer = await selectedFile.arrayBuffer()
      setFileBuffer(buffer)
      const calculated = await computeHash(buffer, algo)
      setHash(calculated)

      // Add to history
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          algorithm: algo,
          hash: calculated,
          status: 'scanned',
        },
        ...prev.slice(0, 29), // keep last 30
      ])
    } catch (err) {
      console.error('Hashing failed:', err)
    } finally {
      setIsScanning(false)
    }
  }, [])

  // Recalculate if algorithm changes while file buffer exists
  const handleAlgorithmChange = async (newAlgo: SupportedAlgorithm) => {
    setAlgorithm(newAlgo)
    if (fileBuffer) {
      setIsScanning(true)
      const calculated = await computeHash(fileBuffer, newAlgo)
      setHash(calculated)
      setIsScanning(false)
    }
  }

  // Single file handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      void processFile(selected, algorithm)
    }
    // reset input so the same file can be picked again
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const selected = e.dataTransfer.files?.[0]
    if (selected) {
      void processFile(selected, algorithm)
    }
  }

  // Sample file creator
  const loadSampleFile = () => {
    const content = '{\n  "app": "VeriFy",\n  "version": "1.0.0",\n  "timestamp": "2026-11-03T12:00:00Z",\n  "integrity": "verified"\n}'
    const sampleBlob = new Blob([content], { type: 'application/json' })
    const sample = new File([sampleBlob], 'system-manifest.json', { type: 'application/json' })
    void processFile(sample, algorithm)
  }

  // Verification status comparison logic
  const verificationStatus = useMemo(() => {
    if (!hash) return { status: 'none', label: 'No file scanned' }
    if (!expectedHash.trim()) return { status: 'unverified', label: 'Calculated (Pending check)' }

    const cleanCalculated = hash.trim().toLowerCase()
    const cleanExpected = expectedHash.trim().toLowerCase().replace(/\s+/g, '')

    if (cleanCalculated === cleanExpected) {
      return { status: 'match', label: 'Match Verified — Untampered' }
    } else {
      return { status: 'mismatch', label: 'Mismatch Detected — Tampered / Corrupt' }
    }
  }, [hash, expectedHash])

  // Security score
  const securityScore = useMemo(() => {
    if (!hash) return 0
    if (verificationStatus.status === 'match') return 100
    if (verificationStatus.status === 'mismatch') return 12
    return 80 // Fingerprint generated, awaiting comparison
  }, [hash, verificationStatus.status])

  // Copy hash helper
  const copyToClipboard = (text: string, key?: string) => {
    void navigator.clipboard.writeText(text)
    if (key) {
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1800)
    } else {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  // Formatted hash with spaces
  const formattedHash = useMemo(() => {
    if (!hash) return ''
    return hash.match(/.{1,16}/g)?.join(' ') ?? hash
  }, [hash])

  // File vs File Compare handlers
  const handleFileA = async (selected: File) => {
    setFileA(selected)
    setIsComparing(true)
    const buf = await selected.arrayBuffer()
    const h = await computeHash(buf, compareAlgorithm)
    setHashA(h)
    setIsComparing(false)
  }

  const handleFileB = async (selected: File) => {
    setFileB(selected)
    setIsComparing(true)
    const buf = await selected.arrayBuffer()
    const h = await computeHash(buf, compareAlgorithm)
    setHashB(h)
    setIsComparing(false)
  }

  const filesMatch = useMemo(() => {
    if (!hashA || !hashB) return null
    return hashA.toLowerCase() === hashB.toLowerCase()
  }, [hashA, hashB])

  // Explorer Tab: Compute all hashes for text or file
  useEffect(() => {
    if (activeTab === 'explorer') {
      if (explorerMode === 'text') {
        const runTextHash = async () => {
          setIsCalculatingAll(true)
          const encoder = new TextEncoder()
          const buf = encoder.encode(explorerText).buffer
          const res = await computeAllHashes(buf)
          setAllHashes(res)
          setIsCalculatingAll(false)
        }
        void runTextHash()
      } else if (explorerMode === 'file' && fileBuffer) {
        const runFileHash = async () => {
          setIsCalculatingAll(true)
          const res = await computeAllHashes(fileBuffer)
          setAllHashes(res)
          setIsCalculatingAll(false)
        }
        void runFileHash()
      }
    }
  }, [activeTab, explorerMode, explorerText, fileBuffer])

  // Clear single file
  const resetSingleScan = () => {
    setFile(null)
    setFileBuffer(null)
    setHash('')
    setExpectedHash('')
  }

  return (
    <div className="min-h-screen bg-[#07100f] text-[#effaf6] selection:bg-[#38e8b0]/20 selection:text-[#8fffd4]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-white/[0.07] bg-[#091513] px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${
          showMobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-[#45e5b2] text-[#06211a] shadow-[0_0_24px_rgba(69,229,178,.18)]">
              <ShieldCheck size={20} strokeWidth={2.4} />
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#9cf96e] ring-2 ring-[#091513]" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Veri<span className="text-[#58e6b5]">fy</span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[.22em] text-white/35">
                Security console
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileNav(false)}
            className="rounded-lg p-1 text-white/40 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-10">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">
            Workspace
          </p>
          <nav className="mt-3 space-y-1.5" aria-label="Workspace navigation">
            <button
              onClick={() => {
                setActiveTab('scan')
                setShowMobileNav(false)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                activeTab === 'scan'
                  ? 'bg-[#12352e] text-[#71f0c1]'
                  : 'text-white/50 hover:bg-white/[.04] hover:text-white/85'
              }`}
            >
              <FileCheck2 size={17} strokeWidth={1.8} />
              <span>Integrity scan</span>
              {activeTab === 'scan' && (
                <span className="ml-auto size-1.5 rounded-full bg-[#52e5b2] shadow-[0_0_8px_#52e5b2]" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('compare')
                setShowMobileNav(false)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                activeTab === 'compare'
                  ? 'bg-[#12352e] text-[#71f0c1]'
                  : 'text-white/50 hover:bg-white/[.04] hover:text-white/85'
              }`}
            >
              <Files size={17} strokeWidth={1.8} />
              <span>File comparator</span>
              {activeTab === 'compare' && (
                <span className="ml-auto size-1.5 rounded-full bg-[#52e5b2] shadow-[0_0_8px_#52e5b2]" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('explorer')
                setShowMobileNav(false)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                activeTab === 'explorer'
                  ? 'bg-[#12352e] text-[#71f0c1]'
                  : 'text-white/50 hover:bg-white/[.04] hover:text-white/85'
              }`}
            >
              <Hash size={17} strokeWidth={1.8} />
              <span>Hash explorer</span>
              {activeTab === 'explorer' && (
                <span className="ml-auto size-1.5 rounded-full bg-[#52e5b2] shadow-[0_0_8px_#52e5b2]" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('history')
                setShowMobileNav(false)
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                activeTab === 'history'
                  ? 'bg-[#12352e] text-[#71f0c1]'
                  : 'text-white/50 hover:bg-white/[.04] hover:text-white/85'
              }`}
            >
              <Terminal size={17} strokeWidth={1.8} />
              <span>Scan history</span>
              {history.length > 0 && (
                <span className="ml-auto rounded-full bg-[#17463b] px-1.5 py-0.5 text-[10px] text-[#76f1c2]">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="mt-10">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">
            System status
          </p>
          <div className="mt-3 rounded-xl border border-[#55e5b1]/10 bg-[#0c211c] p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8bf6cd]">
              <span className="size-1.5 rounded-full bg-[#68eeaf] shadow-[0_0_7px_#68eeaf]" />
              WebCrypto Engine Active
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              Hardware-accelerated local cryptography in sandbox
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 left-5 right-5 border-t border-white/[.07] pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#1a3933] text-xs font-semibold text-[#8ef5cf]">
              SY
            </div>
            <div>
              <p className="text-xs font-medium">Security Analyst</p>
              <p className="text-[10px] text-white/35">Local Client Mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav backdrop */}
      {showMobileNav && (
        <button
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setShowMobileNav(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen lg:ml-[248px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-white/[.07] bg-[#07100f]/85 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(true)}
              className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/35">
                Workspace /{' '}
                <span className="text-[#70e4b7]">
                  {activeTab === 'scan' && 'Integrity scan'}
                  {activeTab === 'compare' && 'File comparator'}
                  {activeTab === 'explorer' && 'Hash explorer'}
                  {activeTab === 'history' && 'Scan history'}
                </span>
              </p>
              <h1 className="mt-0.5 text-[15px] font-semibold tracking-tight text-white">
                File Integrity Checker
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#55e5b1]/15 bg-[#0b211c] px-3 py-1.5 text-[11px] text-[#77e8be]">
              <span className="size-1.5 rounded-full bg-[#74eeae] shadow-[0_0_9px_#74eeae]" />
              Client-side private
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          {/* TAB 1: INTEGRITY SCAN */}
          {activeTab === 'scan' && (
            <div>
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#5de3b2]">
                    <span className="h-px w-6 bg-[#45dba9]" /> Cryptographic verification
                  </div>
                  <h2 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">
                    Verify. Detect. <span className="text-[#56ddb0]">Trust.</span>
                  </h2>
                  <p className="mt-2.5 max-w-xl text-sm leading-6 text-white/50">
                    Confirm that files haven&apos;t been tampered with or corrupted. Compute instant
                    cryptographic hashes and compare against manufacturer checksums.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={loadSampleFile}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0e1d1a] px-3 py-2 text-xs font-medium text-white/70 transition hover:border-[#4ddfb0]/40 hover:text-white"
                  >
                    <FileText size={14} className="text-[#5be4b4]" /> Load sample file
                  </button>
                  {file && (
                    <button
                      onClick={resetSingleScan}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0e1d1a] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-red-500/40 hover:text-red-300"
                    >
                      <RotateCcw size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Main Grid: Upload & Verification */}
              <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
                {/* Left Card: File Upload & Hash Generation */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5 shadow-2xl shadow-black/20 sm:p-6">
                    <div className="mb-5 flex items-center justify-between border-b border-white/[.07] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#12382f] text-[#6ef1bd]">
                          <FileKey2 size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">1. Select Target File</h3>
                          <p className="text-[11px] text-white/40">
                            Drop any file to compute its digital fingerprint
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-white/30">LOCAL-HASH</span>
                    </div>

                    <input
                      ref={inputRef}
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                    />

                    {/* Drag and Drop Box */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`group flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 text-center transition ${
                        isDragging
                          ? 'border-[#55e5b1] bg-[#143d33]/80'
                          : 'border-[#4ddfb0]/25 bg-[#0b201b]/60 hover:border-[#63efbd]/60 hover:bg-[#103028]'
                      }`}
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-[#4ddfb0]/20 bg-[#164438] text-[#6ceabc] transition group-hover:scale-105">
                        <Upload size={20} />
                      </div>
                      <p className="text-sm font-medium text-white/90">
                        {isDragging ? (
                          <span className="text-[#63e6b4]">Drop file here to hash</span>
                        ) : (
                          <>
                            Drop file here or <span className="text-[#63e6b4] underline">browse files</span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">
                        Any file type · Never leaves your browser · 100% private
                      </p>
                    </div>

                    {/* File Info Banner */}
                    {file ? (
                      <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-white/[.07] bg-[#101d1b] p-3.5 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#19352f] text-[#71e4b7]">
                            <Terminal size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white/90">
                              {file.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-white/40">
                              {formatBytes(file.size)} · Last modified:{' '}
                              {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 self-start rounded-full bg-[#13372e] px-2.5 py-1 text-[10px] font-medium text-[#73f0c0] sm:self-auto">
                          <CheckCircle2 size={13} /> Loaded
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#0e1917]/50 px-4 py-3 text-xs text-white/40">
                        <Info size={14} className="shrink-0 text-white/30" />
                        <span>No file selected yet. Browse or drop a file to begin scanning.</span>
                      </div>
                    )}

                    {/* Algorithm selection row */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[.07] pt-4">
                      <div>
                        <label
                          htmlFor="algo-select"
                          className="block text-[10px] font-semibold uppercase tracking-[.16em] text-white/40"
                        >
                          Hash Algorithm
                        </label>
                        <div className="relative mt-1.5">
                          <select
                            id="algo-select"
                            value={algorithm}
                            onChange={(e) => handleAlgorithmChange(e.target.value as SupportedAlgorithm)}
                            className="w-full appearance-none rounded-lg border border-white/[.12] bg-[#101d1b] px-3.5 py-2 pr-8 text-xs font-medium text-white outline-none transition focus:border-[#55e5b1]/60 sm:w-[220px]"
                          >
                            {SUPPORTED_ALGORITHMS.map((algo) => (
                              <option key={algo.id} value={algo.id}>
                                {algo.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-2.5 text-white/30"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => inputRef.current?.click()}
                        className="flex h-[38px] items-center gap-2 rounded-lg bg-[#4ddcad] px-4 text-xs font-semibold text-[#06221b] shadow-[0_0_18px_rgba(77,220,173,.15)] transition hover:bg-[#77edc4]"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Calculating...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> Choose different file
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* STEP 2: Expected Hash Comparison Card */}
                  <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5 shadow-2xl shadow-black/20 sm:p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-white/[.07] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#182b3c] text-[#76b9ee]">
                          <Shield size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">2. Compare Against Expected Checksum</h3>
                          <p className="text-[11px] text-white/40">
                            Paste the checksum from the developer or source website
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-white/30">VERIFY-MATCH</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[.16em] text-white/40">
                        Expected {algorithm} Hash
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={expectedHash}
                          onChange={(e) => setExpectedHash(e.target.value)}
                          placeholder={`Paste expected ${algorithm} hash here (e.g. 5eb63bbb...)`}
                          className="w-full rounded-lg border border-white/[.12] bg-[#081513] px-3.5 py-2.5 font-mono text-xs text-white placeholder-white/25 outline-none transition focus:border-[#55e5b1]/60"
                        />
                        {expectedHash && (
                          <button
                            onClick={() => setExpectedHash('')}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Verification Status Banner */}
                      {hash && expectedHash && (
                        <div
                          className={`mt-4 flex items-center gap-3 rounded-xl border p-3.5 text-xs ${
                            verificationStatus.status === 'match'
                              ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                              : 'border-red-500/30 bg-red-950/40 text-red-200'
                          }`}
                        >
                          {verificationStatus.status === 'match' ? (
                            <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
                          ) : (
                            <ShieldAlert size={20} className="shrink-0 text-red-400" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {verificationStatus.status === 'match'
                                ? 'INTEGRITY VERIFIED: Checksums match perfectly!'
                                : 'WARNING: Checksum mismatch detected!'}
                            </p>
                            <p className="mt-0.5 text-[11px] opacity-80">
                              {verificationStatus.status === 'match'
                                ? 'The file is authentic and completely unaltered from the publisher.'
                                : 'The file has been modified, corrupted during transit, or is an untrusted copy.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 3: Cryptographic Fingerprint Card */}
                  <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5 shadow-2xl sm:p-6">
                    <div className="flex flex-col justify-between gap-3 border-b border-white/[.07] pb-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#182b3c] text-[#76b9ee]">
                          <Fingerprint size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Calculated Digital Fingerprint</h3>
                          <p className="text-[11px] text-white/40">
                            Unique cryptographic identity of this file
                          </p>
                        </div>
                      </div>

                      {hash && (
                        <button
                          onClick={() => copyToClipboard(hash)}
                          className="flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-[#0e1e1b] px-3 py-1.5 text-[11px] font-medium text-white/70 transition hover:border-white/20 hover:text-white sm:self-auto"
                        >
                          {copied ? (
                            <Check size={13} className="text-[#6ee9b7]" />
                          ) : (
                            <Copy size={13} />
                          )}
                          {copied ? 'Copied!' : 'Copy raw hash'}
                        </button>
                      )}
                    </div>

                    <div className="mt-4">
                      {hash ? (
                        <div className="rounded-xl border border-[#224e43] bg-[#071714] p-4 font-mono text-[11px] leading-6 tracking-[.06em] text-[#74e0b6] sm:text-xs">
                          <span className="mr-3 inline-block rounded bg-[#103028] px-2 py-0.5 text-[10px] font-bold text-[#8effd5]">
                            {algorithm}
                          </span>
                          <span className="break-all">{formattedHash}</span>
                        </div>
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#071714]/40 text-xs text-white/30">
                          Fingerprint will appear here once a file is scanned
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/40">
                        <span>Generated in browser memory · Never sent over network</span>
                        <span className="flex items-center gap-1 text-[#65dbaa]">
                          <LockKeyhole size={12} /> End-to-end local
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Security Score & Diagnostics */}
                <div className="space-y-6">
                  {/* Score Card */}
                  <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">
                          Security Score
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span
                            className={`text-4xl font-bold tracking-tight ${
                              securityScore === 100
                                ? 'text-[#70e9ba]'
                                : securityScore > 50
                                ? 'text-amber-400'
                                : securityScore > 0
                                ? 'text-red-400'
                                : 'text-white/30'
                            }`}
                          >
                            {securityScore}
                          </span>
                          <span className="text-sm text-white/30">/ 100</span>
                        </div>
                      </div>

                      <div className="relative flex size-[60px] items-center justify-center rounded-full border-[5px] border-[#1a3932] border-t-[#62e7b4] border-r-[#62e7b4] rotate-45">
                        <ShieldCheck size={22} className="-rotate-45 text-[#65e8b5]" />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[.08]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          securityScore === 100
                            ? 'bg-gradient-to-r from-[#2da77e] to-[#75edbb]'
                            : securityScore > 50
                            ? 'bg-amber-400'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(securityScore, 4)}%` }}
                      />
                    </div>

                    {/* Diagnostics List */}
                    <div className="mt-5 space-y-3 border-t border-white/[.07] pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">File Loaded</span>
                        <span className={file ? 'text-[#63e6b5]' : 'text-white/30'}>
                          {file ? 'Yes' : 'None'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Hash Generated</span>
                        <span className={hash ? 'text-[#63e6b5]' : 'text-white/30'}>
                          {hash ? 'Complete' : 'Pending'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Checksum Check</span>
                        <span
                          className={
                            verificationStatus.status === 'match'
                              ? 'text-emerald-400'
                              : verificationStatus.status === 'mismatch'
                              ? 'text-red-400'
                              : 'text-white/30'
                          }
                        >
                          {verificationStatus.status === 'match' && 'Verified Match'}
                          {verificationStatus.status === 'mismatch' && 'Tamper Alert'}
                          {verificationStatus.status === 'unverified' && 'Awaiting Input'}
                          {verificationStatus.status === 'none' && 'No Scan'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Collision Resistance</span>
                        <span className="text-[#63e6b5]">
                          {algorithm === 'MD5' || algorithm === 'SHA-1' ? 'Legacy' : 'High'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Feature Badges */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#0a1513] px-4 py-3">
                      <Zap size={16} className="shrink-0 text-[#eac86c]" />
                      <div>
                        <p className="text-[11px] font-medium text-white/90">Instant Analysis</p>
                        <p className="text-[10px] text-white/40">Computed in milliseconds</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#0a1513] px-4 py-3">
                      <LockKeyhole size={16} className="shrink-0 text-[#73b8eb]" />
                      <div>
                        <p className="text-[11px] font-medium text-white/90">Zero Uploads</p>
                        <p className="text-[10px] text-white/40">Files never leave your machine</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#0a1513] px-4 py-3">
                      <AlertTriangle size={16} className="shrink-0 text-[#e8a964]" />
                      <div>
                        <p className="text-[11px] font-medium text-white/90">Tamper Alerts</p>
                        <p className="text-[10px] text-white/40">Detect single-byte alterations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILE COMPARATOR */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  File vs File Comparator
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  Select two files to check if they are byte-for-byte identical or if one has been
                  modified.
                </p>
              </div>

              {/* Algorithm select for comparator */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">Comparison Algorithm:</span>
                <select
                  value={compareAlgorithm}
                  onChange={(e) => setCompareAlgorithm(e.target.value as SupportedAlgorithm)}
                  className="rounded-lg border border-white/10 bg-[#0e1d1a] px-3 py-1.5 text-xs text-white outline-none"
                >
                  {SUPPORTED_ALGORITHMS.map((algo) => (
                    <option key={algo.id} value={algo.id}>
                      {algo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* File A */}
                <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5">
                  <h3 className="text-sm font-semibold text-white">Original File (A)</h3>
                  <input
                    ref={fileAInputRef}
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleFileA(f)
                    }}
                  />
                  <div
                    onClick={() => fileAInputRef.current?.click()}
                    className="mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0a1714] p-4 text-center transition hover:border-[#55e5b1]/50"
                  >
                    <Upload size={18} className="text-[#64ebb6]" />
                    <p className="mt-2 text-xs font-medium text-white/80">
                      {fileA ? fileA.name : 'Choose File A'}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {fileA ? formatBytes(fileA.size) : 'Click to browse'}
                    </p>
                  </div>
                  {hashA && (
                    <div className="mt-4 rounded-lg bg-[#071714] p-3 font-mono text-[11px] text-[#74e0b6] break-all">
                      {hashA}
                    </div>
                  )}
                </div>

                {/* File B */}
                <div className="rounded-2xl border border-white/[.09] bg-[#0b1715] p-5">
                  <h3 className="text-sm font-semibold text-white">Comparison File (B)</h3>
                  <input
                    ref={fileBInputRef}
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleFileB(f)
                    }}
                  />
                  <div
                    onClick={() => fileBInputRef.current?.click()}
                    className="mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0a1714] p-4 text-center transition hover:border-[#55e5b1]/50"
                  >
                    <Upload size={18} className="text-[#64ebb6]" />
                    <p className="mt-2 text-xs font-medium text-white/80">
                      {fileB ? fileB.name : 'Choose File B'}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {fileB ? formatBytes(fileB.size) : 'Click to browse'}
                    </p>
                  </div>
                  {hashB && (
                    <div className="mt-4 rounded-lg bg-[#071714] p-3 font-mono text-[11px] text-[#74e0b6] break-all">
                      {hashB}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Verdict */}
              {filesMatch !== null && (
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-5 ${
                    filesMatch
                      ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-100'
                      : 'border-red-500/30 bg-red-950/30 text-red-100'
                  }`}
                >
                  {filesMatch ? (
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={24} className="text-red-400" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">
                      {filesMatch
                        ? 'Files are 100% IDENTICAL'
                        : 'Files are DIFFERENT (Modified / Corrupt)'}
                    </h4>
                    <p className="text-xs opacity-80">
                      {filesMatch
                        ? 'Both files produced the exact same cryptographic hash.'
                        : 'The hashes do not match. The files have different contents.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HASH EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Multi-Hash Explorer
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  Compute all standard cryptographic algorithms simultaneously (SHA-256, SHA-512,
                  SHA-384, SHA-1, MD5) for a file or raw text.
                </p>
              </div>

              {/* Switch Mode: File or Text */}
              <div className="flex gap-2 border-b border-white/[.07] pb-3">
                <button
                  onClick={() => setExplorerMode('file')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    explorerMode === 'file'
                      ? 'bg-[#153f34] text-[#74f1c1]'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  From Uploaded File {file ? `(${file.name})` : ''}
                </button>
                <button
                  onClick={() => setExplorerMode('text')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    explorerMode === 'text'
                      ? 'bg-[#153f34] text-[#74f1c1]'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  From Custom Text
                </button>
              </div>

              {explorerMode === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">
                    Enter text to hash:
                  </label>
                  <textarea
                    value={explorerText}
                    onChange={(e) => setExplorerText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1715] p-3 text-xs text-white placeholder-white/30 outline-none focus:border-[#55e5b1]/60"
                  />
                </div>
              )}

              {explorerMode === 'file' && !file && (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#0b1715] p-6 text-center text-xs text-white/40">
                  <p>No file loaded in main tab yet.</p>
                  <button
                    onClick={() => setActiveTab('scan')}
                    className="mt-2 text-[#56ddb0] underline"
                  >
                    Go to Integrity Scan to select a file
                  </button>
                </div>
              )}

              {/* All Hashes Table */}
              {allHashes && (
                <div className="space-y-3">
                  {(Object.keys(allHashes) as SupportedAlgorithm[]).map((algoKey) => (
                    <div
                      key={algoKey}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-white/[.08] bg-[#0b1715] p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-[#62e7b4]">
                          {algoKey}
                        </span>
                        <p className="mt-1 font-mono text-xs text-white/80 break-all">
                          {allHashes[algoKey]}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(allHashes[algoKey], algoKey)}
                        className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/10 bg-[#10201d] px-3 py-1.5 text-xs text-white/70 hover:border-white/20 hover:text-white sm:self-auto"
                      >
                        {copiedKey === algoKey ? (
                          <Check size={13} className="text-[#64ebb6]" />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copiedKey === algoKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCAN HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Session Scan History
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Log of files processed during this active browser session.
                  </p>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-red-500/40 hover:text-red-300"
                  >
                    <Trash2 size={13} /> Clear log
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#0b1715] p-8 text-center text-xs text-white/35">
                  No files scanned in this session yet. Upload a file in Integrity Scan to see records
                  here.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1715]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-[#0e1f1c] text-[10px] font-semibold uppercase text-white/40">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Algorithm</th>
                        <th className="px-4 py-3">Hash Digest</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[.06]">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[.02]">
                          <td className="px-4 py-3 text-white/50 font-mono text-[11px]">
                            {item.timestamp}
                          </td>
                          <td className="px-4 py-3 font-medium text-white/90 truncate max-w-[180px]">
                            {item.fileName}
                          </td>
                          <td className="px-4 py-3 text-white/50">{formatBytes(item.fileSize)}</td>
                          <td className="px-4 py-3 font-mono text-[#68eab8]">{item.algorithm}</td>
                          <td className="px-4 py-3 font-mono text-white/70 truncate max-w-[220px]">
                            {item.hash}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => copyToClipboard(item.hash)}
                              className="rounded p-1 text-white/50 hover:text-white"
                              title="Copy hash"
                            >
                              <Copy size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/[.07] px-5 py-5 text-center font-mono text-[9px] uppercase tracking-[.15em] text-white/30 lg:px-12">
          VeriFy Security Console <span className="mx-2 text-white/10">·</span> SHA-2 / SHA-3 /
          MD5 cryptography <span className="mx-2 text-white/10">·</span> 100% Local In-Browser
          Processing
        </footer>
      </main>
    </div>
  )
}
