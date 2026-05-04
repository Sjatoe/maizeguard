# Use a Python 3.10 slim image for a smaller footprint
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files (including your .h5 or .keras model)
COPY . .

# Hugging Face Spaces listens on port 7860
EXPOSE 7860

# Command to run your Flask app
CMD ["python", "app.py"]
