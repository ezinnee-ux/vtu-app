# Nigerian VTU Provider Integration Guide

QuickVTU has been architected with a production-grade, modular service layer (`lib/vtu/vtuService.ts`) to connect seamlessly to any Nigerian VTU aggregator or direct telecommunication provider (such as Clubkonnect, VTU.ng, GladData, Husky, or custom telecom switches).

---

## 1. Environment Configuration

To connect your live Nigerian VTU provider, update the `.env` file with your provider credentials:

```env
# Set to "false" to disable simulation and send live HTTP requests
VTU_TEST_MODE="false"

# The name of your VTU provider (e.g., Clubkonnect, VTU.ng, GladData)
VTU_PROVIDER_NAME="Clubkonnect"

# Base URL of the VTU provider's API
VTU_API_BASE_URL="https://api.vtuprovider.com/v1"

# Provider Authentication Keys
VTU_API_KEY="your_live_vtu_api_key_here"
VTU_API_SECRET="your_live_vtu_api_secret_here"
```

---

## 2. API Endpoints & Service Mapping

The service layer implements the following methods in `lib/vtu/vtuService.ts`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `purchaseAirtime(...)` | `POST /airtime/topup` | Top up MTN, Airtel, Glo, or 9mobile airtime |
| `purchaseData(...)` | `POST /data/topup` | Activate SME, Gifting, or Direct data bundle |
| `checkTransactionStatus(...)` | `GET /transaction/status` | Real-time status inquiry for queued orders |
| `getProviderBalance(...)` | `GET /wallet/balance` | Query wholesale vendor balance |

### A. Airtime Top-Up Request Format

```json
POST https://api.vtuprovider.com/v1/airtime/topup
Headers:
  Authorization: Bearer <VTU_API_KEY>
  X-API-Secret: <VTU_API_SECRET>
  Content-Type: application/json

Body:
{
  "network": "mtn",
  "phone": "08031234567",
  "amount": 1000,
  "request_id": "VTU-20260918-ABCD1234"
}
```

### B. Data Subscription Request Format

```json
POST https://api.vtuprovider.com/v1/data/topup
Headers:
  Authorization: Bearer <VTU_API_KEY>
  X-API-Secret: <VTU_API_SECRET>
  Content-Type: application/json

Body:
{
  "network": "airtel",
  "plan_id": "airtel-1.5gb-30d",
  "phone": "08029988776",
  "request_id": "VTU-20260918-EFGH5678"
}
```

---

## 3. Webhook Delivery Integration

When transactions are queued or delayed by the telecommunications network, the provider can post status updates to QuickVTU's webhook endpoint:

```
POST https://yourdomain.com/api/vtu/webhook
Content-Type: application/json

{
  "reference": "VTU-20260918-ABCD1234",
  "status": "successful",
  "provider_reference": "TELCO-99881122",
  "message": "Airtime delivered to 08031234567"
}
```

* **Automatic Status Sync**: If `status === "successful"`, the transaction is marked successful and the user receives an in-app notification.
* **Automatic Rollback**: If `status === "failed"`, the user's wallet is **instantly refunded** without manual intervention!

---

## 4. Built-in Sandbox / Test Mode Features

When `VTU_TEST_MODE="true"` (the default in development):
1. **Zero Financial Risk**: Airtime and data can be simulated without deducting real funds.
2. **Deterministic Edge Testing**:
   * **Simulated Success**: Any normal Nigerian phone number triggers a successful top-up with generated provider references.
   * **Simulated Failure**: Phone numbers ending in `0000` (e.g. `08030000000`) trigger a simulated network rejection and verify the **automatic wallet refund engine**.
   * **Simulated Processing**: Phone numbers ending in `9999` (e.g. `08039999999`) trigger a pending state for testing status checks and polling.

---

## 5. Deployment Guide (Netlify & PostgreSQL)

1. **Database Setup**: Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@your-neon-host.neon.tech/neondb?sslmode=require"
   ```
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. Deploy to Netlify or Vercel:
   ```bash
   npx prisma db push
   node prisma/seed.js
   npm run build
   ```
