import asyncio
from backend.common.prisma_client import connect, disconnect, prisma

async def main():
    await connect()
    user = await prisma.user.find_first(where={"role": "STUDENT"}, include={"student": {"include": {"program": {"include": {"department": True}}}}})
    if user:
        print(f"User: {user.name} ({user.email})")
        s = user.student
        if s:
            print(f"Student ID: {s.id}")
            print(f"Program: {s.program.name if s.program else None}")
            print(f"Department: {s.program.department.name if s.program and s.program.department else None}")
        else:
            print("No student record.")
    else:
        print("No student found.")
    await disconnect()

asyncio.run(main())
