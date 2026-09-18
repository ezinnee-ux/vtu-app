import prisma from "../db";

export interface VTUTransactionResult {
  success: boolean;
  reference: string;
  providerReference: string;
  status: "SUCCESSFUL" | "PENDING" | "FAILED";
  message: string;
  rawResponse: Record<string, unknown>;
  costPrice?: number;
  errorMessage?: string;
}

export interface VTUProviderBalance {
  provider: string;
  balance: number;
  currency: string;
  status: "ONLINE" | "OFFLINE" | "TEST_MODE";
}

export class VTUService {
  private isTestMode: boolean;
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private providerName: string;

  constructor() {
    this.isTestMode =
      process.env.VTU_TEST_MODE === "true" ||
      !process.env.VTU_API_KEY ||
      process.env.VTU_API_KEY.includes("placeholder");
    this.baseUrl = process.env.VTU_API_BASE_URL || "https://api.vtuprovider.com/v1";
    this.apiKey = process.env.VTU_API_KEY || "";
    this.apiSecret = process.env.VTU_API_SECRET || "";
    this.providerName = process.env.VTU_PROVIDER_NAME || "NigerianVTUProvider";
  }

  /**
   * Log API transactions to DB for audit and admin inspection
   */
  private async logApiCall(
    endpoint: string,
    requestPayload: Record<string, unknown>,
    responsePayload: Record<string, unknown>,
    statusCode: number,
    durationMs: number
  ) {
    try {
      await prisma.aPITransaction.create({
        data: {
          provider: this.providerName + (this.isTestMode ? " (Test Mode)" : ""),
          endpoint,
          requestPayload: JSON.stringify(requestPayload),
          responsePayload: JSON.stringify(responsePayload),
          statusCode,
          durationMs,
        },
      });
    } catch (err) {
      console.error("Failed to log API transaction:", err);
    }
  }

