import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

const API = "http://localhost:8000";

// ── Theme palettes ─────────────────────────────────────────────────────────────
const DARK = {
  bg:       "#0a0f07",
  card:     "#0f1a0b",
  border:   "#1e3318",
  green:    "#4ade80",
  greenDim: "#22c55e",
  accent:   "#a3e635",
  text:     "#e2f5d3",
  muted:    "#6b8f5e",
  rust:     "#e67e22",
  red:      "#e74c3c",
  gray:     "#95a5a6",
  navBg:    "#0f1a0b",
  inputBg:  "#0f1a0b",
  subBg:    "#0a0f07",
  shadow:   "rgba(0,0,0,0.4)",
};

const LIGHT = {
  bg:       "#f0f7ec",
  card:     "#ffffff",
  border:   "#c8e6b8",
  green:    "#16a34a",
  greenDim: "#15803d",
  accent:   "#65a30d",
  text:     "#1a2e14",
  muted:    "#4b7a3a",
  rust:     "#c2410c",
  red:      "#dc2626",
  gray:     "#6b7280",
  navBg:    "#ffffff",
  inputBg:  "#f8fdf5",
  subBg:    "#f0f7ec",
  shadow:   "rgba(0,0,0,0.08)",
};

// ── Theme context ──────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ C: DARK, dark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

const NAV_ITEMS = ["Dashboard", "Detect", "Diseases", "History"];

const DISEASE_COLORS = {
  "Northern Leaf Blight": "#e67e22",
  "Fall Armyworm":        "#c0392b",
  "Gray Leaf Spot":       "#95a5a6",
  "Leaf Beetle":          "#d4a017",
  "Grasshopper":          "#7dbd5f",
  "Streak Virus":         "#8e44ad",
  Healthy:                "#4ade80",
};

