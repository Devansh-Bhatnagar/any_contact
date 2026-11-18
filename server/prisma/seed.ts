import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting reproducible database seed...");

  // 1. Reference Lookups (Zero hardcoding - all lookup values stored in DB)
  await prisma.referenceLookup.deleteMany({
    where: { group: { in: ["NAVIGATION_TAB", "CALL_FILTER"] } },
  });

  const lookups = [
    // Honorifics
    { group: "HONORIFIC", code: "MR", label: "Mr.", sortOrder: 1, isDefault: true },
    { group: "HONORIFIC", code: "MS", label: "Ms.", sortOrder: 2, isDefault: false },
    { group: "HONORIFIC", code: "MRS", label: "Mrs.", sortOrder: 3, isDefault: false },
    { group: "HONORIFIC", code: "DR", label: "Dr.", sortOrder: 4, isDefault: false },
    { group: "HONORIFIC", code: "PROF", label: "Prof.", sortOrder: 5, isDefault: false },

    // Business Categories
    { group: "CATEGORY", code: "TECH_SAAS", label: "Technology & SaaS", sortOrder: 1, isDefault: false },
    { group: "CATEGORY", code: "PROF_SERVICES", label: "Professional Services", sortOrder: 2, isDefault: false },
    { group: "CATEGORY", code: "HOSPITALITY_FOOD", label: "Hospitality & Food", sortOrder: 3, isDefault: false },
    { group: "CATEGORY", code: "LOGISTICS_SUPPLY", label: "Logistics & Supply", sortOrder: 4, isDefault: false },
    { group: "CATEGORY", code: "REAL_ESTATE", label: "Real Estate", sortOrder: 5, isDefault: false },
    { group: "CATEGORY", code: "HEALTHCARE", label: "Healthcare & Wellness", sortOrder: 6, isDefault: false },
    { group: "CATEGORY", code: "RETAIL", label: "Retail & E-commerce", sortOrder: 7, isDefault: false },
    { group: "CATEGORY", code: "MANUFACTURING", label: "Manufacturing", sortOrder: 8, isDefault: false },

    // Lead Pipeline Stages
    {
      group: "LEAD_STAGE",
      code: "NEW",
      label: "New Lead",
      sortOrder: 1,
      isDefault: true,
      meta: { badgeColor: "#1E3A8A", icon: "sparkles", tag: "✨ New Lead" },
    },
    {
      group: "LEAD_STAGE",
      code: "IN_CONTACT",
      label: "In Contact",
      sortOrder: 2,
      isDefault: false,
      meta: { badgeColor: "#0051D5", icon: "hourglass", tag: "⏳ In Contact" },
    },
    {
      group: "LEAD_STAGE",
      code: "HOT",
      label: "Hot Prospect",
      sortOrder: 3,
      isDefault: false,
      meta: { badgeColor: "#F59E0B", icon: "fire", tag: "🔥 Hot Lead" },
    },
    {
      group: "LEAD_STAGE",
      code: "CONVERTED",
      label: "Converted",
      sortOrder: 4,
      isDefault: false,
      meta: { badgeColor: "#10B981", icon: "check_circle", tag: "✅ Converted" },
    },

    // Navigation Tabs Metadata (Recents, Keypad, Contacts, Hub)
    {
      group: "NAVIGATION_TAB",
      code: "RECENTS",
      label: "Recents",
      sortOrder: 1,
      isDefault: true,
      meta: { icon: "access_time", route: "/recents", headerTitle: "Leads Phone Book" },
    },
    {
      group: "NAVIGATION_TAB",
      code: "KEYPAD",
      label: "Keypad",
      sortOrder: 2,
      isDefault: false,
      meta: { icon: "dialpad", route: "/keypad", headerTitle: "Phone Keypad" },
    },
    {
      group: "NAVIGATION_TAB",
      code: "CONTACTS",
      label: "Contacts",
      sortOrder: 3,
      isDefault: false,
      meta: { icon: "person_outline", route: "/contacts", headerTitle: "Contacts Directory" },
    },
    {
      group: "NAVIGATION_TAB",
      code: "HUB",
      label: "Hub",
      sortOrder: 4,
      isDefault: false,
      meta: { icon: "grid_view", route: "/hub", headerTitle: "Business Hub" },
    },

    // Call Log Filters
    { group: "CALL_FILTER", code: "ALL_CALLS", label: "All Calls", sortOrder: 1, isDefault: true },
    { group: "CALL_FILTER", code: "MISSED", label: "Missed (2)", sortOrder: 2, isDefault: false },
    { group: "CALL_FILTER", code: "LEADS", label: "Business Leads", sortOrder: 3, isDefault: false },
    { group: "CALL_FILTER", code: "VIP", label: "VIP Contacts", sortOrder: 4, isDefault: false },
  ];

  for (const item of lookups) {
    await prisma.referenceLookup.upsert({
      where: { group_code: { group: item.group, code: item.code } },
      update: {
        label: item.label,
        sortOrder: item.sortOrder,
        isDefault: item.isDefault,
        meta: item.meta ?? undefined,
      },
      create: {
        group: item.group,
        code: item.code,
        label: item.label,
        sortOrder: item.sortOrder,
        isDefault: item.isDefault,
        meta: item.meta ?? undefined,
      },
    });
  }
  console.log(`✅ Seeded ${lookups.length} ReferenceLookups`);

  // 2. Server-Driven UI Component Configuration (SDUI)
  const uiConfigs = [
    {
      screenKey: "PHONE_BOOK",
      componentKey: "SEARCH_BAR",
      type: "search_input",
      title: "Search Bar",
      sortOrder: 1,
      props: {
        placeholder: "Search businesses, contacts, phone...",
        enabled: true,
      },
    },
    {
      screenKey: "PHONE_BOOK",
      componentKey: "STORIES_CAROUSEL",
      type: "stories_carousel",
      title: "24h Business Stories",
      sortOrder: 2,
      props: {
        showMyStatus: true,
        ringColorActive: "#25D366",
        ringColorViewed: "#C5C5D3",
      },
    },
    {
      screenKey: "PHONE_BOOK",
      componentKey: "CATEGORY_FILTER_CHIPS",
      type: "filter_chips",
      title: "Category Filters",
      sortOrder: 3,
      props: {
        includeAllOption: true,
        allOptionLabel: "All",
        hotLeadsFilterLabel: "🔥 Hot Leads",
      },
    },
    {
      screenKey: "PHONE_BOOK",
      componentKey: "CONTACTS_LIST",
      type: "contacts_directory",
      title: "Verified Businesses",
      sortOrder: 4,
      props: {
        enableCallAction: true,
        enableWhatsAppAction: true,
        emptyStateTitle: "No matching businesses found",
        emptyStateSubtitle: "Try searching another name, category, or number",
      },
    },
    {
      screenKey: "STATUS",
      componentKey: "MY_STATUS_CARD",
      type: "my_status_card",
      title: "My Status",
      sortOrder: 1,
      props: {
        subtitlePrompt: "Tap to post a 24h business deal or update",
        allowCameraUpload: true,
        allowTextStatus: true,
      },
    },
    {
      screenKey: "STATUS",
      componentKey: "RECENT_UPDATES_SECTION",
      type: "status_section",
      title: "RECENT BUSINESS UPDATES",
      sortOrder: 2,
      props: { filter: "UNVIEWED" },
    },
    {
      screenKey: "STATUS",
      componentKey: "VIEWED_UPDATES_SECTION",
      type: "status_section",
      title: "VIEWED UPDATES",
      sortOrder: 3,
      props: { filter: "VIEWED" },
    },
    {
      screenKey: "LEADS",
      componentKey: "PIPELINE_KPI_BANNER",
      type: "kpi_banner",
      title: "BUSINESS PIPELINE & LEADS",
      sortOrder: 1,
      props: {
        subtitle: "Manage & Convert Prospects",
        metrics: ["total", "hot", "inContact", "won"],
      },
    },
    {
      screenKey: "BUSINESS_HUB",
      componentKey: "DIGITAL_VISITING_CARD",
      type: "digital_card",
      title: "Verified Business Card",
      sortOrder: 1,
      props: {
        enableQrCode: true,
        enableWhatsAppShare: true,
        shareMessageTemplate:
          "Here is my verified business card for {companyName}:\nOwner: {ownerName}\nCategory: {category}\nPhone: {phone}\nEmail: {email}\nVerified on Leads Phone Book.",
      },
    },
    {
      screenKey: "BUSINESS_HUB",
      componentKey: "ANALYTICS_GRID",
      type: "analytics_grid",
      title: "Business Performance",
      sortOrder: 2,
      props: {
        cards: [
          { key: "profileViews", title: "Profile Views", icon: "visibility" },
          { key: "statusViews", title: "Status Views", icon: "donut_large" },
          { key: "phoneCalls", title: "Phone Calls", icon: "phone" },
          { key: "whatsAppChats", title: "WhatsApp Chats", icon: "chat" },
        ],
      },
    },
    // RECENTS SCREEN SDUI COMPONENTS (Pixel-perfect Server Driven UI)
    {
      screenKey: "RECENTS",
      componentKey: "SEARCH_BAR",
      type: "search_bar",
      title: "Recents Search",
      sortOrder: 1,
      props: {
        placeholder: "Search contacts, business or number",
        hasMic: true,
        hasGrid: true,
      },
    },
    {
      screenKey: "RECENTS",
      componentKey: "QUICK_TILES_ROW_1",
      type: "quick_tiles_row",
      title: "Quick Actions Row 1",
      sortOrder: 2,
      props: {
        tiles: [
          { title: "Scan", subtitle: "Expiry", icon: "qr_code_scanner", action: "SCAN_EXPIRY" },
          { title: "Talking", subtitle: "Calendar", icon: "calendar_month", action: "TALKING_CALENDAR" },
        ],
      },
    },
    {
      screenKey: "RECENTS",
      componentKey: "FEATURED_BANNER",
      type: "featured_banner",
      title: "Featured Promotional Status",
      sortOrder: 3,
      props: {
        title: "Digital Marketing",
        subtitle: "Grow Your Business Smarter",
        icon: "play_arrow",
        action: "DIGITAL_MARKETING",
      },
    },
    {
      screenKey: "RECENTS",
      componentKey: "QUICK_TILES_ROW_2",
      type: "quick_tiles_row",
      title: "Quick Actions Row 2",
      sortOrder: 4,
      props: {
        tiles: [
          { title: "Contacts", subtitle: null, icon: "person_outline", action: "NAVIGATE_CONTACTS" },
          { title: "Business", subtitle: null, icon: "storefront", action: "NAVIGATE_BUSINESS" },
        ],
      },
    },
    {
      screenKey: "RECENTS",
      componentKey: "RECENT_CALLS_HEADER",
      type: "section_header",
      title: "Recent Calls Header",
      sortOrder: 5,
      props: {
        title: "Recent Calls",
        badgeText: "5 New",
        actionText: "View All >",
      },
    },
    {
      screenKey: "RECENTS",
      componentKey: "CALL_FILTERS",
      type: "filter_chips",
      title: "Call Filters",
      sortOrder: 6,
      props: {
        defaultFilter: "ALL_CALLS",
      },
    },
  ];

  for (const config of uiConfigs) {
    await prisma.uiComponentConfig.upsert({
      where: { screenKey_componentKey: { screenKey: config.screenKey, componentKey: config.componentKey } },
      update: {
        type: config.type,
        title: config.title,
        sortOrder: config.sortOrder,
        props: config.props,
        isEnabled: true,
      },
      create: {
        screenKey: config.screenKey,
        componentKey: config.componentKey,
        type: config.type,
        title: config.title,
        sortOrder: config.sortOrder,
        props: config.props,
        isEnabled: true,
      },
    });
  }
  console.log(`✅ Seeded ${uiConfigs.length} UiComponentConfigs`);

  // 3. Demo Admin and Primary Business Owner User
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@leadsphonebook.com" },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: "admin@leadsphonebook.com",
      name: "Leads Phone Book Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: "alex.chen@leadsphonebook.com" },
    update: {},
    create: {
      email: "alex.chen@leadsphonebook.com",
      name: "Alex Chen",
      passwordHash,
      role: "BUSINESS_OWNER",
    },
  });

  const primaryBusiness = await prisma.business.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      ownerId: ownerUser.id,
      companyName: "Apex Cloud Solutions",
      ownerName: "Alex Chen",
      category: "Technology & SaaS",
      description: "Cloud infrastructure, cybersecurity, and modern web application development.",
      phone: "+1 555 123 4567",
      email: "alex.chen@apexcloud.io",
      website: "https://apexcloud.example.com",
      address: "450 Mission St, Suite 800",
      city: "San Francisco",
      state: "CA",
      status: "APPROVED",
      verified: true,
      profileCompletionPercent: 100,
    },
  });

  // Seed sample active 24h status stories
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.statusStory.deleteMany({ where: { businessId: primaryBusiness.id } });
  await prisma.statusStory.create({
    data: {
      businessId: primaryBusiness.id,
      title: "⚡ Flash Offer: 25% Off Architecture Review",
      description: "Book an enterprise cloud architecture audit before Friday and receive 25% off our standard tier.",
      offerBadge: "25% OFF",
      price: "$187",
      gradientStart: "#00236F",
      gradientEnd: "#0051D5",
      viewsCount: 42,
      expiresAt: tomorrow,
    },
  });

  // 4. Seed Verified Businesses with Contact Info and Active Status Stories
  const seedBusinesses = [
    {
      companyName: "GreenLeaf Organic Cafe",
      ownerName: "Marcus Miller",
      category: "Hospitality & Food",
      phone: "+1 555 876 5432",
      email: "hello@greenleafcafe.com",
      address: "120 Market Street",
      city: "San Francisco",
      state: "CA",
      story: {
        title: "🥗 Corporate Lunch Box Packages Available",
        description: "Fresh farm-to-table lunch boxes delivered directly to your office. Group orders over 10 get 15% off.",
        offerBadge: "15% OFF TEAMS",
        price: "$14/box",
        gradientStart: "#004A31",
        gradientEnd: "#10B981",
        viewsCount: 65,
      },
    },
    {
      companyName: "Vanguard Legal Partners",
      ownerName: "David Sterling",
      category: "Professional Services",
      phone: "+1 555 345 6789",
      email: "d.sterling@vanguardlaw.com",
      address: "777 Silicon Valley Blvd",
      city: "San Jose",
      state: "CA",
      story: {
        title: "⚖️ Free Startup Legal Compliance Check",
        description: "Ensure your commercial contracts, NDA, and IP assignments are investor-ready.",
        offerBadge: "FREE CONSULT",
        gradientStart: "#312E81",
        gradientEnd: "#6366F1",
        viewsCount: 29,
      },
    },
    {
      companyName: "Nordic Logistics & Freight",
      ownerName: "Elena Rostova",
      category: "Logistics & Supply",
      phone: "+1 555 901 2345",
      email: "ops@nordiclogistics.com",
      address: "3200 Port of Oakland Way",
      city: "Oakland",
      state: "CA",
      story: {
        title: "📦 New Warehousing Capacity Open",
        description: "20,000 sq ft temperature-controlled facility ready for immediate inventory staging.",
        offerBadge: "INSTANT QUOTE",
        gradientStart: "#0F172A",
        gradientEnd: "#334155",
        viewsCount: 52,
      },
    },
    {
      companyName: "Zenith Design & Marketing",
      ownerName: "Priya Sharma",
      category: "Professional Services",
      phone: "+1 555 456 7890",
      email: "priya@zenithcreative.agency",
      address: "88 Battery St, 4th Floor",
      city: "San Francisco",
      state: "CA",
      story: null,
    },
    {
      companyName: "Horizon Real Estate Group",
      ownerName: "Robert Vance",
      category: "Real Estate",
      phone: "+1 555 567 8901",
      email: "robert@horizonestates.com",
      address: "250 University Ave",
      city: "Palo Alto",
      state: "CA",
      story: null,
    },
  ];

  for (const b of seedBusinesses) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: {
        email: b.email,
        name: b.ownerName,
        passwordHash,
        role: "BUSINESS_OWNER",
      },
    });

    const biz = await prisma.business.upsert({
      where: { id: `seed-${b.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}` },
      update: {
        companyName: b.companyName,
        ownerName: b.ownerName,
        category: b.category,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city,
        state: b.state,
        status: "APPROVED",
        verified: true,
      },
      create: {
        id: `seed-${b.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        ownerId: user.id,
        companyName: b.companyName,
        ownerName: b.ownerName,
        category: b.category,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city,
        state: b.state,
        status: "APPROVED",
        verified: true,
        profileCompletionPercent: 100,
      },
    });

    if (b.story) {
      await prisma.statusStory.deleteMany({ where: { businessId: biz.id } });
      await prisma.statusStory.create({
        data: {
          businessId: biz.id,
          title: b.story.title,
          description: b.story.description,
          offerBadge: b.story.offerBadge,
          price: b.story.price,
          gradientStart: b.story.gradientStart,
          gradientEnd: b.story.gradientEnd,
          viewsCount: b.story.viewsCount,
          expiresAt: tomorrow,
        },
      });
    }
  }
  console.log(`✅ Seeded ${seedBusinesses.length} verified businesses & stories`);

  // 5. Seed Leads Pipeline for the user
  const leads = [
    {
      businessName: "Acme BioTech Inc",
      contactPerson: "Dr. Ronald Evans",
      phone: "+1 555 789 0123",
      email: "r.evans@acmebiotech.example",
      category: "Healthcare & Wellness",
      city: "South San Francisco",
      stageCode: "HOT",
      note: "Urgent HIPAA cloud migration contract. Proposal sent yesterday.",
    },
    {
      businessName: "Metro Hospitality Group",
      contactPerson: "Claire Underwood",
      phone: "+1 555 890 1234",
      email: "claire@metrohg.example",
      category: "Hospitality & Food",
      city: "San Francisco",
      stageCode: "IN_CONTACT",
      note: "Discussed point-of-sale IoT setup. Follow up scheduled for Tuesday.",
    },
    {
      businessName: "Pacific Retailers Co",
      contactPerson: "Samuel Kim",
      phone: "+1 555 901 3456",
      email: "sam@pacificretail.example",
      category: "Retail & E-commerce",
      city: "Oakland",
      stageCode: "CONVERTED",
      note: "Onboarded as managed support client under \$499 monthly retainer.",
    },
    {
      businessName: "Bay Logistics Network",
      contactPerson: "Tomas Gomez",
      phone: "+1 555 012 4567",
      email: "tomas@baylogistics.example",
      category: "Logistics & Supply",
      city: "Hayward",
      stageCode: "NEW",
      note: "Inbound inquiry via Leads Phone Book search directory.",
    },
  ];

  await prisma.lead.deleteMany({ where: { ownerId: ownerUser.id } });
  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        ownerId: ownerUser.id,
        businessName: lead.businessName,
        contactPerson: lead.contactPerson,
        phone: lead.phone,
        email: lead.email,
        category: lead.category,
        city: lead.city,
        stageCode: lead.stageCode,
        note: lead.note,
      },
    });
  }
  console.log(`✅ Seeded ${leads.length} CRM Leads`);

  // 6. Seed Recent Call Records (Strict DB seeding - zero hardcoding in app)
  await prisma.callRecord.deleteMany();
  const seedCallRecords = [
    {
      id: "call-rec-001",
      name: "Ravi Kumar",
      number: "+91 98765 43210",
      tag: "Client",
      tagColor: "#EBF3FE",
      direction: "OUTGOING",
      durationSec: 140,
      isVerified: false,
      isLead: true,
      category: "Professional Services",
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    },
    {
      id: "call-rec-002",
      name: "Marketing Team",
      number: "+91 98765 43211",
      tag: "Internal",
      tagColor: "#F3E8FF",
      direction: "INCOMING",
      durationSec: 320,
      isVerified: false,
      isLead: false,
      category: "Internal Operations",
      timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 min ago
    },
    {
      id: "call-rec-003",
      name: "Lakshmi",
      number: "+91 98765 43212",
      tag: null,
      tagColor: null,
      direction: "MISSED",
      durationSec: 0,
      isVerified: true,
      isLead: false,
      category: "Retail & E-commerce",
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "call-rec-004",
      name: "Supplier",
      number: "+91 98765 43213",
      tag: "Vendor",
      tagColor: "#E6FFFA",
      direction: "OUTGOING",
      durationSec: 85,
      isVerified: false,
      isLead: false,
      category: "Logistics & Supply",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: "call-rec-005",
      name: "Kalyan",
      number: "+91 98765 43214",
      tag: null,
      tagColor: null,
      direction: "INCOMING",
      durationSec: 210,
      isVerified: false,
      isLead: false,
      category: "Technology & SaaS",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  ];

  for (const c of seedCallRecords) {
    await prisma.callRecord.create({ data: c });
  }
  console.log(`✅ Seeded ${seedCallRecords.length} Call Records`);

  // 7. Seed Areas and Pin Codes
  await prisma.area.deleteMany();
  const seedAreas = [
    { name: "Indiranagar", city: "Bengaluru", pincode: "560038", state: "Karnataka" },
    { name: "Koramangala", city: "Bengaluru", pincode: "560034", state: "Karnataka" },
    { name: "HSR Layout", city: "Bengaluru", pincode: "560102", state: "Karnataka" },
    { name: "Whitefield", city: "Bengaluru", pincode: "560066", state: "Karnataka" },
    { name: "Jayanagar", city: "Bengaluru", pincode: "560041", state: "Karnataka" },
    { name: "Mission District", city: "San Francisco", pincode: "94103", state: "CA" },
    { name: "SoMa", city: "San Francisco", pincode: "94107", state: "CA" },
  ];
  for (const a of seedAreas) {
    await prisma.area.create({ data: a });
  }
  console.log(`✅ Seeded ${seedAreas.length} Areas & Pin Codes`);

  // 8. Seed Category Quick Replies (WhatsApp Business style)
  await prisma.categoryQuickReply.deleteMany();
  const seedQuickReplies = [
    {
      category: "Services",
      questionText: "How can we help you today?",
      options: [
        "Book an immediate service / inspection",
        "Check service pricing and rates",
        "Emergency repair needed right away",
        "Schedule appointment for later",
        "Share address / location for home visit",
      ],
      sortOrder: 1,
    },
    {
      category: "Retail & E-commerce",
      questionText: "Welcome! What are you looking to buy today?",
      options: [
        "Check product availability in store",
        "Inquire about today's special offers / discounts",
        "Home delivery options & timeline",
        "Request product catalog / photos",
        "Store working hours & directions",
      ],
      sortOrder: 2,
    },
    {
      category: "Hospitality & Food",
      questionText: "Hungry? How can we serve you?",
      options: [
        "View today's special menu",
        "Table reservation inquiry",
        "Takeaway / Parcel order",
        "Catering for party or event",
        "Check today's chef specials",
      ],
      sortOrder: 3,
    },
    {
      category: "Professional Services",
      questionText: "How can our consultants assist your business?",
      options: [
        "Schedule a consultation call",
        "Request quote / proposal",
        "Document review / compliance check",
        "Check active service retainers",
      ],
      sortOrder: 4,
    },
  ];
  for (const qr of seedQuickReplies) {
    await prisma.categoryQuickReply.create({ data: qr });
  }
  console.log(`✅ Seeded ${seedQuickReplies.length} Category Quick Replies`);

  // 9. Seed Sample Customer User with Notification Preferences
  const customerUser = await prisma.user.upsert({
    where: { email: "priya.customer@leadsphonebook.com" },
    update: {},
    create: {
      email: "priya.customer@leadsphonebook.com",
      name: "Priya Sharma",
      phone: "+91 98765 12345",
      area: "Indiranagar",
      pincode: "560038",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  await prisma.customerNotificationPreference.upsert({
    where: { userId: customerUser.id },
    update: {
      area: "Indiranagar",
      pincode: "560038",
      offersEnabled: true,
      statusUpdatesEnabled: true,
      openCloseAlertsEnabled: true,
    },
    create: {
      userId: customerUser.id,
      area: "Indiranagar",
      pincode: "560038",
      offersEnabled: true,
      statusUpdatesEnabled: true,
      openCloseAlertsEnabled: true,
    },
  });
  console.log("✅ Seeded Customer User & Area Notification Preferences");

  // 10. Update primary business with area, googleMapsUrl, workingHours, and special offers
  await prisma.business.update({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    data: {
      area: "Indiranagar",
      pincode: "560038",
      statusLine: "Enterprise cloud architecture & 24/7 technical support",
      googleMapsUrl: "https://maps.google.com/?q=12.9784,77.6408",
      workingHours: {
        monday: { open: "09:00", close: "19:00", isClosed: false },
        tuesday: { open: "09:00", close: "19:00", isClosed: false },
        wednesday: { open: "09:00", close: "19:00", isClosed: false },
        thursday: { open: "09:00", close: "19:00", isClosed: false },
        friday: { open: "09:00", close: "19:00", isClosed: false },
        saturday: { open: "10:00", close: "16:00", isClosed: false },
        sunday: { open: "10:00", close: "14:00", isClosed: true },
      },
      verified: true,
      quickReplies: [
        "Book enterprise cloud architecture audit",
        "Request DevOps consultation",
        "Emergency server downtime support",
        "Check monthly managed service plans",
      ],
    },
  });

  // Seed Special Offers for primary business
  await prisma.specialOffer.deleteMany({ where: { businessId: "00000000-0000-0000-0000-000000000001" } });
  await prisma.specialOffer.create({
    data: {
      businessId: "00000000-0000-0000-0000-000000000001",
      title: "Holiday Cloud Migration Package",
      description: "Free architecture assessment and $500 cloud credits on enterprise migrations.",
      discountCode: "HOLIDAY2026",
      discountPercent: 25,
      offerBadge: "25% OFF",
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Active for 2 weeks
      isActive: true,
    },
  });

  // Seed sample plumber business in Indiranagar for Services test
  const plumberUser = await prisma.user.upsert({
    where: { email: "rajesh.plumbing@leadsphonebook.com" },
    update: {},
    create: {
      email: "rajesh.plumbing@leadsphonebook.com",
      name: "Rajesh Kumar",
      phone: "+91 98765 88888",
      passwordHash,
      role: "BUSINESS_OWNER",
    },
  });

  const plumberBiz = await prisma.business.upsert({
    where: { id: "seed-apex-plumber-indiranagar" },
    update: {
      description: "Licensed professional plumber providing fast 30-minute doorstep plumbing, leak detection, and sanitary fitting.",
      statusLine: "Available for emergency plumbing visits 24/7",
      area: "Indiranagar",
      pincode: "560038",
      verified: true,
      status: "APPROVED",
    },
    create: {
      id: "seed-apex-plumber-indiranagar",
      ownerId: plumberUser.id,
      companyName: "Apex Plumbing & Home Care",
      ownerName: "Rajesh Kumar",
      category: "Services",
      description: "Licensed professional plumber providing fast 30-minute doorstep plumbing, leak detection, and sanitary fitting.",
      phone: "+91 98765 88888",
      email: "rajesh.plumbing@leadsphonebook.com",
      address: "84 100 Feet Road",
      city: "Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      statusLine: "Available for emergency plumbing visits 24/7",
      googleMapsUrl: "https://maps.google.com/?q=12.9716,77.6412",
      workingHours: {
        monday: { open: "08:00", close: "22:00", isClosed: false },
        tuesday: { open: "08:00", close: "22:00", isClosed: false },
        wednesday: { open: "08:00", close: "22:00", isClosed: false },
        thursday: { open: "08:00", close: "22:00", isClosed: false },
        friday: { open: "08:00", close: "22:00", isClosed: false },
        saturday: { open: "08:00", close: "22:00", isClosed: false },
        sunday: { open: "09:00", close: "21:00", isClosed: false },
      },
      status: "APPROVED",
      verified: true,
      profileCompletionPercent: 100,
      quickReplies: [
        "Need emergency plumber right now",
        "Pipe leakage / tap repair inquiry",
        "Water heater / geyser installation",
        "Schedule inspection visit",
        "Share location for home visit",
      ],
    },
  });

  // Seed reviews with business reply
  await prisma.businessReview.deleteMany({ where: { businessId: plumberBiz.id } });
  await prisma.businessReview.create({
    data: {
      businessId: plumberBiz.id,
      customerId: customerUser.id,
      customerName: "Customer P. #1234",
      rating: 5,
      comment: "Prompt service within 25 minutes! Fixed our kitchen sink leak cleanly.",
      businessReply: "Thank you for trusting Apex Plumbing! Glad we could help promptly.",
      repliedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  // Seed sample chat conversation between customer and plumber
  await prisma.businessChatConversation.deleteMany({
    where: { businessId: plumberBiz.id, customerId: customerUser.id },
  });
  const convo = await prisma.businessChatConversation.create({
    data: {
      businessId: plumberBiz.id,
      customerId: customerUser.id,
      customerMaskedPhone: "+91 98•••• ••345",
      customerDisplayName: "Customer P. #1234",
      lastMessageText: "📍 Shared Location: 12th Main Rd, Indiranagar",
      lastMessageAt: new Date(),
    },
  });

  await prisma.businessChatMessage.createMany({
    data: [
      {
        conversationId: convo.id,
        senderType: "CUSTOMER",
        senderId: customerUser.id,
        messageType: "QUICK_REPLY",
        text: "Need emergency plumber right now",
        quickReplyOption: "Need emergency plumber right now",
        read: true,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        conversationId: convo.id,
        senderType: "BUSINESS",
        senderId: plumberUser.id,
        messageType: "TEXT",
        text: "Hello! Our technician is nearby 100 Feet Road. Please share your exact location.",
        read: true,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        conversationId: convo.id,
        senderType: "CUSTOMER",
        senderId: customerUser.id,
        messageType: "LOCATION",
        text: "📍 Shared Location: 12th Main Rd, Indiranagar",
        latitude: 12.9784,
        longitude: 77.6408,
        locationAddress: "12th Main Rd, Indiranagar, Bengaluru",
        locationMapUrl: "https://maps.google.com/?q=12.9784,77.6408",
        read: true,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
  });
  console.log("✅ Seeded Reviews, Quick Replies, and Chat Conversation with Location Share");

  console.log("✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

