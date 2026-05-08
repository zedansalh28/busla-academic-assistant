import json
import os
from typing import Dict, List, Any

from fastapi import FastAPI
from pydantic import BaseModel
from huggingface_hub import InferenceClient

from fastapi.middleware.cors import CORSMiddleware

# -----------------------------
# CONFIG
# -----------------------------
HF_API_KEY = os.environ.get("HF_TOKEN", "your_hf_token_here")
MODEL_NAME = "CohereLabs/command-a-reasoning-08-2025:cohere"

client = InferenceClient(api_key=HF_API_KEY)

# -----------------------------
# Load your knowledge base
# -----------------------------
with open("data.json", "r", encoding="utf-8") as f:
    KNOWLEDGE = json.load(f)["content"]

# -----------------------------
# In-memory conversation store
#   key: session_id (string)
#   value: list of messages [{role, content}]
# -----------------------------
conversations: Dict[str, List[Dict[str, Any]]] = {}

# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins; adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str  # some id from frontend (user id, tab id, random UUID, etc.)
    message: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str


# -----------------------------
# Get (or create) conversation
# -----------------------------
def get_conversation(session_id: str) -> List[Dict[str, str]]:
    if session_id not in conversations:
        # Initialize a new conversation with a system message
        system_prompt = f"""
You are a helpful university assistant chatbot.
You answer questions for students based ONLY on the following knowledge.

Knowledge:
{KNOWLEDGE}

If the answer is not found in the knowledge, clearly say: "I don't know based on the available information."
Always be concise and clear.
"""
        conversations[session_id] = [
            {"role": "system", "content": system_prompt.strip()}
        ]
    return conversations[session_id]


# -----------------------------
# Call the model with full history
# -----------------------------
def ask_model(session_id: str, user_message: str) -> str:
    # Get existing conversation or create new one
    history = get_conversation(session_id)

    # Add the new user message
    history.append({"role": "user", "content": user_message})

    # Call the chat.completions API
    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=history,
        max_tokens=300,
        temperature=0.2,
    )

    # Extract assistant reply
    # Cohere-style responses should have choices[0].message["content"]
    answer = completion.choices[0].message["content"]

    # Append assistant reply to history
    history.append({"role": "assistant", "content": answer})

    # Optionally: trim history if it gets too long
    # (keep system + last N turns)
    MAX_TURNS = 20
    # system + last N*2 messages (user+assistant)
    if len(history) > 1 + MAX_TURNS * 2:
        # keep system + last 2*MAX_TURNS messages
        conversations[session_id] = [history[0]] + history[-2 * MAX_TURNS :]

    return answer


# -----------------------------
# API endpoint
# -----------------------------
@app.post("/chat", response_model=str)
def chat(req: ChatRequest):
    answer = ask_model(req.session_id, req.message)
    return answer
