# 🌽 MaizeGuard

AI-powered maize disease detection. Upload a photo of a maize leaf, get a diagnosis back in seconds.

---

Late or wrong disease diagnosis is one of the leading causes of yield loss in maize farming across sub-Saharan Africa. MaizeGuard is a full-stack web app that uses a trained EfficientNet-B0 modelto classify diseases and pests from leaf images — returning a diagnosis, severity rating, and specific treatment steps without needing an ag ronomist on the ground.

---

## What it detects

Seven conditions, each with severity ratings, descriptions, and treatment guidance:

- **Fall Armyworm** — the most destructive pest in African maize farming
- **Streak Virus** — leafhopper-transmitted, no cure, early detection is everything
- **Leaf Blight** — fungal, spreads fast in humid conditions
- **Leaf Spot** — another fungal one, easy to miss early on
- **Grasshopper** — defoliation risk, especially during outbreak seasons
- **Leaf Beetle** — identifiable by the distinctive vein-parallel stripping pattern
- **Healthy** — sometimes the answer really is "it's fine"

---

## How it works

Upload up to 5 images at once. The Flask backend preprocesses each one — resize to 224×224, normalize to [0,1] — runs it through a Keras CNN, and wraps the result with disease metadata before sending it back as JSON.

```
Image upload → Flask API → Preprocessing → CNN inference → JSON response
                                                ↓
                              disease + confidence + treatment plan
```

---

## Stack

| | |
|---|---|
| ML | TensorFlow / Keras |
| Backend | Python, Flask |
| Image processing | Pillow, NumPy |
| Frontend | React |

---

## Running it locally

```bash
git clone https://github.com/your-username/maizeguard.git
cd maizeguard

python -m venv venv
source venv/bin/activate

pip install flask flask-cors tensorflow pillow numpy

python app.py
```

Runs on `http://localhost:8000`. No model file? It drops into demo mode automatically — still useful for testing the frontend and API.

---

## API

**`POST /detect`** — send images as `multipart/form-data` (`image0` through `image4`)

```json
{
  "results": [
    {
      "id": "a3f9c12b",
      "disease": "Fall Armyworm",
      "confidence": 94.3,
      "severity": "Critical",
      "treatment": ["Apply emamectin benzoate into the whorl", "..."],
      "prevention": ["Early planting before peak moth migration", "..."],
      "timestamp": "2025-05-04T10:22:31.000Z"
    }
  ]
}
```

**`GET /stats`** — total scans, detection rate, disease breakdown  
**`GET /history`** — last 50 scans  
**`DELETE /history`** — wipe the slate

---

## Model

- Input: 224 × 224 RGB
- Output: 7-class softmax
- Format: TensorFlow SavedModel
- Accuracy: *84%*
- Dataset: *1050 images*

---

## What's next

- Swap the in-memory history for a proper database
- GPS tagging to map disease outbreaks by region
- TFLite version for offline mobile use
- Multilingual support for non-English speaking farming communities

---

## License

MIT — use it, build on it.