  /**
   * Get list of active telecommunication networks
   */
  async getNetworks() {
    return prisma.network.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { dataPlans: true },
        },
      },
    });
  }

  /**
   * Get dynamic data plans for a given network
   */
  async getDataPlans(networkCode?: string) {
    const whereClause: { isActive: boolean; network?: { code: string } } = { isActive: true };
    if (networkCode) {
      whereClause.network = { code: networkCode.toLowerCase() };
    }

    return prisma.dataPlan.findMany({
      where: whereClause,
      include: {
        network: true,
      },
      orderBy: [
        { providerCost: "asc" },
      ],
    });
  }

  /**
   * Purchase mobile airtime subscription
   */
  async purchaseAirtime(
    phoneNumber: string,
    networkCode: string,
    amount: number,
    reference: string
  ): Promise<VTUTransactionResult> {
    const startTime = Date.now();
    const network = await prisma.network.findUnique({
      where: { code: networkCode.toLowerCase() },
    });

    if (!network) {
      throw new Error(`Network ${networkCode} is not supported or inactive.`);
    }

    // Provider cost based on discount margin
    const discountRate = network.airtimeDiscountPercent / 100;
    const providerCost = Math.round(amount * (1 - discountRate));

    // TEST / SANDBOX MODE EXECUTION
    if (this.isTestMode) {
      // Simulate realistic network delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      const durationMs = Date.now() - startTime;

      // Deterministic test failure trigger: Numbers ending with "0000" fail
      if (phoneNumber.endsWith("0000")) {
        const failureResponse = {
          status: "failed",
          code: 422,
          message: "Recipient network subscriber not reachable or suspended (Simulated Failure)",
          timestamp: new Date().toISOString(),
        };

        await this.logApiCall(
          "/airtime/topup",
          { phoneNumber, network: networkCode, amount, reference },
          failureResponse,
          422,
          durationMs
        );

        return {
          success: false,
          reference,
          providerReference: `TEST-FAIL-${Date.now()}`,
          status: "FAILED",
          message: failureResponse.message,
          rawResponse: failureResponse,
          costPrice: providerCost,
          errorMessage: failureResponse.message,
        };
      }

      // Deterministic test pending trigger: Numbers ending with "9999" stay pending
      if (phoneNumber.endsWith("9999")) {
        const pendingResponse = {
          status: "processing",
          code: 202,
          message: "Transaction queued on telco gateway (Simulated Pending)",
          providerReference: `TEST-PENDING-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

        await this.logApiCall(
          "/airtime/topup",
          { phoneNumber, network: networkCode, amount, reference },
          pendingResponse,
          202,
          durationMs
        );

        return {
          success: true,
          reference,
          providerReference: pendingResponse.providerReference,
          status: "PENDING",
          message: pendingResponse.message,
          rawResponse: pendingResponse,
          costPrice: providerCost,
        };
      }

      // Standard Successful Mock Response
      const providerRef = `VTUPROV-AIR-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const mockSuccessResponse = {
        status: "success",
        code: 200,
        message: `Airtime top-up of ₦${amount} to ${phoneNumber} was successful.`,
        data: {
          operator: network.name,
          recipient: phoneNumber,
          amount,
          chargedAmount: providerCost,
          providerReference: providerRef,
          operatorReference: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString(),
        },
      };

      await this.logApiCall(
        "/airtime/topup",
        { phoneNumber, network: networkCode, amount, reference },
        mockSuccessResponse,
        200,
        durationMs
      );

      return {
        success: true,
        reference,
        providerReference: providerRef,
        status: "SUCCESSFUL",
        message: mockSuccessResponse.message,
        rawResponse: mockSuccessResponse,
        costPrice: providerCost,
      };
    }

    // LIVE VTU PROVIDER HTTP EXECUTION
    try {
      const payload = {
        network: network.code,
        phone: phoneNumber,
        amount,
        request_id: reference,
      };

      const response = await fetch(`${this.baseUrl}/airtime/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-API-Secret": this.apiSecret,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const durationMs = Date.now() - startTime;
      await this.logApiCall("/airtime/topup", payload, data, response.status, durationMs);

      if (response.ok && (data.status === "success" || data.code === 200 || data.status === true)) {
        return {
          success: true,
          reference,
          providerReference: data.reference || data.provider_reference || reference,
          status: "SUCCESSFUL",
          message: data.message || "Airtime top-up successful",
          rawResponse: data,
          costPrice: data.cost || providerCost,
        };
      } else {
        return {
          success: false,
          reference,
          providerReference: data.reference || `ERR-${Date.now()}`,
          status: "FAILED",
          message: data.message || "Provider failed to process airtime",
          rawResponse: data,
          costPrice: providerCost,
          errorMessage: data.message,
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network error contacting VTU provider";
      const durationMs = Date.now() - startTime;
      await this.logApiCall("/airtime/topup", { phoneNumber, networkCode, amount, reference }, { error: errorMessage }, 500, durationMs);

      return {
        success: false,
        reference,
        providerReference: `NETERR-${Date.now()}`,
        status: "FAILED",
        message: "Service temporarily unavailable. Please try again later.",
        rawResponse: { error: errorMessage },
        costPrice: providerCost,
        errorMessage,
      };
    }
  }

  /**
   * Purchase mobile data bundle subscription
   */
  async purchaseData(
    phoneNumber: string,
    networkCode: string,
    planCode: string,
    reference: string
  ): Promise<VTUTransactionResult> {
    const startTime = Date.now();
    const plan = await prisma.dataPlan.findUnique({
      where: { planCode },
      include: { network: true },
    });

    if (!plan) {
      throw new Error(`Data plan '${planCode}' not found.`);
    }

    // TEST / SANDBOX MODE EXECUTION
    if (this.isTestMode) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      const durationMs = Date.now() - startTime;

      // Deterministic failure simulation
      if (phoneNumber.endsWith("0000")) {
        const failureResponse = {
          status: "failed",
          code: 422,
          message: `Network rejected data activation for ${phoneNumber} (Simulated Failure)`,
          timestamp: new Date().toISOString(),
        };

        await this.logApiCall(
          "/data/topup",
          { phoneNumber, planCode, network: networkCode, reference },
          failureResponse,
          422,
          durationMs
        );

        return {
          success: false,
          reference,
          providerReference: `TEST-FAIL-${Date.now()}`,
          status: "FAILED",
          message: failureResponse.message,
          rawResponse: failureResponse,
          costPrice: plan.providerCost,
          errorMessage: failureResponse.message,
        };
      }

      // Deterministic pending simulation
      if (phoneNumber.endsWith("9999")) {
        const pendingResponse = {
          status: "processing",
          code: 202,
          message: "Data activation in progress with telco partner (Simulated Pending)",
          providerReference: `TEST-PEND-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

        await this.logApiCall(
          "/data/topup",
          { phoneNumber, planCode, network: networkCode, reference },
          pendingResponse,
          202,
          durationMs
        );

        return {
          success: true,
          reference,
          providerReference: pendingResponse.providerReference,
          status: "PENDING",
          message: pendingResponse.message,
          rawResponse: pendingResponse,
          costPrice: plan.providerCost,
        };
      }

      // Success
      const providerRef = `VTUPROV-DAT-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const mockSuccessResponse = {
        status: "success",
        code: 200,
        message: `${plan.name} (${plan.dataSize}) data successfully activated on ${phoneNumber}.`,
        data: {
          operator: plan.network.name,
          recipient: phoneNumber,
          plan: plan.name,
          dataSize: plan.dataSize,
          validity: plan.validity,
          providerReference: providerRef,
          operatorReference: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString(),
        },
      };

      await this.logApiCall(
        "/data/topup",
        { phoneNumber, planCode, network: networkCode, reference },
        mockSuccessResponse,
        200,
        durationMs
      );

      return {
        success: true,
        reference,
        providerReference: providerRef,
        status: "SUCCESSFUL",
        message: mockSuccessResponse.message,
        rawResponse: mockSuccessResponse,
        costPrice: plan.providerCost,
      };
    }

    // LIVE VTU PROVIDER HTTP EXECUTION
    try {
      const payload = {
        network: plan.network.code,
        plan_id: plan.planCode,
        phone: phoneNumber,
        request_id: reference,
      };

      const response = await fetch(`${this.baseUrl}/data/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-API-Secret": this.apiSecret,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const durationMs = Date.now() - startTime;
      await this.logApiCall("/data/topup", payload, data, response.status, durationMs);

      if (response.ok && (data.status === "success" || data.code === 200 || data.status === true)) {
        return {
          success: true,
          reference,
          providerReference: data.reference || data.provider_reference || reference,
          status: "SUCCESSFUL",
          message: data.message || "Data plan activated successfully",
          rawResponse: data,
          costPrice: data.cost || plan.providerCost,
        };
      } else {
        return {
          success: false,
          reference,
          providerReference: data.reference || `ERR-${Date.now()}`,
          status: "FAILED",
          message: data.message || "Failed to activate data bundle",
          rawResponse: data,
          costPrice: plan.providerCost,
          errorMessage: data.message,
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error communicating with VTU gateway";
      const durationMs = Date.now() - startTime;
      await this.logApiCall("/data/topup", { phoneNumber, planCode, reference }, { error: errorMessage }, 500, durationMs);

      return {
        success: false,
        reference,
        providerReference: `NETERR-${Date.now()}`,
        status: "FAILED",
        message: "Service temporarily unavailable. Please try again later.",
        rawResponse: { error: errorMessage },
        costPrice: plan.providerCost,
        errorMessage,
      };
    }
  }

  /**
   * Check status of a pending transaction with the provider
   */
  async checkTransactionStatus(reference: string, providerReference?: string): Promise<{
    status: "SUCCESSFUL" | "PENDING" | "FAILED";
    message: string;
    rawResponse: Record<string, unknown>;
  }> {
    if (this.isTestMode) {
      // If was ending with 9999, allow status check to resolve to SUCCESSFUL
      return {
        status: "SUCCESSFUL",
        message: "Transaction verified successfully on telco switch",
        rawResponse: { status: "success", verifiedAt: new Date().toISOString() },
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/status?reference=${reference}&provider_ref=${providerReference || ""}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-API-Secret": this.apiSecret,
          },
        }
      );
      const data = await response.json();
      return {
        status: data.status === "success" ? "SUCCESSFUL" : data.status === "failed" ? "FAILED" : "PENDING",
        message: data.message || "Status queried",
        rawResponse: data,
      };
    } catch {
      return {
        status: "PENDING",
        message: "Could not query provider status, retry scheduled",
        rawResponse: {},
      };
    }
  }

  /**
   * Check wholesale account balance at VTU provider
   */
  async getProviderBalance(): Promise<VTUProviderBalance> {
    if (this.isTestMode) {
      return {
        provider: this.providerName + " (Sandbox Mode)",
        balance: 489500.0,
        currency: "NGN",
        status: "TEST_MODE",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "X-API-Secret": this.apiSecret,
        },
      });
      const data = await response.json();
      return {
        provider: this.providerName,
        balance: data.balance || 0,
        currency: data.currency || "NGN",
        status: "ONLINE",
      };
    } catch {
      return {
        provider: this.providerName,
        balance: 0,
        currency: "NGN",
        status: "OFFLINE",
      };
    }
  }
}

export const vtuService = new VTUService();
export default vtuService;
