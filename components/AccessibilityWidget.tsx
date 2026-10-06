'use client'

import { useState, useEffect, useCallback } from 'react'

type AccSettings = {
  textSize: number
  bigCursor: boolean
  highContrast: boolean
  negativeContrast: boolean
  lightBackground: boolean
  linksUnderline: boolean
  readableFont: boolean
  textSpacing: boolean
  pauseAnimations: boolean
  hideImages: boolean
  readingLine: boolean
  readingMask: boolean
  saturation: number
  alignment: number
  lineHeight: number
  letterSpacing: number
}

const defaultSettings: AccSettings = {
  textSize: 0,
  bigCursor: false,
  highContrast: false,
  negativeContrast: false,
  lightBackground: false,
  linksUnderline: false,
  readableFont: false,
  textSpacing: false,
  pauseAnimations: false,
  hideImages: false,
  readingLine: false,
  readingMask: false,
  saturation: 0,
  alignment: 0,
  lineHeight: 0,
  letterSpacing: 0,
}

const STORAGE_KEY = 'omahnalar-a11y'

function loadSettings(): AccSettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultSettings
}

function applyTextSize(size: number) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.style.removeProperty('font-size')
  if (size === 1) html.style.fontSize = '110%'
  else if (size === 2) html.style.fontSize = '125%'
  else if (size === 3) html.style.fontSize = '140%'
}

function applySettings(s: AccSettings) {
  if (typeof document === 'undefined') return
  const html = document.documentElement

  const BC = 'a11y-big-cursor'
  const HC = 'a11y-high-contrast'
  const NC = 'a11y-negative-contrast'
  const LB = 'a11y-light-bg'
  const LU = 'a11y-links-underline'
  const RF = 'a11y-readable-font'
  const TS = 'a11y-text-spacing'
  const PA = 'a11y-pause-animations'
  const HI = 'a11y-hide-images'
  const SH = 'a11y-sat-high'
  const SL = 'a11y-sat-low'
  const SN = 'a11y-sat-none'
  const AL = 'a11y-align-left'
  const AR = 'a11y-align-right'
  const AC = 'a11y-align-center'
  const AJ = 'a11y-align-justify'
  const LH0 = 'a11y-lh-15'
  const LH1 = 'a11y-lh-175'
  const LH2 = 'a11y-lh-2'
  const LS0 = 'a11y-ls-narrow'
  const LS1 = 'a11y-ls-medium'
  const LS2 = 'a11y-ls-wide'

  s.bigCursor ? html.classList.add(BC) : html.classList.remove(BC)
  s.highContrast ? html.classList.add(HC) : html.classList.remove(HC)
  s.negativeContrast ? html.classList.add(NC) : html.classList.remove(NC)
  s.lightBackground ? html.classList.add(LB) : html.classList.remove(LB)
  s.linksUnderline ? html.classList.add(LU) : html.classList.remove(LU)
  s.readableFont ? html.classList.add(RF) : html.classList.remove(RF)
  s.textSpacing ? html.classList.add(TS) : html.classList.remove(TS)
  s.pauseAnimations ? html.classList.add(PA) : html.classList.remove(PA)
  s.hideImages ? html.classList.add(HI) : html.classList.remove(HI)
  html.classList.remove(SH, SL, SN)
  if (s.saturation === 1) html.classList.add(SH)
  else if (s.saturation === 2) html.classList.add(SL)
  else if (s.saturation === 3) html.classList.add(SN)
  html.classList.remove(AL, AR, AC, AJ)
  if (s.alignment === 1) html.classList.add(AL)
  else if (s.alignment === 2) html.classList.add(AR)
  else if (s.alignment === 3) html.classList.add(AC)
  else if (s.alignment === 4) html.classList.add(AJ)
  html.classList.remove(LH0, LH1, LH2)
  if (s.lineHeight === 1) html.classList.add(LH0)
  else if (s.lineHeight === 2) html.classList.add(LH1)
  else if (s.lineHeight === 3) html.classList.add(LH2)
  html.classList.remove(LS0, LS1, LS2)
  if (s.letterSpacing === 1) html.classList.add(LS0)
  else if (s.letterSpacing === 2) html.classList.add(LS1)
  else if (s.letterSpacing === 3) html.classList.add(LS2)

  applyTextSize(s.textSize)
}

