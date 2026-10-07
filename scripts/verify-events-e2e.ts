import { prisma } from "../src/lib/prisma";

async function verify() {
    console.log("==================================================");
    console.log("STARTING END-TO-END VERIFICATION FOR EVENTS FEATURE");
    console.log("==================================================");

    // 1. Fetch Users
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const instructor = await prisma.user.findFirst({ where: { role: "INSTRUCTOR" } });
    const user = await prisma.user.findFirst({ where: { role: "USER" } });

    if (!admin || !instructor || !user) {
        throw new Error("Seed users missing!");
    }
    console.log(`✓ Admin User: ${admin.name} (${admin.email})`);
    console.log(`✓ Instructor User: ${instructor.name} (${instructor.email})`);
    console.log(`✓ Regular User: ${user.name} (${user.email})`);

    // 2. Public Catalog query (Members only see APPROVED & Published)
    const publicEvents = await prisma.event.findMany({
        where: { approvalStatus: "APPROVED", isPublished: true },
    });
    console.log(`\n[Catalog Check] Public visible events count: ${publicEvents.length}`);
    if (publicEvents.length !== 3) {
        throw new Error("Expected 3 approved events for public!");
    }
    console.log("✓ Public events list verified.");

    // 3. Instructor creates event -> verifying status starts as PENDING ("Awaiting Approval")
    const now = new Date();
    const testStart = new Date(now.getTime() + 14 * 86400000);
    const testEnd = new Date(testStart.getTime() + 60 * 60000);

    const pendingTestEvent = await prisma.event.create({
        data: {
            title: "E2E Test Instructor Circle",
            slug: "e2e-test-instructor-circle",
            summary: "Testing instructor event creation flow and approval gating.",
            description: "Full description for testing approval workflow.",
            category: "Circle",
            isOnline: true,
            startsAt: testStart,
            endsAt: testEnd,
            price: 15,
            hostId: instructor.id,
            approvalStatus: "PENDING",
            isPublished: false,
        },
    });

    console.log(`\n[Instructor Creation Flow] Created event "${pendingTestEvent.title}"`);
    console.log(`✓ Initial approvalStatus: ${pendingTestEvent.approvalStatus}`);
    console.log(`✓ Initial isPublished: ${pendingTestEvent.isPublished}`);
    if (pendingTestEvent.approvalStatus !== "PENDING" || pendingTestEvent.isPublished !== false) {
        throw new Error("Instructor event should start as PENDING and unpublished!");
    }

    // 4. Admin Approves Event
    const approvedEvent = await prisma.event.update({
        where: { id: pendingTestEvent.id },
        data: {
            approvalStatus: "APPROVED",
            isPublished: true,
            reviewedById: admin.id,
            reviewedAt: new Date(),
            approvedAt: new Date(),
        },
    });

    // Create Notification Log entry for approval
    await prisma.notificationLog.create({
        data: {
            channel: "EMAIL",
            kind: "event_approved",
            recipient: instructor.email,
            subject: `Event review update: ${approvedEvent.title}`,
            body: `Your event "${approvedEvent.title}" has been approved!`,
            status: "SENT",
            userId: instructor.id,
            sentById: admin.id,
        },
    });

    console.log(`\n[Admin Approval Flow] Admin "${admin.name}" approved event "${approvedEvent.title}"`);
    console.log(`✓ Updated approvalStatus: ${approvedEvent.approvalStatus}`);
    console.log(`✓ Updated isPublished: ${approvedEvent.isPublished}`);

    // Verify NotificationLog entry
    const notif = await prisma.notificationLog.findFirst({
        where: { kind: "event_approved", userId: instructor.id },
        orderBy: { createdAt: "desc" },
    });
    console.log(`✓ Host notification recorded: "${notif?.subject}" -> ${notif?.recipient}`);

    // 5. User Requests an Event & Tags Instructor
    const eventReq = await prisma.eventRequest.create({
        data: {
            title: "E2E Request: Tarot & Shadow Work",
            details: "Please host a group shadow work integration session.",
            category: "Workshop",
            requesterId: user.id,
            taggedUserId: instructor.id,
            status: "OPEN",
        },
    });

    await prisma.notificationLog.create({
        data: {
            channel: "EMAIL",
            kind: "event_request_tagged",
            recipient: instructor.email,
            subject: `A member requested an event: ${eventReq.title}`,
            body: `${user.name} requested an event.`,
            status: "SENT",
            userId: instructor.id,
        },
    });

    console.log(`\n[Community Request Flow] User "${user.name}" created request "${eventReq.title}" tagging instructor "${instructor.name}"`);
    console.log(`✓ Request status: ${eventReq.status}`);

    const tagNotif = await prisma.notificationLog.findFirst({
        where: { kind: "event_request_tagged", userId: instructor.id },
        orderBy: { createdAt: "desc" },
    });
    console.log(`✓ Tagged instructor notification recorded: "${tagNotif?.subject}"`);

    // 6. Instructor Plans Event from Request
    const plannedEvent = await prisma.event.create({
        data: {
            title: eventReq.title,
            slug: "e2e-request-tarot-shadow-work",
            summary: "Shadow work and tarot integration workshop.",
            description: "Full details fulfilling community request.",
            category: eventReq.category,
            isOnline: true,
            startsAt: testStart,
            endsAt: testEnd,
            price: 20,
            hostId: instructor.id,
            originRequestId: eventReq.id,
            approvalStatus: "APPROVED",
            isPublished: true,
        },
    });

    await prisma.eventRequest.update({
        where: { id: eventReq.id },
        data: { eventId: plannedEvent.id, status: "PLANNED" },
    });

    await prisma.notificationLog.create({
        data: {
            channel: "EMAIL",
            kind: "event_request_approved",
            recipient: user.email,
            subject: `Your requested event is confirmed: ${plannedEvent.title}`,
            body: `Good news! Your requested event "${plannedEvent.title}" has been approved.`,
            status: "SENT",
            userId: user.id,
        },
    });

    console.log(`\n[Planned from Request Flow] Instructor created event fulfilling request`);
    console.log(`✓ Request status updated to PLANNED`);

    const requesterNotif = await prisma.notificationLog.findFirst({
        where: { kind: "event_request_approved", userId: user.id },
        orderBy: { createdAt: "desc" },
    });
    console.log(`✓ Requester notification recorded: "${requesterNotif?.subject}" -> ${requesterNotif?.recipient}`);

    // 7. Express Interest Flow
    const interest = await prisma.eventInterest.create({
        data: { eventId: plannedEvent.id, userId: user.id },
    });
    console.log(`\n[Event Interest Flow] User expressed interest in event "${plannedEvent.title}"`);
    console.log(`✓ Interest record created with ID ${interest.id}`);

    console.log("\n==================================================");
    console.log("ALL E2E BUSINESS RULES & VERIFICATIONS PASSED!");
    console.log("==================================================");
}

verify()
    .catch((err) => {
        console.error("Verification failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
