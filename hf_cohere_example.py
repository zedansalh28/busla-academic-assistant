import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

client = InferenceClient(
    api_key=os.environ.get("HF_TOKEN", "your_hf_token_here"),
)

completion = client.chat.completions.create(
    model="CohereLabs/command-a-reasoning-08-2025:cohere",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
)

print(completion.choices[0].message)
