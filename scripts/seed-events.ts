import { prisma } from "../src/lib/prisma";

async function seed() {
    console.log("Seeding Events demo data...");

    // Find host instructor and admin users
    const aria = await prisma.user.findFirst({ where: { email: "instructor@aibootcamp.dev" } });
    const devan = await prisma.user.findFirst({ where: { email: "dr.devan@aibootcamp.dev" } });
    const elena = await prisma.user.findFirst({ where: { email: "elena.sol@aibootcamp.dev" } });
    const admin = await prisma.user.findFirst({ where: { email: "admin@aibootcamp.dev" } });
    const seeker = await prisma.user.findFirst({ where: { email: "user@aibootcamp.dev" } });
    const standardUser = await prisma.user.findFirst({ where: { email: "user@user.com" } });

    if (!aria || !devan || !elena || !admin || !seeker) {
        console.error("Required seed users not found!");
        return;
    }

    // Clean existing events, requests, interests
    await prisma.eventInterest.deleteMany();
    await prisma.eventRequest.deleteMany();
    await prisma.event.deleteMany();

    console.log("Cleared existing events & requests.");

    const now = new Date();

    // 1. Approved Event 1 (Aria Vale - Webinar - Free - Online)
    const starts1 = new Date(now.getTime() + 2 * 86400000);
    starts1.setHours(19, 0, 0, 0);
    const ends1 = new Date(starts1.getTime() + 90 * 60000);

    const event1 = await prisma.event.create({
        data: {
            title: "Solstice Solar Gateway & Transits 2026",
            slug: "solstice-solar-gateway-transits-2026",
            summary: "Explore the major planetary transits and portal activations of the upcoming season with live chart breakdowns.",
            description: "Join Senior Astrologer Aria Vale for an illuminating evening exploring the celestial alignments shaping the months ahead.\n\nIn this live webinar, we will cover:\n- Jupiter in Cancer & Saturn in Aries shifts\n- Personal chart impact and house transits\n- Guided meditation and solar alignment ritual\n\nQ&A and open discussion included.",
            category: "Webinar",
            isOnline: true,
            meetingUrl: "https://zoom.us/j/9876543210",
            startsAt: starts1,
            endsAt: ends1,
            capacity: 200,
            price: 0,
            hostId: aria.id,
            approvalStatus: "APPROVED",
            isPublished: true,
            reviewedById: admin.id,
            approvedAt: now,
        },
    });

    // 2. Approved Event 2 (Elena Sol - Circle - In Person - Paid)
    const starts2 = new Date(now.getTime() + 5 * 86400000);
    starts2.setHours(18, 30, 0, 0);
    const ends2 = new Date(starts2.getTime() + 120 * 60000);

    const event2 = await prisma.event.create({
        data: {
            title: "Sacred Temple Sound Bath & Kundalini Circle",
            slug: "sacred-temple-sound-bath-kundalini-circle",
            summary: "Immerse in crystal singing bowls, breathwork, and sacred chant for energetic purification.",
            description: "Step into our candlelit sanctuary for an evening of deep healing, vibrational realignment, and collective circle ritual led by Elena Sol.\n\nPlease wear comfortable white or light-colored attire and bring a sacred item for the central altar.",
            category: "Circle",
            isOnline: false,
            location: "AI Bootcamp Sanctuary, 452 Celestial Way, New York, NY",
            startsAt: starts2,
            endsAt: ends2,
            capacity: 30,
            price: 45,
            hostId: elena.id,
            approvalStatus: "APPROVED",
            isPublished: true,
            reviewedById: admin.id,
            approvedAt: now,
        },
    });

    // 3. Approved Event 3 (Dr. Devan Anand - Workshop - Paid)
    const starts3 = new Date(now.getTime() + 8 * 86400000);
    starts3.setHours(17, 0, 0, 0);
    const ends3 = new Date(starts3.getTime() + 180 * 60000);

    const event3 = await prisma.event.create({
        data: {
            title: "Akashic Records & Karmic Astrology Intensive",
            slug: "akashic-records-karmic-astrology-intensive",
            summary: "Learn techniques to read soul contracts, nodal axis placements, and karmic patterns in birth charts.",
            description: "A comprehensive 3-hour intensive with Dr. Devan Anand bridging Vedic astrology, Rahu/Ketu dynamics, and soul record retrieval.\n\nIncludes workbook, lifetime recording access, and practical exercises.",
            category: "Workshop",
            isOnline: true,
            meetingUrl: "https://zoom.us/j/1234567890",
            startsAt: starts3,
            endsAt: ends3,
            capacity: 50,
            price: 75,
            hostId: devan.id,
            approvalStatus: "APPROVED",
            isPublished: true,
            reviewedById: admin.id,
            approvedAt: now,
        },
    });

    // 4. PENDING Event (Aria Vale - Awaiting Admin Approval)
    const starts4 = new Date(now.getTime() + 12 * 86400000);
    starts4.setHours(20, 0, 0, 0);
    const ends4 = new Date(starts4.getTime() + 60 * 60000);

    const pendingEvent = await prisma.event.create({
        data: {
            title: "New Moon Magic & Manifestation Ritual",
            slug: "new-moon-magic-manifestation-ritual",
            summary: "Set powerful intentions under the upcoming New Moon with guided visualization and planetary magic.",
            description: "A special online gathering for intention setting and planetary magic aligned with the New Moon degree.",
            category: "Circle",
            isOnline: true,
            meetingUrl: "https://zoom.us/j/5554443332",
            startsAt: starts4,
            endsAt: ends4,
            capacity: 100,
            price: 25,
            hostId: aria.id,
            approvalStatus: "PENDING",
            isPublished: false,
        },
    });

    // 5. Community Requests
    const request1 = await prisma.eventRequest.create({
        data: {
            title: "Vedic Nakshatra Deep Dive & Remedies Workshop",
            details: "Would love a specialized workshop focusing on calculating Nakshatra padas and planetary mantras for career and health remedies.",
            category: "Workshop",
            proposedDate: new Date(now.getTime() + 15 * 86400000),
            requesterId: seeker.id,
            taggedUserId: devan.id,
            status: "OPEN",
        },
    });

    const request2 = await prisma.eventRequest.create({
        data: {
            title: "Full Moon Ecstatic Dance & Sound Journey",
            details: "Can we have an in-person gathering for the next Full Moon combining breathwork, movement, and sound bath?",
            category: "Retreat",
            proposedDate: new Date(now.getTime() + 20 * 86400000),
            requesterId: seeker.id,
            taggedUserId: elena.id,
            status: "OPEN",
        },
    });

    // 6. Seed Interests
    await prisma.eventInterest.createMany({
        data: [
            { eventId: event1.id, userId: seeker.id },
            { eventId: event1.id, userId: standardUser?.id || seeker.id },
            { eventId: event2.id, userId: seeker.id },
            { eventId: event3.id, userId: seeker.id },
        ],
    });

    console.log("Successfully seeded demo events & requests!");
    console.log(`- Created 3 APPROVED events: [${event1.title}, ${event2.title}, ${event3.title}]`);
    console.log(`- Created 1 PENDING event: [${pendingEvent.title}]`);
    console.log(`- Created 2 Community Requests: [${request1.title}, ${request2.title}]`);
}

seed()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
