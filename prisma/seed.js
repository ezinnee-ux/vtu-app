const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Nigerian VTU platform database...");

  // 1. Seed Networks
  const networksData = [
    {
      name: "MTN",
      code: "mtn",
      logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg",
      airtimeDiscountPercent: 2.0,
      isActive: true,
    },
    {
      name: "Airtel",
      code: "airtel",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Airtel_logo.svg/1200px-Airtel_logo.svg.png",
      airtimeDiscountPercent: 2.0,
      isActive: true,
    },
    {
      name: "Glo",
      code: "glo",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Glo_button.png/600px-Glo_button.png",
      airtimeDiscountPercent: 2.5,
      isActive: true,
    },
    {
      name: "9mobile",
      code: "9mobile",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/9mobile_Logo.png",
      airtimeDiscountPercent: 2.0,
      isActive: true,
    },
  ];

  const networkMap = {};
  for (const net of networksData) {
    const existing = await prisma.network.findUnique({ where: { code: net.code } });
    if (!existing) {
      const created = await prisma.network.create({ data: net });
      networkMap[net.code] = created.id;
    } else {
      networkMap[net.code] = existing.id;
    }
  }

  // 2. Comprehensive Data Plans across categories: Daily, 2-Day, 3-Day, Weekly, Biweekly, Monthly, 2-Month, 3-Month
  const dataPlans = [
    // --- MTN PLANS ---
    { networkCode: "mtn", planCode: "mtn-100mb-1d", name: "MTN 100MB Daily", category: "DAILY", dataSize: "100MB", validity: "1 Day", providerCost: 90, adminMargin: 20 },
    { networkCode: "mtn", planCode: "mtn-1gb-1d", name: "MTN 1GB Daily", category: "DAILY", dataSize: "1GB", validity: "1 Day", providerCost: 280, adminMargin: 40 },
    { networkCode: "mtn", planCode: "mtn-2gb-2d", name: "MTN 2GB 2-Day", category: "2_DAY", dataSize: "2GB", validity: "2 Days", providerCost: 550, adminMargin: 50 },
    { networkCode: "mtn", planCode: "mtn-1.2gb-3d", name: "MTN 1.2GB 3-Day", category: "3_DAY", dataSize: "1.2GB", validity: "3 Days", providerCost: 470, adminMargin: 40 },
    { networkCode: "mtn", planCode: "mtn-1.5gb-7d", name: "MTN 1.5GB Weekly", category: "WEEKLY", dataSize: "1.5GB", validity: "7 Days", providerCost: 920, adminMargin: 80 },
    { networkCode: "mtn", planCode: "mtn-6gb-7d", name: "MTN 6GB Weekly", category: "WEEKLY", dataSize: "6GB", validity: "7 Days", providerCost: 1400, adminMargin: 100 },
    { networkCode: "mtn", planCode: "mtn-5gb-14d", name: "MTN 5GB Biweekly", category: "BIWEEKLY", dataSize: "5GB", validity: "14 Days", providerCost: 1850, adminMargin: 150 },
    { networkCode: "mtn", planCode: "mtn-1.5gb-30d", name: "MTN 1.5GB Monthly", category: "MONTHLY", dataSize: "1.5GB", validity: "30 Days", providerCost: 950, adminMargin: 70 },
    { networkCode: "mtn", planCode: "mtn-2.5gb-30d", name: "MTN 2.5GB Monthly", category: "MONTHLY", dataSize: "2.5GB", validity: "30 Days", providerCost: 1400, adminMargin: 100 },
    { networkCode: "mtn", planCode: "mtn-5gb-30d", name: "MTN 5GB Monthly", category: "MONTHLY", dataSize: "5GB", validity: "30 Days", providerCost: 2350, adminMargin: 150 },
    { networkCode: "mtn", planCode: "mtn-10gb-30d", name: "MTN 10GB Monthly", category: "MONTHLY", dataSize: "10GB", validity: "30 Days", providerCost: 4100, adminMargin: 200 },
    { networkCode: "mtn", planCode: "mtn-20gb-30d", name: "MTN 20GB Monthly", category: "MONTHLY", dataSize: "20GB", validity: "30 Days", providerCost: 7200, adminMargin: 300 },
    { networkCode: "mtn", planCode: "mtn-100gb-60d", name: "MTN 100GB 2-Month", category: "2_MONTH", dataSize: "100GB", validity: "60 Days", providerCost: 28000, adminMargin: 1000 },
    { networkCode: "mtn", planCode: "mtn-160gb-90d", name: "MTN 160GB 3-Month", category: "3_MONTH", dataSize: "160GB", validity: "90 Days", providerCost: 46000, adminMargin: 1500 },

    // --- AIRTEL PLANS ---
    { networkCode: "airtel", planCode: "airtel-1gb-1d", name: "Airtel 1GB Daily", category: "DAILY", dataSize: "1GB", validity: "1 Day", providerCost: 275, adminMargin: 45 },
    { networkCode: "airtel", planCode: "airtel-2gb-2d", name: "Airtel 2GB 2-Day", category: "2_DAY", dataSize: "2GB", validity: "2 Days", providerCost: 540, adminMargin: 60 },
    { networkCode: "airtel", planCode: "airtel-1.5gb-7d", name: "Airtel 1.5GB Weekly", category: "WEEKLY", dataSize: "1.5GB", validity: "7 Days", providerCost: 900, adminMargin: 100 },
    { networkCode: "airtel", planCode: "airtel-3gb-7d", name: "Airtel 3GB Weekly", category: "WEEKLY", dataSize: "3GB", validity: "7 Days", providerCost: 1350, adminMargin: 120 },
    { networkCode: "airtel", planCode: "airtel-1.5gb-30d", name: "Airtel 1.5GB Monthly", category: "MONTHLY", dataSize: "1.5GB", validity: "30 Days", providerCost: 930, adminMargin: 90 },
    { networkCode: "airtel", planCode: "airtel-3gb-30d", name: "Airtel 3GB Monthly", category: "MONTHLY", dataSize: "3GB", validity: "30 Days", providerCost: 1800, adminMargin: 150 },
    { networkCode: "airtel", planCode: "airtel-10gb-30d", name: "Airtel 10GB Monthly", category: "MONTHLY", dataSize: "10GB", validity: "30 Days", providerCost: 3950, adminMargin: 250 },
    { networkCode: "airtel", planCode: "airtel-20gb-30d", name: "Airtel 20GB Monthly", category: "MONTHLY", dataSize: "20GB", validity: "30 Days", providerCost: 7100, adminMargin: 400 },
    { networkCode: "airtel", planCode: "airtel-120gb-60d", name: "Airtel 120GB 2-Month", category: "2_MONTH", dataSize: "120GB", validity: "60 Days", providerCost: 29000, adminMargin: 1000 },
    { networkCode: "airtel", planCode: "airtel-200gb-90d", name: "Airtel 200GB 3-Month", category: "3_MONTH", dataSize: "200GB", validity: "90 Days", providerCost: 48000, adminMargin: 2000 },

    // --- GLO PLANS ---
    { networkCode: "glo", planCode: "glo-1gb-1d", name: "Glo 1GB Special Daily", category: "DAILY", dataSize: "1GB", validity: "1 Day", providerCost: 240, adminMargin: 40 },
    { networkCode: "glo", planCode: "glo-2gb-2d", name: "Glo 2GB 2-Day", category: "2_DAY", dataSize: "2GB", validity: "2 Days", providerCost: 480, adminMargin: 50 },
    { networkCode: "glo", planCode: "glo-1.25gb-3d", name: "Glo 1.25GB 3-Day", category: "3_DAY", dataSize: "1.25GB", validity: "3 Days", providerCost: 450, adminMargin: 50 },
    { networkCode: "glo", planCode: "glo-3.5gb-7d", name: "Glo 3.5GB Weekly", category: "WEEKLY", dataSize: "3.5GB", validity: "7 Days", providerCost: 1100, adminMargin: 100 },
    { networkCode: "glo", planCode: "glo-2.5gb-30d", name: "Glo 2.5GB Monthly", category: "MONTHLY", dataSize: "2.5GB", validity: "30 Days", providerCost: 1150, adminMargin: 100 },
    { networkCode: "glo", planCode: "glo-5.8gb-30d", name: "Glo 5.8GB Monthly", category: "MONTHLY", dataSize: "5.8GB", validity: "30 Days", providerCost: 2200, adminMargin: 150 },
    { networkCode: "glo", planCode: "glo-12gb-30d", name: "Glo 12GB Monthly", category: "MONTHLY", dataSize: "12GB", validity: "30 Days", providerCost: 3600, adminMargin: 250 },
    { networkCode: "glo", planCode: "glo-75gb-60d", name: "Glo 75GB 2-Month", category: "2_MONTH", dataSize: "75GB", validity: "60 Days", providerCost: 17500, adminMargin: 800 },
    { networkCode: "glo", planCode: "glo-150gb-90d", name: "Glo 150GB 3-Month", category: "3_MONTH", dataSize: "150GB", validity: "90 Days", providerCost: 35000, adminMargin: 1500 },

    // --- 9MOBILE PLANS ---
    { networkCode: "9mobile", planCode: "9mob-1gb-1d", name: "9mobile 1GB Daily", category: "DAILY", dataSize: "1GB", validity: "1 Day", providerCost: 280, adminMargin: 40 },
    { networkCode: "9mobile", planCode: "9mob-2gb-3d", name: "9mobile 2GB 3-Day", category: "3_DAY", dataSize: "2GB", validity: "3 Days", providerCost: 590, adminMargin: 60 },
    { networkCode: "9mobile", planCode: "9mob-2gb-7d", name: "9mobile 2GB Weekly", category: "WEEKLY", dataSize: "2GB", validity: "7 Days", providerCost: 950, adminMargin: 90 },
    { networkCode: "9mobile", planCode: "9mob-4.5gb-30d", name: "9mobile 4.5GB Monthly", category: "MONTHLY", dataSize: "4.5GB", validity: "30 Days", providerCost: 1900, adminMargin: 150 },
    { networkCode: "9mobile", planCode: "9mob-11gb-30d", name: "9mobile 11GB Monthly", category: "MONTHLY", dataSize: "11GB", validity: "30 Days", providerCost: 3800, adminMargin: 250 },
    { networkCode: "9mobile", planCode: "9mob-40gb-30d", name: "9mobile 40GB Monthly", category: "MONTHLY", dataSize: "40GB", validity: "30 Days", providerCost: 9600, adminMargin: 450 },
    { networkCode: "9mobile", planCode: "9mob-75gb-60d", name: "9mobile 75GB 2-Month", category: "2_MONTH", dataSize: "75GB", validity: "60 Days", providerCost: 23500, adminMargin: 1000 },
    { networkCode: "9mobile", planCode: "9mob-100gb-90d", name: "9mobile 100GB 3-Month", category: "3_MONTH", dataSize: "100GB", validity: "90 Days", providerCost: 32000, adminMargin: 1500 },
  ];

  for (const plan of dataPlans) {
    const networkId = networkMap[plan.networkCode];
    if (!networkId) continue;
    const sellingPrice = plan.providerCost + plan.adminMargin;

    await prisma.dataPlan.upsert({
      where: { planCode: plan.planCode },
      update: {
        networkId,
        name: plan.name,
        category: plan.category,
        dataSize: plan.dataSize,
        validity: plan.validity,
        providerCost: plan.providerCost,
        adminMargin: plan.adminMargin,
        sellingPrice,
      },
      create: {
        networkId,
        planCode: plan.planCode,
        name: plan.name,
        category: plan.category,
        dataSize: plan.dataSize,
        validity: plan.validity,
        providerCost: plan.providerCost,
        adminMargin: plan.adminMargin,
        sellingPrice,
        isActive: true,
      },
    });
  }

  // 3. Seed Admin & Demo Customer Users
  const salt = await bcrypt.genSalt(10);

  // Admin User
  const adminPasswordHash = await bcrypt.hash("AdminSecure2026!", salt);
  const admin = await prisma.user.upsert({
    where: { email: "admin@quickvtu.ng" },
    update: {},
    create: {
      name: "VTU Admin Manager",
      email: "admin@quickvtu.ng",
      phone: "08011223344",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      wallet: {
        create: {
          balance: 250000.0,
          currency: "NGN",
        },
      },
    },
    include: { wallet: true },
  });

  // Demo User
  const userPasswordHash = await bcrypt.hash("UserPass2026!", salt);
  const demoUser = await prisma.user.upsert({
    where: { email: "user@quickvtu.ng" },
    update: {},
    create: {
      name: "Chukwudi Eze",
      email: "user@quickvtu.ng",
      phone: "08031234567",
      passwordHash: userPasswordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
      wallet: {
        create: {
          balance: 18500.0,
          currency: "NGN",
        },
      },
    },
    include: { wallet: true },
  });

  // Seed Saved Numbers for Demo User
  const mtnNetId = networkMap["mtn"];
  const airtelNetId = networkMap["airtel"];
  const gloNetId = networkMap["glo"];

  if (demoUser && mtnNetId) {
    const existingSaved = await prisma.savedNumber.findFirst({
      where: { userId: demoUser.id },
    });
    if (!existingSaved) {
      await prisma.savedNumber.createMany({
        data: [
          { userId: demoUser.id, networkId: mtnNetId, phoneNumber: "08031234567", name: "My Primary MTN" },
          { userId: demoUser.id, networkId: airtelNetId, phoneNumber: "08029988776", name: "Mum's Airtel" },
          { userId: demoUser.id, networkId: gloNetId, phoneNumber: "08055443322", name: "Office Wi-Fi Router" },
        ],
      });
    }

    // Seed Sample Recent Transactions for Demo User
    const existingOrders = await prisma.order.findFirst({
      where: { userId: demoUser.id },
    });
    if (!existingOrders && mtnNetId) {
      const order1 = await prisma.order.create({
        data: {
          reference: "VTU-20260918-91823742",
          userId: demoUser.id,
          type: "DATA",
          networkId: mtnNetId,
          phoneNumber: "08031234567",
          amount: 1020,
          costPrice: 950,
          profit: 70,
          status: "SUCCESSFUL",
          paymentMethod: "WALLET",
          transaction: {
            create: {
              reference: "TXN-MTN-DATA-91823742",
              providerReference: "VTUPROV-88291039",
              status: "SUCCESSFUL",
              apiResponse: JSON.stringify({ status: "success", code: 200, message: "Data topped up successfully" }),
            },
          },
        },
      });

      const order2 = await prisma.order.create({
        data: {
          reference: "VTU-20260917-48201948",
          userId: demoUser.id,
          type: "AIRTIME",
          networkId: mtnNetId,
          phoneNumber: "08031234567",
          amount: 2000,
          costPrice: 1960,
          profit: 40,
          status: "SUCCESSFUL",
          paymentMethod: "WALLET",
          transaction: {
            create: {
              reference: "TXN-MTN-AIR-48201948",
              providerReference: "VTUPROV-77192033",
              status: "SUCCESSFUL",
              apiResponse: JSON.stringify({ status: "success", code: 200, message: "Airtime credited" }),
            },
          },
        },
      });

      // Sample Wallet Transactions
      if (demoUser.wallet) {
        await prisma.walletTransaction.createMany({
          data: [
            {
              walletId: demoUser.wallet.id,
              amount: 20000,
              type: "CREDIT",
              description: "Wallet Funding via Paystack Gateway",
              reference: "PAY-FUND-8829102",
              status: "SUCCESS",
              balanceBefore: 1520,
              balanceAfter: 21520,
            },
            {
              walletId: demoUser.wallet.id,
              amount: 1020,
              type: "DEBIT",
              description: "Purchase MTN 1.5GB Monthly (08031234567)",
              reference: "VTU-20260918-91823742",
              status: "SUCCESS",
              balanceBefore: 21520,
              balanceAfter: 20500,
            },
            {
              walletId: demoUser.wallet.id,
              amount: 2000,
              type: "DEBIT",
              description: "Purchase ₦2,000 MTN Airtime (08031234567)",
              reference: "VTU-20260917-48201948",
              status: "SUCCESS",
              balanceBefore: 20500,
              balanceAfter: 18500,
            },
          ],
        });
      }

      // Sample In-App Notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: demoUser.id,
            title: "Data Purchase Successful",
            message: "Your MTN 1.5GB Monthly plan for 08031234567 was activated instantly.",
            type: "SUCCESS",
          },
          {
            userId: demoUser.id,
            title: "Wallet Credited",
            message: "Your wallet was credited with ₦20,000.00 via Paystack.",
            type: "INFO",
          },
          {
            userId: demoUser.id,
            title: "Welcome to QuickVTU",
            message: "Enjoy instant discounts on airtime and fast automated data deliveries 24/7.",
            type: "INFO",
          },
        ],
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
