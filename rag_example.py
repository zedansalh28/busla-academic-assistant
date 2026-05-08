import os
from huggingface_hub import InferenceClient
import numpy as np

# Direct API key assignment (reference style)
HF_TOKEN = os.environ.get("HF_TOKEN", "your_hf_token_here")

# Load and split your TXT file into chunks
with open("sample.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Simple split by lines (for demo); for real use, split by paragraphs or sentences
chunks = [line.strip() for line in text.split("\n") if line.strip()]

# Use Hugging Face InferenceClient for embeddings
embedding_model = "sentence-transformers/all-MiniLM-L6-v2"  # You can change to any available embedding model
client = InferenceClient(api_key=HF_TOKEN)

def get_embedding(text):
    # The InferenceClient feature_extraction endpoint returns a list of floats (embedding)
    return client.feature_extraction(text, model=embedding_model)

# Get embeddings for all chunks
embeddings = [get_embedding(chunk) for chunk in chunks]

def find_most_similar_chunk(query_embedding, chunk_embeddings):
    similarities = [np.dot(query_embedding, emb) for emb in chunk_embeddings]
    idx = int(np.argmax(similarities))
    return chunks[idx]

user_question = input("Ask your question: ")
query_emb = get_embedding(user_question)
relevant_chunk = find_most_similar_chunk(query_emb, embeddings)

# Use the relevant chunk as context for the chat model (reference style)
completion = client.chat.completions.create(
    model="CohereLabs/command-a-reasoning-08-2025:cohere",
    messages=[
        {
            "role": "system",
            "content": f"Use this context to answer: {relevant_chunk}"
        },
        {
            "role": "user",
            "content": user_question
        }
    ],
)

print(completion.choices[0].message.content)