// ── Atoms ──────────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  const { C } = useTheme();
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${C.shadow}`, transition: "background 0.3s, border-color 0.3s", ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 99, padding: "3px 12px", fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color }) {
  const { C } = useTheme();
  const col = color ?? C.green;
  return (
    <Card>
      <p style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{label}</p>
      <p style={{ color: col, fontSize: 40, fontFamily: "'Space Mono', monospace", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{sub}</p>}
    </Card>
  );
}

function ProgressBar({ value, color, label }) {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.text, fontSize: 13 }}>{label}</span>
        <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── Theme toggle button ────────────────────────────────────────────────────────
function ThemeToggle() {
  const { C, dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to Day Mode" : "Switch to Night Mode"}
      style={{
        width: "100%",
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "9px 14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s",
        marginBottom: 12,
      }}
    >
      <span style={{ color: C.muted, fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
        {dark ? "DAY MODE" : "NIGHT MODE"}
      </span>
      {/* pill track */}
      <div style={{ width: 36, height: 20, borderRadius: 99, background: dark ? C.border : C.green, position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: dark ? 3 : 17, width: 14, height: 14, borderRadius: "50%", background: dark ? C.muted : "#fff", transition: "left 0.25s", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {dark ? "🌙" : "☀️"}
        </div>
      </div>
    </button>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ stats, history }) {
  const { C } = useTheme();
  const total     = stats?.total_scans       ?? 0;
  const diseased  = stats?.diseases_detected ?? 0;
  const healthy   = stats?.healthy_count     ?? 0;
  const breakdown = stats?.disease_breakdown ?? {};

  return (
    <div>
      <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Overview</h2>
      <p style={{ color: C.muted, marginBottom: 32 }}>Real-time metrics from your field scans</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Scans"    value={total}    sub="All time"        color={C.green} />
        <StatCard label="Diseases Found" value={diseased} sub="Needs attention" color={C.rust}  />
        <StatCard label="Healthy Plants" value={healthy}  sub="No action needed" color={C.accent} />
        <StatCard label="Detection Rate" value={`${stats?.detection_rate ?? 0}%`} sub="Disease prevalence"
          color={diseased / (total || 1) > 0.5 ? C.red : C.greenDim} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 20, fontSize: 16, fontWeight: 700 }}>Disease Breakdown</h3>
          {Object.entries(breakdown).map(([name, count]) => (
            <ProgressBar key={name} label={name}
              value={total > 0 ? Math.round((count / total) * 100) : 0}
              color={DISEASE_COLORS[name] ?? C.green} />
          ))}
          {Object.keys(breakdown).length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No data yet.</p>}
        </Card>
        <Card>
          <h3 style={{ color: C.text, marginBottom: 20, fontSize: 16, fontWeight: 700 }}>Recent Detections</h3>
          {history.length === 0
            ? <p style={{ color: C.muted, fontSize: 14 }}>No detections yet. Upload images to get started.</p>
            : history.slice(0, 6).map((h) => (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{h.disease}</p>
                  <p style={{ color: C.muted, fontSize: 11 }}>{new Date(h.timestamp).toLocaleString()}</p>
                </div>
                <Badge label={`${h.confidence}%`} color={DISEASE_COLORS[h.disease] ?? C.green} />
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}

// ── Detect (5 images) ──────────────────────────────────────────────────────────
function Detect({ onDetection }) {
  const { C } = useTheme();
  const [dragging, setDragging] = useState(false);
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState(null);
  const inputRef = useRef();

  const addFiles = useCallback((incoming) => {
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const merged = [...prev, ...imgs].slice(0, 5);
      merged.forEach((f, i) => {
        const reader = new FileReader();
        reader.onload = (e) => setPreviews((p) => { const n = [...p]; n[i] = e.target.result; return n; });
        reader.readAsDataURL(f);
      });
      return merged;
    });
    setResults(null); setError(null);
  }, []);

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setResults(null);
  };

  const reset = () => { setFiles([]); setPreviews([]); setResults(null); setError(null); };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };

  const analyze = async () => {
    if (!files.length) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      files.forEach((f, i) => form.append(`image${i}`, f));
      const res = await fetch(`${API}/detect`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Detection failed. Check the backend.");
      const data = await res.json();
      const enriched = data.results.map((r, i) => ({ ...r, previewUrl: previews[i] }));
      setResults(enriched);
      enriched.forEach((r) => onDetection(r));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Detect Disease</h2>
      <p style={{ color: C.muted, marginBottom: 32 }}>Upload up to 5 maize leaf images for batch analysis</p>

      {files.length < 5 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          style={{ border: `2px dashed ${dragging ? C.green : C.border}`, borderRadius: 16, minHeight: 160, marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: dragging ? C.green + "08" : C.inputBg, transition: "all 0.2s" }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌽</div>
          <p style={{ color: C.text, fontWeight: 700, marginBottom: 4 }}>Drop leaf images here</p>
          <p style={{ color: C.muted, fontSize: 13 }}>or click to browse · JPG, PNG, WEBP</p>
          <div style={{ marginTop: 12, background: C.accent + "18", border: `1px solid ${C.accent}44`, borderRadius: 99, padding: "4px 14px" }}>
            <span style={{ color: C.accent, fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{files.length}/5 IMAGES SELECTED</span>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addFiles(Array.from(e.target.files))} />
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: "1", borderRadius: 12, border: `1px solid ${files[i] ? C.green + "55" : C.border}`, background: C.inputBg, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.3s" }}>
              {files[i] ? (
                <>
                  <img src={previews[i]} alt={`Leaf ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 5, left: 6, background: "rgba(0,0,0,0.65)", color: C.accent, fontSize: 10, fontFamily: "'Space Mono', monospace", padding: "2px 6px", borderRadius: 4 }}>#{i + 1}</div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: C.red + "dd", border: "none", color: "white", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </>
              ) : (
                <span style={{ color: C.border, fontSize: 24 }}>+</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={analyze} disabled={!files.length || loading}
          style={{ flex: 1, background: files.length && !loading ? C.green : C.border, color: files.length && !loading ? "#0a0f07" : C.muted, border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 800, fontSize: 15, cursor: files.length && !loading ? "pointer" : "not-allowed", fontFamily: "'Space Mono', monospace", letterSpacing: 1, transition: "all 0.2s" }}>
          {loading ? "Analyzing…" : `Analyze ${files.length || ""} Leaf${files.length !== 1 ? "s" : ""} →`}
        </button>
        {files.length > 0 && !loading && (
          <button onClick={reset} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontSize: 13 }}>Clear All</button>
        )}
        {files.length > 0 && files.length < 5 && !loading && (
          <button onClick={() => inputRef.current.click()} style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontSize: 13 }}>+ Add More</button>
        )}
      </div>

      {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16, background: C.red + "11", padding: "10px 14px", borderRadius: 8 }}>⚠ {error}</p>}

      {loading && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
          <p style={{ color: C.text, fontWeight: 700, marginBottom: 4 }}>Running AI analysis…</p>
          <p style={{ color: C.muted, fontSize: 13 }}>Processing {files.length} image{files.length !== 1 ? "s" : ""}</p>
        </Card>
      )}

      {results && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 24, padding: "16px 24px", background: C.accent + "12", border: `1px solid ${C.accent}33`, borderRadius: 12, flexWrap: "wrap" }}>
            {[
              { label: "SCANNED",  val: results.length, color: C.accent },
              { label: "HEALTHY",  val: results.filter((r) => r.disease === "Healthy").length, color: C.green },
              { label: "DISEASED", val: results.filter((r) => r.disease !== "Healthy").length, color: C.red   },
              { label: "AVG CONF", val: `${Math.round(results.reduce((a, r) => a + r.confidence, 0) / results.length)}%`, color: C.text },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ color: s.color, fontSize: 26, fontWeight: 800, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.val}</p>
                <p style={{ color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {results.map((r, i) => (
            <Card key={r.id} style={{ borderLeft: `3px solid ${DISEASE_COLORS[r.disease] ?? C.green}`, display: "grid", gridTemplateColumns: "80px 1fr", gap: 20, alignItems: "center", padding: 20 }}>
              {r.previewUrl
                ? <img src={r.previewUrl} alt={`Leaf ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
                : <div style={{ width: 80, height: 80, borderRadius: 10, background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🌽</div>}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ color: C.muted, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>#{i + 1} · {r.filename}</span>
                  <Badge label={r.severity} color={DISEASE_COLORS[r.disease] ?? C.green} />
                </div>
                <h4 style={{ color: DISEASE_COLORS[r.disease] ?? C.green, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{r.disease}</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${r.confidence}%`, background: DISEASE_COLORS[r.disease] ?? C.green, borderRadius: 99 }} />
                  </div>
                  <span style={{ color: C.muted, fontSize: 12, fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>{r.confidence}% confidence</span>
                </div>
                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{r.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>💊 Treatment</p>
                    {r.treatment.map((t, j) => <p key={j} style={{ color: C.muted, fontSize: 11, marginBottom: 3 }}>→ {t}</p>)}
                  </div>
                  <div>
                    <p style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🛡 Prevention</p>
                    {r.prevention.map((p, j) => <p key={j} style={{ color: C.muted, fontSize: 11, marginBottom: 3 }}>• {p}</p>)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Diseases ───────────────────────────────────────────────────────────────────
const DISEASES_STATIC = [
  { name: "Northern Leaf Blight", color: "#e67e22", emoji: "🍂",
    description: "Caused by Exserohilum turcicum. Produces long, cigar-shaped gray-green lesions (2.5–15 cm) that mature to tan with dark borders.",
    conditions: "Cool temperatures (18–27°C), high humidity, wet weather",
    impact: "Can reduce yield by 30–50% in severe cases",
    treatment: ["Propiconazole or azoxystrobin fungicides", "Crop rotation", "Resistant hybrids"],
    prevention: ["Scout fields regularly", "Destroy crop debris post-harvest", "Ensure good drainage"] },
  { name: "Fall Armyworm", color: "#c0392b", emoji: "🐛", type: "Pest Infestation",
    description: "Larvae feed aggressively creating irregular 'window pane' holes, ragged leaf edges, and characteristic wet sawdust-like frass in the whorl.",
    conditions: "Warm temperatures (25–35°C), dry spells, high migration periods",
    impact: "Yield losses of 20–73% without timely intervention",
    treatment: ["Apply emamectin benzoate or spinetoram at early infestation", "Biological control using Bt", "Apply neem-based sprays"],
    prevention: ["Early planting before peak moth migration", "Scout whorls twice weekly", "Use push-pull farming strategy"] },
  { name: "Gray Leaf Spot", color: "#6b7280", emoji: "🌫️",
    description: "Caused by Cercospora zeae-maydis. Rectangular gray-tan lesions restricted by veins; visible on both leaf surfaces.",
    conditions: "Warm temperatures (25–30°C), extended leaf wetness, dense canopies",
    impact: "Major yield losses up to 50% in susceptible varieties",
    treatment: ["Strobilurin + triazole fungicides", "Improve drainage", "Reduce canopy density"],
    prevention: ["Crop rotation", "Tillage of surface residue", "GLS-tolerant varieties"] },
  { name: "Leaf Beetle", color: "#d4a017", emoji: "🪲", type: "Pest Infestation",
    description: "Beetles chew long narrow strips between leaf veins giving leaves a characteristic ladder or window pane appearance.",
    conditions: "Warm, dry conditions; crop at V3–V8 growth stage most vulnerable",
    impact: "Yield losses of 10–40%; severe infestations can defoliate entire plants",
    treatment: ["Apply pyrethroid or carbamate insecticides on foliage", "Use neem extract spray", "Remove heavily infested plant material"],
    prevention: ["Crop rotation", "Use insecticide-treated certified seeds", "Scout fields from crop emergence"] },
  { name: "Grasshopper", color: "#7dbd5f", emoji: "🦗", type: "Pest Infestation",
    description: "Extensive defoliation by chewing of leaf margins and blades. Outbreaks can strip entire fields within days.",
    conditions: "Hot, dry seasons; drought stress; field edges near uncultivated land",
    impact: "Complete crop loss possible during mass outbreak events",
    treatment: ["Apply insecticides in early morning", "Use Metarhizium anisopliae biopesticide", "Bait traps with poisoned bran"],
    prevention: ["Clear bush borders around fields", "Early planting before peak season", "Community-level coordinated spraying"] },
  { name: "Streak Virus", color: "#8e44ad", emoji: "🦠", type: "Viral Disease",
    description: "Maize Streak Virus (MSV) transmitted by leafhopper vectors. Shows narrow broken pale yellow-to-white streaks running parallel to leaf veins.",
    conditions: "High leafhopper populations; warm dry weather (24–32°C); young plants most susceptible",
    impact: "Up to 100% yield loss in susceptible varieties when infection occurs at seedling stage",
    treatment: ["Remove and destroy infected seedlings immediately", "Apply insecticide to control leafhopper vector", "Replant with MSV-resistant varieties"],
    prevention: ["Plant MSV-resistant certified varieties", "Use insecticide-treated seeds", "Avoid planting near infected fields"] },
];

function Diseases() {
  const { C } = useTheme();
  const [selected, setSelected] = useState(0);
  const d = DISEASES_STATIC[selected];

  return (
    <div>
      <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Disease Library</h2>
      <p style={{ color: C.muted, marginBottom: 32 }}>Learn about common maize diseases, their causes and management</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
        {DISEASES_STATIC.map((dis, i) => (
          <button key={dis.name} onClick={() => setSelected(i)}
            style={{ background: selected === i ? dis.color + "22" : "transparent", color: selected === i ? dis.color : C.muted, border: `1px solid ${selected === i ? dis.color : C.border}`, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s" }}>
            {dis.emoji} {dis.name}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card style={{ borderColor: d.color + "44" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>{d.emoji}</span>
            <div>
              <h3 style={{ color: d.color, fontSize: 22, fontWeight: 800 }}>{d.name}</h3>
              <p style={{ color: C.muted, fontSize: 12 }}>{d.type ?? "Fungal Disease"}</p>
            </div>
          </div>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{d.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.subBg, borderRadius: 10, padding: 16 }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💊 Treatment</p>
              {d.treatment.map((t, i) => <p key={i} style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>→ {t}</p>)}
            </div>
            <div style={{ background: C.subBg, borderRadius: 10, padding: 16 }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🛡 Prevention</p>
              {d.prevention.map((p, i) => <p key={i} style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>• {p}</p>)}
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Favourable Conditions</p>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{d.conditions}</p>
          </Card>
          <Card>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Economic Impact</p>
            <p style={{ color: d.color, fontSize: 13, fontWeight: 700, lineHeight: 1.8 }}>{d.impact}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────────────────────────────
function History({ history, onClear }) {
  const { C } = useTheme();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800 }}>Scan History</h2>
        {history.length > 0 && (
          <button onClick={onClear} style={{ background: "transparent", color: C.red, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>Clear All</button>
        )}
      </div>
      <p style={{ color: C.muted, marginBottom: 32 }}>All previous disease detections from your field</p>
      {history.length === 0
        ? <Card style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p style={{ color: C.muted }}>No scans yet. Go to Detect to upload your first images.</p>
          </Card>
        : <div style={{ display: "grid", gap: 12 }}>
            {history.map((h, i) => (
              <Card key={h.id + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: DISEASE_COLORS[h.disease] ?? C.green, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{h.disease}</p>
                    <p style={{ color: C.muted, fontSize: 12 }}>{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Badge label={h.severity} color={DISEASE_COLORS[h.disease] ?? C.green} />
                  <span style={{ color: C.text, fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14 }}>{h.confidence}%</span>
                  <span style={{ color: C.muted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>#{h.id}</span>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,    setDark]    = useState(true);
  const [page,    setPage]    = useState("Dashboard");
  const [stats,   setStats]   = useState(null);
  const [history, setHistory] = useState([]);

  const C      = dark ? DARK : LIGHT;
  const toggle = () => setDark((d) => !d);

  const fetchData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        fetch(`${API}/stats`).then((r) => r.json()),
        fetch(`${API}/history`).then((r) => r.json()),
      ]);
      setStats(s); setHistory(h);
    } catch { /* backend offline */ }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [fetchData]);

  const onDetection = (result) => { setHistory((prev) => [result, ...prev.slice(0, 49)]); fetchData(); };
  const onClear = async () => { await fetch(`${API}/history`, { method: "DELETE" }); setHistory([]); fetchData(); };

  const svgStroke = dark ? "#4ade80" : "#16a34a";
  const svgAccent = dark ? "#a3e635" : "#65a30d";

  return (
    <ThemeCtx.Provider value={{ C, dark, toggle }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: 'Fraunces', Georgia, serif; transition: background 0.3s, color 0.3s; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @keyframes drift  { 0%{transform:translateY(0)  rotate(0deg); opacity:0.18} 50%{transform:translateY(-18px) rotate(3deg);  opacity:0.28} 100%{transform:translateY(0)   rotate(0deg); opacity:0.18} }
        @keyframes drift2 { 0%{transform:translateY(0)  rotate(-2deg);opacity:0.12} 50%{transform:translateY(14px)  rotate(2deg);  opacity:0.22} 100%{transform:translateY(0)   rotate(-2deg);opacity:0.12} }
        @keyframes shimmer { 0%{opacity:0.04} 50%{opacity:0.09} 100%{opacity:0.04} }
        .corn-bg { position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden; }
        .corn-bg svg.pattern { position:absolute;inset:0;width:100%;height:100%;animation:shimmer 8s ease-in-out infinite; }
        .corn-bg .blob1 { position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,${dark ? "#4ade8022" : "#16a34a18"} 0%,transparent 70%);top:-120px;left:-80px;animation:drift 12s ease-in-out infinite; }
        .corn-bg .blob2 { position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${dark ? "#a3e63518" : "#65a30d14"} 0%,transparent 70%);bottom:60px;right:80px;animation:drift2 15s ease-in-out infinite; }
        .corn-bg .blob3 { position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,${dark ? "#22c55e14" : "#15803d10"} 0%,transparent 70%);top:45%;left:50%;animation:drift 18s ease-in-out infinite reverse; }
        .corn-bg .stalks { position:absolute;bottom:0;left:0;right:0;animation:drift2 20s ease-in-out infinite; }
        .corn-bg .stalk-top { position:absolute;top:0;right:0;animation:drift 25s ease-in-out infinite;opacity:${dark ? 0.15 : 0.06}; }
        nav button:hover { opacity:0.85; }
      `}</style>

      {/* Animated background */}
      <div className="corn-bg">
        <svg className="pattern" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaf-pat" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 5 Q55 25 40 45 Q25 25 40 5Z" fill="none" stroke={svgStroke} strokeWidth="0.7" opacity="0.5"/>
              <line x1="40" y1="5"  x2="40" y2="45" stroke={svgStroke} strokeWidth="0.4" opacity="0.4"/>
              <line x1="35" y1="15" x2="40" y2="12" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <line x1="33" y1="22" x2="40" y2="19" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <line x1="35" y1="30" x2="40" y2="27" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <line x1="45" y1="15" x2="40" y2="12" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <line x1="47" y1="22" x2="40" y2="19" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <line x1="45" y1="30" x2="40" y2="27" stroke={svgStroke} strokeWidth="0.3" opacity="0.3"/>
              <circle cx="10" cy="65" r="1.5" fill={svgAccent} opacity="0.3"/>
              <circle cx="70" cy="10" r="1"   fill={svgStroke} opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaf-pat)"/>
        </svg>
        <div className="blob1"/><div className="blob2"/><div className="blob3"/>
        <svg className="stalks" viewBox="0 0 1440 220" xmlns="http://www.w3.org/2000/svg" style={{ opacity: dark ? 0.12 : 0.05, height: 220 }}>
          {[0,120,260,400,560,700,850,1000,1150,1300,1420].map((x,i) => (
            <g key={i} transform={`translate(${x},0)`}>
              <line x1="10" y1="220" x2="10" y2="30" stroke={svgStroke} strokeWidth="2"/>
              <path d={`M10 140 Q${i%2===0?35:"-15"} 110 ${i%2===0?50:"-30"} 90`} fill="none" stroke={svgStroke} strokeWidth="1.5"/>
              <path d={`M10 100 Q${i%2===0?"-15":"35"} 70 ${i%2===0?"-30":"50"} 50`} fill="none" stroke={svgStroke} strokeWidth="1.2"/>
              <ellipse cx="10" cy="55" rx="5" ry="14" fill={svgAccent} opacity="0.6"/>
            </g>
          ))}
        </svg>
        <svg className="stalk-top" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style={{ width: 300, height: 400 }}>
          <line x1="260" y1="400" x2="260" y2="20" stroke={svgStroke} strokeWidth="3"/>
          <path d="M260 250 Q310 200 340 150" fill="none" stroke={svgStroke} strokeWidth="2"/>
          <path d="M260 180 Q200 130 170 80"  fill="none" stroke={svgStroke} strokeWidth="2"/>
          <path d="M260 320 Q200 280 160 260" fill="none" stroke={svgStroke} strokeWidth="1.5"/>
          <ellipse cx="258" cy="40" rx="8" ry="22" fill={svgAccent} opacity="0.5"/>
        </svg>
      </div>

      <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* ── Sidebar ── */}
        <nav style={{ width: 220, minHeight: "100vh", background: C.navBg, borderRight: `1px solid ${C.border}`, padding: "32px 20px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0, boxShadow: `2px 0 12px ${C.shadow}`, transition: "background 0.3s, border-color 0.3s" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🌽</span>
              <div>
                <p style={{ color: C.green, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>MaizeGuard</p>
                <p style={{ color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>AI Detection</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <button key={item} onClick={() => setPage(item)}
                style={{ background: page === item ? C.green + "18" : "transparent", color: page === item ? C.green : C.muted, border: `1px solid ${page === item ? C.green + "44" : "transparent"}`, borderRadius: 10, padding: "12px 16px", textAlign: "left", cursor: "pointer", fontWeight: page === item ? 700 : 400, fontSize: 14, fontFamily: "'Fraunces', serif", transition: "all 0.15s" }}>
                {item === "Dashboard" && "◈ "}{item === "Detect" && "⊕ "}{item === "Diseases" && "⊘ "}{item === "History" && "≡ "}{item}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <ThemeToggle />
            <p style={{ color: C.muted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>{stats?.total_scans ?? 0} total scans</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: stats !== null ? C.green : C.rust, display: "inline-block" }} />
              <span style={{ color: C.muted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>{stats !== null ? "API Connected" : "API Offline"}</span>
            </div>
          </div>
        </nav>

        {/* ── Main ── */}
        <main style={{ flex: 1, padding: "40px 48px", maxWidth: 1100, overflowY: "auto", transition: "background 0.3s" }}>
          {page === "Dashboard" && <Dashboard stats={stats} history={history} />}
          {page === "Detect"    && <Detect onDetection={onDetection} />}
          {page === "Diseases"  && <Diseases />}
          {page === "History"   && <History history={history} onClear={onClear} />}
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}
