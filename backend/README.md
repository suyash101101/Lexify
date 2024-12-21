# JusticeChain API

A FastAPI-based backend for the JusticeChain platform using Redis Stack.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv # or python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory:

4. Start Redis Stack:

Install docker desktop and run the following command to start the redis stack:

```bash
cd backend
docker-compose up -d
```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## Redis Insight

Redis Insight UI is available at `http://localhost:8001`. You can use it to:
- Monitor Redis data
- Run queries
- Visualize data structures
- Debug issues

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`
