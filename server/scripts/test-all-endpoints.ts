/**
 * Complete End-to-End API Test Suite for Leads Phone Book API
 * Target: https://api.leadsphonebook.com
 */

const BASE_URL = process.env.TEST_API_URL || "https://api.leadsphonebook.com";

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number | number[];
  success: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  method: string,
  path: string,
  expectedStatus: number | number[],
  options?: {
    body?: any;
    token?: string;
  }
): Promise<{ status: number; data: any }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    const durationMs = Date.now() - start;

    let data: any = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    results.push({
      name,
      endpoint: path,
      method,
      status: res.status,
      expectedStatus,
      success: isExpected,
      durationMs,
      details: isExpected ? undefined : typeof data === "object" ? JSON.stringify(data) : text.slice(0, 150),
    });

    return { status: res.status, data };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({
      name,
      endpoint: path,
      method,
      status: 0,
      expectedStatus,
      success: false,
      durationMs,
      details: err.message,
    });
    return { status: 0, data: null };
  }
}

async function main() {
  console.log("==================================================================");
  console.log(`🚀 Starting Full Production API Verification: ${BASE_URL}`);
  console.log("==================================================================\n");

  const rand = Math.floor(Math.random() * 1000000);
  const testEmail = `apitest-owner-${rand}@leadsphonebook.com`;
  const testPassword = "Password@123";

  let ownerToken = "";
  let refreshToken = "";
  let adminToken = "";
  let businessId = "";
  let serviceId = "";
  let productId = "";
  let promoId = "";
  let storyId = "";
  let leadId = "";
  let callId = "";

  // 0. HEALTH CHECK
  console.log("▶ Group 0: Server Liveness & Infrastructure");
  await runTest("Server Liveness (/health)", "GET", "/health", 200);

  // 1. AUTHENTICATION (Owner & Admin)
  console.log("▶ Group 1: Authentication & Access Control");
  await runTest("Register New Business Owner (/api/auth/register)", "POST", "/api/auth/register", 201, {
    body: {
      name: "API Test Owner",
      email: testEmail,
      password: testPassword,
    },
  });

  const loginRes = await runTest("Login Business Owner (/api/auth/login)", "POST", "/api/auth/login", 200, {
    body: {
      email: testEmail,
      password: testPassword,
    },
  });
  if (loginRes.data?.accessToken) {
    ownerToken = loginRes.data.accessToken;
    refreshToken = loginRes.data.refreshToken;
  }

  await runTest("Get Current User Profile (/api/auth/me)", "GET", "/api/auth/me", 200, {
    token: ownerToken,
  });

  if (refreshToken) {
    await runTest("Rotate Access Token (/api/auth/refresh)", "POST", "/api/auth/refresh", 200, {
      body: { refreshToken },
    });
  }

  await runTest("Forgot Password Request (/api/auth/forgot-password)", "POST", "/api/auth/forgot-password", [200, 204], {
    body: { email: testEmail },
  });

  const adminLoginRes = await runTest("Login System Administrator (/api/auth/login)", "POST", "/api/auth/login", 200, {
    body: {
      email: "admin@leadsphonebook.com",
      password: "Password@123",
    },
  });
  if (adminLoginRes.data?.accessToken) {
    adminToken = adminLoginRes.data.accessToken;
  }

  await runTest("Verify Admin Profile (/api/auth/me)", "GET", "/api/auth/me", 200, {
    token: adminToken,
  });

  // 2. CATEGORIES DIRECTORY
  console.log("▶ Group 2: Categories Directory");
  await runTest("List Categories (/api/categories)", "GET", "/api/categories", 200);

  // 3. BUSINESS PROFILES & WORKFLOW
  console.log("▶ Group 3: Business Profiles & Registration Flow");
  const bizCreate = await runTest("Create Business Profile (/api/businesses)", "POST", "/api/businesses", 201, {
    token: ownerToken,
    body: {
      companyName: `Apex Cloud Systems ${rand}`,
      ownerName: "API Test Owner",
      category: "Technology & SaaS",
      description: "Cloud architecture, cybersecurity, and modern web application development.",
    },
  });
  if (bizCreate.data?.id) {
    businessId = bizCreate.data.id;
  }

  await runTest("Get Own Business Profile (/api/businesses/me)", "GET", "/api/businesses/me", 200, {
    token: ownerToken,
  });

  if (businessId) {
    // Fill all 11 profile fields for 100% completion
    await runTest("Update Profile to 100% (/api/businesses/:id)", "PATCH", `/api/businesses/${businessId}`, 200, {
      token: ownerToken,
      body: {
        companyName: `Apex Cloud Systems ${rand}`,
        ownerName: "API Test Owner",
        category: "Technology & SaaS",
        description: "Cloud architecture, cybersecurity, and modern web application development.",
        phone: "+91 98765 00000",
        email: testEmail,
        website: "https://leadsphonebook.com",
        address: "450 Mission Street, Suite 800",
        city: "San Francisco",
        state: "CA",
        workingHours: [
          { day: "MON", open: "09:00", close: "18:00", closed: false },
          { day: "TUE", open: "09:00", close: "18:00", closed: false },
        ],
      },
    });

    await runTest("Submit Profile for Verification (/api/businesses/:id/submit)", "POST", `/api/businesses/${businessId}/submit`, 200, {
      token: ownerToken,
    });
  }

  // Public business endpoints
  await runTest("Get Approved Public Business (/api/businesses/:id)", "GET", "/api/businesses/00000000-0000-0000-0000-000000000001", 200);
  await runTest("List Public Businesses Directory (/api/businesses)", "GET", "/api/businesses", 200);

  // 4. SOCIAL MEDIA LINKS
  console.log("▶ Group 4: Social Media Integrations");
  if (businessId) {
    await runTest("Upsert Social Links (/api/businesses/:id/social-links)", "PUT", `/api/businesses/${businessId}/social-links`, 200, {
      token: ownerToken,
      body: {
        links: [
          { platform: "FACEBOOK", url: "https://facebook.com/leadsphonebook" },
          { platform: "LINKEDIN", url: "https://linkedin.com/company/leadsphonebook" },
          { platform: "INSTAGRAM", url: "https://instagram.com/leadsphonebook" },
        ],
      },
    });

    await runTest("List Social Links (/api/businesses/:id/social-links)", "GET", `/api/businesses/${businessId}/social-links`, 200);
  }

  // 5. SERVICES & PRODUCTS
  console.log("▶ Group 5: Offerings (Services & Products)");
  if (businessId) {
    const srvRes = await runTest("Create Service (/api/businesses/:id/services)", "POST", `/api/businesses/${businessId}/services`, 201, {
      token: ownerToken,
      body: {
        name: "Enterprise Architecture Audit",
        description: "Comprehensive cloud review and cost optimization.",
        price: 499,
      },
    });
    if (srvRes.data?.id) serviceId = srvRes.data.id;

    await runTest("List Services (/api/businesses/:id/services)", "GET", `/api/businesses/${businessId}/services`, 200);

    if (serviceId) {
      await runTest("Update Service (/api/services/:id)", "PATCH", `/api/services/${serviceId}`, 200, {
        token: ownerToken,
        body: { price: 599 },
      });
    }

    const prdRes = await runTest("Create Product (/api/businesses/:id/products)", "POST", `/api/businesses/${businessId}/products`, 201, {
      token: ownerToken,
      body: {
        name: "Cloud Deployment Gateway",
        description: "Hardened microservice router with rate limiting.",
        price: 1299,
        imageUrl: "https://api.leadsphonebook.com/uploads/sample.png",
      },
    });
    if (prdRes.data?.id) productId = prdRes.data.id;

    await runTest("List Products (/api/businesses/:id/products)", "GET", `/api/businesses/${businessId}/products`, 200);

    if (productId) {
      await runTest("Update Product (/api/products/:id)", "PATCH", `/api/products/${productId}`, 200, {
        token: ownerToken,
        body: { price: 1199 },
      });
    }
  }

  // 6. BUSINESS PROMOTIONS
  console.log("▶ Group 6: Marketing Promotions");
  if (businessId) {
    const promoRes = await runTest("Create Promotion (/api/businesses/:id/promotions)", "POST", `/api/businesses/${businessId}/promotions`, 201, {
      token: ownerToken,
      body: {
        title: "Launch Special: 30% Off Retainer",
        description: "Sign an annual SLA before Friday and save 30% on monthly retainers.",
      },
    });
    if (promoRes.data?.id) promoId = promoRes.data.id;

    await runTest("List Promotions (/api/businesses/:id/promotions)", "GET", `/api/businesses/${businessId}/promotions`, 200);

    if (promoId) {
      await runTest("Get Promotion Detail (/api/promotions/:id)", "GET", `/api/promotions/${promoId}`, 200);
      await runTest("Edit Promotion (/api/promotions/:id)", "PATCH", `/api/promotions/${promoId}`, 200, {
        token: ownerToken,
        body: { title: "Launch Special: 35% Off Retainer" },
      });
    }
  }

  // 7. ADMIN DASHBOARD & APPROVAL WORKFLOW
  console.log("▶ Group 7: Admin Panel Operations");
  if (adminToken) {
    await runTest("Get Admin Dashboard Stats (/api/admin/dashboard/stats)", "GET", "/api/admin/dashboard/stats", 200, {
      token: adminToken,
    });

    await runTest("List Businesses for Review (/api/admin/businesses)", "GET", "/api/admin/businesses?status=PENDING", 200, {
      token: adminToken,
    });

    if (businessId) {
      await runTest("Admin Review Business (/api/admin/businesses/:id)", "GET", `/api/admin/businesses/${businessId}`, 200, {
        token: adminToken,
      });

      await runTest("Approve Business Profile (/api/admin/businesses/:id/approve)", "PATCH", `/api/admin/businesses/${businessId}/approve`, 200, {
        token: adminToken,
      });
    }

    await runTest("List Promotions for Review (/api/admin/promotions)", "GET", "/api/admin/promotions?status=PENDING", 200, {
      token: adminToken,
    });

    if (promoId) {
      await runTest("Approve Promotion (/api/admin/promotions/:id/approve)", "PATCH", `/api/admin/promotions/${promoId}/approve`, 200, {
        token: adminToken,
      });
    }

    await runTest("List User Accounts (/api/admin/users)", "GET", "/api/admin/users", 200, {
      token: adminToken,
    });
  }

  // 8. NOTIFICATIONS ENGINE
  console.log("▶ Group 8: User Notifications");
  await runTest("List User Notifications (/api/notifications)", "GET", "/api/notifications", 200, {
    token: ownerToken,
  });
  await runTest("Mark Notifications Read (/api/notifications/read-all)", "PATCH", "/api/notifications/read-all", [200, 204], {
    token: ownerToken,
  });

  // 9. SEARCH & DIRECTORY FILTERS
  console.log("▶ Group 9: Search & Public Directory");
  await runTest("Search by Query (/api/search/businesses?q=Apex)", "GET", "/api/search/businesses?q=Apex", 200);
  await runTest("Search by Category (/api/search/businesses?category=Technology)", "GET", "/api/search/businesses?category=Technology", 200);

  // 10. SERVER-DRIVEN UI (SDUI) & LEADS PHONEBOOK ENGINE
  console.log("▶ Group 10: Server-Driven UI (SDUI) & Leads Phonebook");
  await runTest("SDUI Bootstrap Payload (/api/phonebook/bootstrap)", "GET", "/api/phonebook/bootstrap", 200, {
    token: ownerToken,
  });

  await runTest("Reference Lookups (/api/phonebook/lookups)", "GET", "/api/phonebook/lookups", 200);

  await runTest("Match Device Contacts (/api/phonebook/match-contacts)", "POST", "/api/phonebook/match-contacts", 200, {
    body: {
      phones: ["+91 98765 43210", "+1 555 123 4567", "+919160091410"],
    },
  });

  const storyRes = await runTest("Post 24h Status Story (/api/phonebook/status)", "POST", "/api/phonebook/status", 201, {
    token: ownerToken,
    body: {
      title: "⚡ Flash Discount: 25% Off Architecture Review",
      description: "Book an enterprise cloud review before Friday and receive 25% off our standard tier.",
      offerBadge: "25% OFF",
      price: "$187",
      gradientStart: "#00236F",
      gradientEnd: "#0051D5",
    },
  });
  if (storyRes.data?.id) storyId = storyRes.data.id;

  if (storyId) {
    await runTest("Record Story View (/api/phonebook/status/:id/view)", "POST", `/api/phonebook/status/${storyId}/view`, 200, {
      token: ownerToken,
    });
  }

  const leadRes = await runTest("Create CRM Lead (/api/phonebook/leads)", "POST", "/api/phonebook/leads", 201, {
    token: ownerToken,
    body: {
      businessName: "BioTech Analytics Inc",
      contactPerson: "Dr. Ronald Evans",
      phone: "+1 555 789 0123",
      email: "r.evans@biotech.example",
      category: "Healthcare & Wellness",
      city: "South San Francisco",
      stageCode: "HOT",
      note: "Urgent HIPAA cloud migration inquiry.",
    },
  });
  if (leadRes.data?.id) leadId = leadRes.data.id;

  if (leadId) {
    await runTest("Update Lead Stage (/api/phonebook/leads/:id/stage)", "PATCH", `/api/phonebook/leads/${leadId}/stage`, 200, {
      token: ownerToken,
      body: { stageCode: "CONVERTED" },
    });
  }

  await runTest("Fetch Call History (/api/phonebook/calls)", "GET", "/api/phonebook/calls", 200);

  const callRes = await runTest("Log Call Record (/api/phonebook/calls)", "POST", "/api/phonebook/calls", 201, {
    token: ownerToken,
    body: {
      name: "Ravi Kumar",
      number: "+91 98765 43210",
      tag: "Client",
      direction: "OUTGOING",
      durationSec: 140,
      isVerified: true,
      isLead: true,
      category: "Professional Services",
    },
  });
  if (callRes.data?.id) callId = callRes.data.id;

  // 11. SAFE CLEANUP (Ensure test records do not pollute production directory)
  console.log("▶ Group 11: Production Cleanup");
  if (promoId) {
    await runTest("Delete Test Promotion", "DELETE", `/api/promotions/${promoId}`, 204, { token: ownerToken });
  }
  if (productId) {
    await runTest("Delete Test Product", "DELETE", `/api/products/${productId}`, 204, { token: ownerToken });
  }
  if (serviceId) {
    await runTest("Delete Test Service", "DELETE", `/api/services/${serviceId}`, 204, { token: ownerToken });
  }
  if (businessId) {
    await runTest("Delete Test Business", "DELETE", `/api/businesses/${businessId}`, 204, { token: ownerToken });
  }
  await runTest("Logout Session (/api/auth/logout)", "POST", "/api/auth/logout", [200, 204], { token: ownerToken });

  // PRINT SUMMARY
  console.log("\n==================================================================");
  console.log("📊 API TEST SUITE SUMMARY RESULTS");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.success ? "✅" : "❌";
    const statusText = `Status: ${r.status} (expected ${JSON.stringify(r.expectedStatus)})`;
    const durText = `${r.durationMs}ms`;
    console.log(`${icon} [${r.method.padEnd(6)}] ${r.endpoint.padEnd(46)} | ${statusText.padEnd(25)} | ${durText}`);
    if (!r.success && r.details) {
      console.log(`   └─ Error Details: ${r.details}`);
    }
    if (r.success) passed++;
    else failed++;
  }

  console.log("==================================================================");
  console.log(`TOTAL ENDPOINTS TESTED : ${results.length}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log(`SUCCESS RATE           : ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
