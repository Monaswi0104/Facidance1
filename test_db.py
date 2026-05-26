import asyncio
import sys
sys.path.insert(0, ".")

async def run():
    from backend.common.prisma_client import prisma
    await prisma.connect()

    # Check total attendance records
    total = await prisma.attendance.count()
    print(f"Total attendance records in DB: {total}")

    # Recent 10 attendance records
    recent = await prisma.attendance.find_many(
        take=10,
        order={"timestamp": "desc"},
        include={"student": {"include": {"user": True}}, "course": True},
    )
    print(f"\nRecent {len(recent)} attendance records:")
    for r in recent:
        print(f"  - [{r.course.name}] {r.student.user.name} | status={r.status} | ts={r.timestamp}")

    # Check distinct dates per course
    courses = await prisma.course.find_many()
    for c in courses:
        course_att = await prisma.attendance.find_many(where={"courseId": c.id})
        dates = {str(a.timestamp)[:10] for a in course_att}
        present_count = sum(1 for a in course_att if a.status)
        print(f"\nCourse: {c.name} (id={c.id[:8]}...)")
        print(f"  Total records: {len(course_att)}, Present: {present_count}")
        print(f"  Distinct dates: {sorted(dates)}")

    await prisma.disconnect()

asyncio.run(run())
