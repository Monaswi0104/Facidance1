import asyncio
from backend.common.prisma_client import connect, disconnect, prisma, db

async def main():
    await connect()
    try:
        # Get a student to graduate
        student = await prisma.student.find_first(include={"user": True})
        print(f"Student: {student}")
        if student:
            # try to graduate them
            res = await prisma.student.update(
                where={"id": student.id}, data={"status": "graduated"}
            )
            print(f"Update res: {res}")
            
            check = await prisma.student.find_first(where={"id": student.id})
            print(f"After update check: {check.status}")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        await disconnect()

asyncio.run(main())
