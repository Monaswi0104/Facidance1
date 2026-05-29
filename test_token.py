import asyncio
import jwt
import os
from backend.common.prisma_client import connect, disconnect, prisma

JWT_SECRET = "3f9b1c2d5e7f8a4b9c0d1e2f3a4b5c6d7e8f9a0b"
JWT_ALGORITHM = "HS256"

async def main():
    await connect()
    user = await prisma.user.find_first(where={"role": "STUDENT"})
    if not user:
        print("No student found")
        return

    import time
    payload = {
        "id": user.id,
        "userId": user.id,
        "role": user.role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(token)
    await disconnect()

asyncio.run(main())
