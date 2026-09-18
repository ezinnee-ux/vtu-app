import crypto from "crypto";

export class PaymentService {
  private paystackSecret: string;
  private flutterwaveSecret: string;

  constructor() {
    this.paystackSecret = process.env.PAYSTACK_SECRET_KEY || "";
    this.flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY || "";
  }

  /**
   * Verify Paystack Webhook Signature using HMAC SHA512
   */
  verifyPaystackSignature(rawBody: string, signature: string): boolean {
    if (!this.paystackSecret) return false;
    const hash = crypto
      .createHmac("sha512", this.paystackSecret)
      .update(rawBody)
      .digest("hex");
    return hash === signature;
  }

  /**
   * Verify Flutterwave Webhook Secret Hash
   */
  verifyFlutterwaveSignature(secretHash: string): boolean {
    const configuredHash = process.env.FLUTTERWAVE_SECRET_HASH || "vtu_flw_secret_hash";
    return secretHash === configuredHash;
  }

  /**
   * Initialize Paystack Payment
   */
  async initializePaystack(email: string, amount: number, reference: string, callbackUrl: string) {
    // If running in test mode with placeholder keys, return test response
    if (this.paystackSecret.includes("sample") || !this.paystackSecret) {
      return {
        authorization_url: `${callbackUrl}?reference=${reference}&gateway=paystack&status=success`,
        access_code: `test_access_${Date.now()}`,
        reference,
      };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack accepts amount in Kobo
        reference,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || "Failed to initialize Paystack payment");
    }

    return data.data;
  }

  /**
   * Server-side verification of Paystack Transaction
   */
  async verifyPaystack(reference: string) {
    if (this.paystackSecret.includes("sample") || !this.paystackSecret) {
      return {
        status: true,
        data: {
          status: "success",
          reference,
          amount: 500000, // 5,000 NGN in Kobo
          gateway_response: "Successful (Sandbox Mode)",
        },
      };
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${this.paystackSecret}`,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || "Payment verification failed");
    }

    return data;
  }

  /**
   * Initialize Flutterwave Payment
   */
  async initializeFlutterwave(
    email: string,
    amount: number,
    reference: string,
    callbackUrl: string,
    customerName: string,
    phone: string
  ) {
    if (this.flutterwaveSecret.includes("sample") || !this.flutterwaveSecret) {
      return {
        link: `${callbackUrl}?reference=${reference}&gateway=flutterwave&status=successful`,
        tx_ref: reference,
      };
    }

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.flutterwaveSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount,
        currency: "NGN",
        redirect_url: callbackUrl,
        customer: {
          email,
          phonenumber: phone,
          name: customerName,
        },
        customizations: {
          title: "QuickVTU Wallet Top-up",
          description: "Wallet Funding",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to initialize Flutterwave payment");
    }

    return data.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
