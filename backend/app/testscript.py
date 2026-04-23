import asyncio
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# This line is the magic fix: it loads your GOOGLE_API_KEY from the .env file
load_dotenv()

async def test_dim():
    model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector = await model.aembed_query("Just testing the dimensions")
    print(f"Bhaii, the dimension size is exactly: {len(vector)}")

asyncio.run(test_dim())