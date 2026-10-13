from fastapi import FastAPI

app = FastAPI(title="Same-Day Home Premiere API")

@app.get("/api/health")
def health():
    return{"status": "ok"} 