const textSizeLabels = ['Normal', 'Sedang', 'Besar', 'Sangat Besar']
const saturationLabels: { label: string; value: number }[] = [
  { label: 'Normal', value: 0 },
  { label: 'Saturasi Tinggi', value: 1 },
  { label: 'Saturasi Rendah', value: 2 },
  { label: 'Desaturasi', value: 3 },
]
const alignmentLabels: { label: string; value: number }[] = [
  { label: 'Normal', value: 0 },
  { label: 'Rata Kiri', value: 1 },
  { label: 'Rata Kanan', value: 2 },
  { label: 'Rata Tengah', value: 3 },
  { label: 'Rata Kanan-Kiri', value: 4 },
]
const lineHeightLabels: { label: string; value: number }[] = [
  { label: 'Normal', value: 0 },
  { label: '1.5x', value: 1 },
  { label: '1.75x', value: 2 },
  { label: '2x', value: 3 },
]
const letterSpacingLabels: { label: string; value: number }[] = [
  { label: 'Normal', value: 0 },
  { label: 'Spasi Tipis', value: 1 },
  { label: 'Spasi Sedang', value: 2 },
  { label: 'Spasi Tebal', value: 3 },
]

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<AccSettings>(defaultSettings)
  const [showTextSize, setShowTextSize] = useState(false)
  const [showContrast, setShowContrast] = useState(false)
  const [showSaturation, setShowSaturation] = useState(false)
  const [showAlignment, setShowAlignment] = useState(false)
  const [showLineHeight, setShowLineHeight] = useState(false)
  const [showLetterSpacing, setShowLetterSpacing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = loadSettings()
    setSettings(saved)
    applySettings(saved)
    setMounted(true)
  }, [])

  const update = useCallback((patch: Partial<AccSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      applySettings(next)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    update({ ...defaultSettings })
    setShowTextSize(false)
    setShowContrast(false)
    setShowSaturation(false)
    setShowAlignment(false)
    setShowLineHeight(false)
    setShowLetterSpacing(false)
    setShowAdvanced(false)
  }, [update])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open])

  /* Reading line: a horizontal line that tracks the cursor */
  useEffect(() => {
    if (!settings.readingLine) return
    const handler = (e: MouseEvent) => {
      const line = document.getElementById('a11y-reading-line')
      if (line) line.style.top = `${e.clientY}px`
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [settings.readingLine])

  /* Reading mask: dark overlay with a transparent horizontal slit
     carved via clip-path that follows the mouse */
  useEffect(() => {
    if (!settings.readingMask) return
    const overlay = document.getElementById('a11y-reading-mask-overlay')
    if (!overlay) return
    const bandHeight = 120
    const handler = (e: MouseEvent) => {
      const top = e.clientY - bandHeight / 2
      const bottom = e.clientY + bandHeight / 2
      const h = window.innerHeight
      overlay.style.clipPath = `polygon(0 0, 100% 0, 100% ${top}px, 0 ${top}px, 0 ${bottom}px, 100% ${bottom}px, 100% ${h}px, 0 ${h}px)`
    }
    document.addEventListener('mousemove', handler)
    handler({ clientY: window.innerHeight / 2 } as MouseEvent)
    return () => {
      document.removeEventListener('mousemove', handler)
      if (overlay) overlay.style.clipPath = 'none'
    }
  }, [settings.readingMask])

  if (!mounted) return null

  return (
    <>
      {settings.readingLine && (
        <div id="a11y-reading-line" className="a11y-reading-line" aria-hidden="true" />
      )}

      {/* Reading mask overlay — only render when active */}
      {settings.readingMask && (
        <div
          id="a11y-reading-mask-overlay"
          className="a11y-reading-mask-overlay"
          aria-hidden="true"
        >
          <button
            onClick={() => update({ readingMask: false })}
            className="a11y-mask-close-btn"
            aria-label="Tutup masker baca"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Aksesibilitas"
        aria-expanded={open}
        className={`a11y-toggle-btn ${open ? 'a11y-toggle-active' : ''}`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
            <path d="M8 14l2-7 4 14 2-7h3" />
          </svg>
        )}
      </button>

      {/* Menu Panel */}
      {open && <div className="a11y-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div
        className={`a11y-panel ${open ? 'a11y-panel-open' : ''}`}
        role="dialog"
        aria-label="Menu Aksesibilitas"
        aria-hidden={!open}
      >
        <div className="a11y-panel-header">
          <h3 className="a11y-panel-title">Aksesibilitas</h3>
          <button onClick={resetAll} className="a11y-reset-btn" title="Setel ulang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Reset</span>
          </button>
        </div>

        <div className="a11y-panel-body">
          {/* Text Size */}
          <div>
            <button
              onClick={() => setShowTextSize(!showTextSize)}
              className={`a11y-feature-btn ${showTextSize ? 'a11y-feature-active' : ''}`}
              aria-expanded={showTextSize}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
              </span>
              <span className="a11y-feature-label">Ukuran Teks</span>
              <span className="a11y-feature-value">{textSizeLabels[settings.textSize]}</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showTextSize ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showTextSize && (
              <div className="a11y-submenu">
                {textSizeLabels.map((label, i) => (
                  <button key={i} onClick={() => update({ textSize: i })} className={`a11y-sub-btn ${settings.textSize === i ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Contrast */}
          <div>
            <button
              onClick={() => setShowContrast(!showContrast)}
              className={`a11y-feature-btn ${showContrast ? 'a11y-feature-active' : ''}`}
              aria-expanded={showContrast}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
                </svg>
              </span>
              <span className="a11y-feature-label">Kontras</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showContrast ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showContrast && (
              <div className="a11y-submenu">
                {[
                  { label: 'Kontras Tinggi', key: 'highContrast' as const },
                  { label: 'Kontras Negatif', key: 'negativeContrast' as const },
                  { label: 'Latar Terang', key: 'lightBackground' as const },
                ].map(({ label, key }) => (
                  <button key={key} onClick={() => update({ [key]: !settings[key] })} className={`a11y-sub-btn a11y-sub-toggle ${settings[key] ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Saturation */}
          <div>
            <button
              onClick={() => setShowSaturation(!showSaturation)}
              className={`a11y-feature-btn ${showSaturation ? 'a11y-feature-active' : ''}`}
              aria-expanded={showSaturation}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 0 0 20" />
                </svg>
              </span>
              <span className="a11y-feature-label">Saturasi</span>
              <span className="a11y-feature-value">{saturationLabels.find(l => l.value === settings.saturation)?.label}</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showSaturation ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showSaturation && (
              <div className="a11y-submenu">
                {saturationLabels.map(({ label, value }) => (
                  <button key={value} onClick={() => update({ saturation: value })} className={`a11y-sub-btn ${settings.saturation === value ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Alignment */}
          <div>
            <button
              onClick={() => setShowAlignment(!showAlignment)}
              className={`a11y-feature-btn ${showAlignment ? 'a11y-feature-active' : ''}`}
              aria-expanded={showAlignment}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="10" x2="14" y2="10" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                  <line x1="4" y1="18" x2="14" y2="18" />
                </svg>
              </span>
              <span className="a11y-feature-label">Perataan Teks</span>
              <span className="a11y-feature-value">{alignmentLabels.find(l => l.value === settings.alignment)?.label}</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showAlignment ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showAlignment && (
              <div className="a11y-submenu">
                {alignmentLabels.map(({ label, value }) => (
                  <button key={value} onClick={() => update({ alignment: value })} className={`a11y-sub-btn ${settings.alignment === value ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Big Cursor */}
          <button
            onClick={() => update({ bigCursor: !settings.bigCursor })}
            className={`a11y-feature-btn a11y-toggle ${settings.bigCursor ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="M13 13l6 6" />
              </svg>
            </span>
            <span className="a11y-feature-label">Kursor Besar</span>
          </button>

          {/* Underline Links */}
          <button
            onClick={() => update({ linksUnderline: !settings.linksUnderline })}
            className={`a11y-feature-btn a11y-toggle ${settings.linksUnderline ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <span className="a11y-feature-label">Garis Bawah Tautan</span>
          </button>

          {/* Readable Font */}
          <button
            onClick={() => update({ readableFont: !settings.readableFont })}
            className={`a11y-feature-btn a11y-toggle ${settings.readableFont ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </span>
            <span className="a11y-feature-label">Font Terbaca</span>
          </button>

          {/* Text Spacing */}
          <button
            onClick={() => update({ textSpacing: !settings.textSpacing })}
            className={`a11y-feature-btn a11y-toggle ${settings.textSpacing ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="4" x2="22" y2="4" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </span>
            <span className="a11y-feature-label">Jarak Teks</span>
          </button>

          {/* Line Height */}
          <div>
            <button
              onClick={() => setShowLineHeight(!showLineHeight)}
              className={`a11y-feature-btn ${showLineHeight ? 'a11y-feature-active' : ''}`}
              aria-expanded={showLineHeight}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="10" x2="20" y2="10" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </span>
              <span className="a11y-feature-label">Tinggi Garis</span>
              <span className="a11y-feature-value">{lineHeightLabels.find(l => l.value === settings.lineHeight)?.label}</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showLineHeight ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showLineHeight && (
              <div className="a11y-submenu">
                {lineHeightLabels.map(({ label, value }) => (
                  <button key={value} onClick={() => update({ lineHeight: value })} className={`a11y-sub-btn ${settings.lineHeight === value ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Letter Spacing */}
          <div>
            <button
              onClick={() => setShowLetterSpacing(!showLetterSpacing)}
              className={`a11y-feature-btn ${showLetterSpacing ? 'a11y-feature-active' : ''}`}
              aria-expanded={showLetterSpacing}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <path d="M4 7V4h16v3" />
                  <path d="M6 20h12M7 4v16m4-16v16m6-16v16" strokeWidth="1.5" opacity="0.4" />
                </svg>
              </span>
              <span className="a11y-feature-label">Spasi Huruf</span>
              <span className="a11y-feature-value">{letterSpacingLabels.find(l => l.value === settings.letterSpacing)?.label}</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showLetterSpacing ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showLetterSpacing && (
              <div className="a11y-submenu">
                {letterSpacingLabels.map(({ label, value }) => (
                  <button key={value} onClick={() => update({ letterSpacing: value })} className={`a11y-sub-btn ${settings.letterSpacing === value ? 'a11y-sub-active' : ''}`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Pause Animations */}
          <button
            onClick={() => update({ pauseAnimations: !settings.pauseAnimations })}
            className={`a11y-feature-btn a11y-toggle ${settings.pauseAnimations ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </span>
            <span className="a11y-feature-label">Hentikan Animasi</span>
          </button>

          {/* Hide Images */}
          <button
            onClick={() => update({ hideImages: !settings.hideImages })}
            className={`a11y-feature-btn a11y-toggle ${settings.hideImages ? 'a11y-feature-active' : ''}`}
          >
            <span className="a11y-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            </span>
            <span className="a11y-feature-label">Sembunyikan Gambar</span>
          </button>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`a11y-feature-btn ${showAdvanced ? 'a11y-feature-active' : ''}`}
              aria-expanded={showAdvanced}
            >
              <span className="a11y-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span className="a11y-feature-label">Lainnya</span>
              <span className="a11y-collapse-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  {showAdvanced ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
                </svg>
              </span>
            </button>
            {showAdvanced && (
              <div className="a11y-submenu">
                <button
                  onClick={() => update({ readingLine: !settings.readingLine, readingMask: false })}
                  className={`a11y-sub-btn a11y-sub-toggle ${settings.readingLine ? 'a11y-sub-active' : ''}`}
                >
                  <span className="a11y-feature-icon" style={{ width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-brand-100)', marginRight: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </span>
                  Garis Baca
                </button>
                <button
                  onClick={() => update({ readingMask: !settings.readingMask, readingLine: false })}
                  className={`a11y-sub-btn a11y-sub-toggle ${settings.readingMask ? 'a11y-sub-active' : ''}`}
                >
                  <span className="a11y-feature-icon" style={{ width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-brand-100)', marginRight: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M2 12h20" />
                      <path d="M12 2v20" />
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                  </span>
                  Masker Baca
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="a11y-panel-footer">
          <button onClick={resetAll} className="a11y-reset-all-btn">
            Setel Ulang Semua
          </button>
        </div>
      </div>
    </>
  )
}
