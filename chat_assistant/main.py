from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you can restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory
app.mount("/static", StaticFiles(directory="chat_assistant/static"), name="static")

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You're a helpful assistant embedded inside the RVRanger project. This is a luxury RV marketplace with search, favorites, and listing functionality. Help users find, manage, and understand RV listings. Provide information about Prevost luxury coaches, converters like Marathon and Liberty, and different chassis types like H3 and X models."},
                {"role": "user", "content": request.message},
            ]
        )
        reply = response.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/chat-ui", response_class=HTMLResponse)
async def get():
    with open("chat_assistant/static/index.html", "r") as f:
        return f.read()
        
@app.get("/")
async def root():
    return {"message": "RVRanger Chat Assistant API is running. Go to /chat-ui to use the assistant."}