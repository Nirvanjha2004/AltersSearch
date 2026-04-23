import asyncio
from dotenv import load_dotenv
# We need to explicitly import the HuggingFace module here!
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

async def test_dim():
    # This will download the model the first time it runs (~90MB)
    model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # We use aembed_query to test the async generation
    vector = await model.aembed_query("Just testing the dimensions")
    print(f"Bhaii, the dimension size is exactly: {len(vector)}")

asyncio.run(test_dim())