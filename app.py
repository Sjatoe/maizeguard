"""
MaizeGuard Backend — Flask API
Run: python app.py
Requires: pip install flask flask-cors onnxruntime pillow numpy
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io, uuid, datetime, os

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # allow React frontend to call this API

# ── In-memory history (replace with a database later) ───────────────────────
scan_history = []

# ── Disease metadata ─────────────────────────────────────────────────────────
# These are the exact class names your model was trained on.
# ⚠ Change this list to match YOUR model's output classes exactly.
CLASS_NAMES = [
    "fall armyworm",
    "grasshopper",
    "healthy",
    "leaf beetle",
    "leaf blight",
    "leaf spot",
    "streak virus",
]

DISEASE_INFO = {
    "fall armyworm": {
        "severity": "Critical",
        "description": "Larvae feed aggressively creating irregular holes and ragged leaf edges with wet sawdust-like frass in the whorl.",
        "treatment": ["Apply emamectin benzoate or spinetoram into the whorl", "Use Bacillus thuringiensis (Bt) biological control", "Apply neem-based sprays as eco-friendly option"],
        "prevention": ["Early planting before peak moth migration", "Scout whorls twice weekly", "Use push-pull intercropping strategy"],
    },
    "grasshopper": {
        "severity": "Moderate",
        "description": "Extensive defoliation by chewing of leaf margins and blades. Outbreaks can strip entire fields within days.",
        "treatment": ["Apply organophosphate or pyrethroid insecticides in early morning", "Use Metarhizium anisopliae biopesticide", "Bait traps with poisoned bran"],
        "prevention": ["Clear bush and grass borders around fields", "Early planting before peak season", "Community-level coordinated spraying programs"],
    },
    "healthy": {
        "severity": "None",
        "description": "No disease detected. The plant appears healthy with no visible symptoms of infection or pest damage.",
        "treatment": ["No treatment required", "Continue regular field monitoring", "Maintain good agricultural practices"],
        "prevention": ["Keep up proper watering schedule", "Maintain balanced nutrient management", "Scout regularly for early detection"],
    },
    "leaf beetle": {
        "severity": "Moderate",
        "description": "Beetles chew long narrow strips between leaf veins, giving leaves a characteristic ladder or window pane appearance.",
        "treatment": ["Apply pyrethroid or carbamate insecticides on foliage", "Use neem extract spray for organic management", "Remove heavily infested plant material"],
        "prevention": ["Crop rotation to break beetle life cycle", "Use insecticide-treated certified seeds", "Scout fields from crop emergence"],
    },
    "leaf blight": {
        "severity": "High",
        "description": "Caused by Exserohilum turcicum. Produces long cigar-shaped gray-green lesions that mature to tan with dark borders.",
        "treatment": ["Apply propiconazole or azoxystrobin fungicide", "Crop rotation with non-host crops", "Remove and destroy infected debris"],
        "prevention": ["Plant resistant hybrids", "Scout fields regularly", "Ensure good drainage and air flow"],
    },
    "leaf spot": {
        "severity": "High",
        "description": "Caused by Cercospora zeae-maydis. Rectangular gray-tan lesions restricted by veins visible on both leaf surfaces.",
        "treatment": ["Apply strobilurin + triazole fungicides", "Improve field drainage", "Reduce canopy density by proper spacing"],
        "prevention": ["Crop rotation", "Tillage of surface residue", "Plant tolerant varieties"],
    },
    "streak virus": {
        "severity": "Critical",
        "description": "Transmitted by leafhopper vectors. Shows narrow broken pale yellow-to-white streaks running parallel to leaf veins.",
        "treatment": ["Remove and destroy infected seedlings immediately", "Apply insecticide to control leafhopper vector", "Replant with MSV-resistant hybrid varieties"],
        "prevention": ["Plant MSV-resistant certified varieties", "Use insecticide-treated seeds", "Avoid planting near infected fields"],
    },
}

# ── Model loading ─────────────────────────────────────────────────────────────
model = None

MODEL_URL = "https://raw.githubusercontent.com/Sjatoe/maizeguard/main/maize_model_v2.onnx"
MODEL_PATH = "maize_model_v2.onnx"

def download_model():
    """Download ONNX model from GitHub if not already present."""
    if os.path.exists(MODEL_PATH):
        print(f"✅ Model already exists at {MODEL_PATH}")
        return True
    try:
        import urllib.request
        print(f"⬇️  Downloading model from GitHub...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print(f"✅ Model downloaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to download model: {e}")
        return False

def load_model():
    """Load the ONNX model."""
    global model
    if not download_model():
        print("⚠  Running in DEMO mode.")
        return
    try:
        import onnxruntime as ort
        model = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
        print(f"✅ ONNX model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")


def preprocess_image(image_bytes):
    """
    EfficientNetB0 preprocessing.
    TF's EfficientNet includes its own normalization internally,
    so we just resize and pass raw 0-255 pixel values.
    """
    IMG_SIZE = (224, 224)

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)

    # EfficientNetB0 in Keras handles normalization internally — pass raw pixels
    # DO NOT divide by 255

    return np.expand_dims(arr, axis=0)  # shape: (1, 224, 224, 3)


def predict_single(image_bytes):
    """
    Run inference on one image. Returns (disease_name, confidence_percent).
    Falls back to a demo/random result if no model is loaded.
    """
    if model is None:
        # ── DEMO MODE (no model loaded) ──────────────────────────────────────
        import random
        disease = random.choice(CLASS_NAMES)
        confidence = round(random.uniform(72, 98), 1)
        return disease, confidence

    # ── REAL INFERENCE (ONNX) ────────────────────────────────────────────────
    tensor = preprocess_image(image_bytes)
    input_name = model.get_inputs()[0].name
    predictions = model.run(None, {input_name: tensor})[0][0]  # shape: (num_classes,)

    # Debug: print all class probabilities
    print("\n🔍 Raw predictions:")
    for i, (name, prob) in enumerate(zip(CLASS_NAMES, predictions)):
        print(f"  [{i}] {name}: {prob*100:.2f}%")

    idx = int(np.argmax(predictions))
    confidence = round(float(predictions[idx]) * 100, 1)
    disease = CLASS_NAMES[idx]
    print(f"✅ Predicted: {disease} ({confidence}%)")
    return disease, confidence


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "MaizeGuard API is running"})


@app.route("/detect", methods=["POST"])
def detect():
    """
    Accepts 1–5 images (fields: image0, image1, … image4).
    Returns a list of prediction results.
    """
    results = []

    # Collect all uploaded images in order
    files = []
    for key in sorted(request.files.keys()):   # image0, image1, …
        files.append(request.files[key])

    if len(files) == 0:
        return jsonify({"error": "No images uploaded"}), 400

    if len(files) > 5:
        return jsonify({"error": "Maximum 5 images allowed"}), 400

    for f in files:
        image_bytes = f.read()
        disease, confidence = predict_single(image_bytes)
        info = DISEASE_INFO.get(disease, DISEASE_INFO["healthy"])

        entry = {
            "id": str(uuid.uuid4())[:8],
            "filename": f.filename,
            "disease": disease,
            "confidence": confidence,
            "severity": info["severity"],
            "description": info["description"],
            "treatment": info["treatment"],
            "prevention": info["prevention"],
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        scan_history.insert(0, entry)   # newest first
        results.append(entry)

    return jsonify({"results": results})


@app.route("/stats", methods=["GET"])
def stats():
    """Returns aggregate stats for the Dashboard."""
    total = len(scan_history)
    diseased = sum(1 for h in scan_history if h["disease"] != "healthy")
    healthy_count = total - diseased

    breakdown = {}
    for h in scan_history:
        breakdown[h["disease"]] = breakdown.get(h["disease"], 0) + 1

    return jsonify({
        "total_scans": total,
        "diseases_detected": diseased,
        "healthy_count": healthy_count,
        "detection_rate": round((diseased / total * 100) if total else 0, 1),
        "disease_breakdown": breakdown,
    })


@app.route("/history", methods=["GET"])
def get_history():
    """Returns last 50 scan records."""
    return jsonify(scan_history[:50])


@app.route("/history", methods=["DELETE"])
def clear_history():
    """Clears all scan history."""
    scan_history.clear()
    return jsonify({"message": "History cleared"})


# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_model()
    print("🌽 MaizeGuard API running at http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
