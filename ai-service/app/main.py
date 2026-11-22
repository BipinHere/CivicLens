from fastapi import FastAPI

app = FastAPI(
    title = "CivicLens AI Services",
    description = "AI-powered civic issue detection service",
    version="1.0.0"
)
@app.get("/")
def home():
    return{
        "message" : "welcome to CivicLens AI Services",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return{
        "status" : "healthy",
        "service" : "CivicLens AI"
    }