from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="Atollom KINEXIS Backend")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "agents": 43,
        "tests": 710,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
