from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Nhost GraphQL (Hasura) connection
NHOST_GRAPHQL_URL = os.environ['NHOST_GRAPHQL_URL']
NHOST_ADMIN_SECRET = os.environ['NHOST_ADMIN_SECRET']

HASURA_HEADERS = {
    "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
    "Content-Type": "application/json",
}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


async def run_graphql(query: str, variables: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            NHOST_GRAPHQL_URL,
            headers=HASURA_HEADERS,
            json={"query": query, "variables": variables},
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            raise Exception(data["errors"])
        return data["data"]


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    mutation = """
        mutation InsertStatusCheck($id: String!, $client_name: String!, $timestamp: timestamptz!) {
            insert_status_checks_one(object: {id: $id, client_name: $client_name, timestamp: $timestamp}) {
                id
            }
        }
    """
    await run_graphql(mutation, {
        "id": status_obj.id,
        "client_name": status_obj.client_name,
        "timestamp": status_obj.timestamp.isoformat(),
    })
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    query = """
        query GetStatusChecks {
            status_checks(order_by: {timestamp: desc}, limit: 1000) {
                id
                client_name
                timestamp
            }
        }
    """
    data = await run_graphql(query, {})
    return [StatusCheck(**row) for row in data["status_checks"]]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
