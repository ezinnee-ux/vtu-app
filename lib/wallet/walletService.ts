import prisma from "../db";

export class WalletService {
  /**
   * Get or initialize user wallet
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: "NGN",
        },
        include: {
          transactions: true,
        },
      });
    }

    return wallet;
  }

  /**
   * Atomically debit user wallet with idempotency guard
   */
  async debitWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Check idempotency - if reference already debited, throw or return
      const existingTx = await tx.walletTransaction.findUnique({
        where: { reference },
      });
      if (existingTx) {
        throw new Error(`Transaction with reference ${reference} has already been processed.`);
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found for this user.");
      }

      if (wallet.balance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ₦${wallet.balance.toFixed(2)}, Required: ₦${amount.toFixed(2)}`);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance - amount;

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create ledger entry
      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "DEBIT",
          description,
          reference,
          status: "SUCCESS",
          balanceBefore,
          balanceAfter,
        },
      });

      return { wallet: updatedWallet, transaction: walletTx };
    });
  }

  /**
   * Credit user wallet (e.g. from Paystack, Flutterwave, or Sandbox Funding)
   */
  async creditWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existingTx = await tx.walletTransaction.findUnique({
        where: { reference },
      });
      if (existingTx) {
        const currentWallet = await tx.wallet.findUnique({ where: { userId } });
        return { wallet: currentWallet, transaction: existingTx };
      }

      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "NGN" },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance + amount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "CREDIT",
          description,
          reference,
          status: "SUCCESS",
          balanceBefore,
          balanceAfter,
        },
      });

      // Also create notification
      await tx.notification.create({
        data: {
          userId,
          title: "Wallet Credited",
          message: `Your wallet was credited with ₦${amount.toLocaleString()} (${description}).`,
          type: "SUCCESS",
        },
      });

      return { wallet: updatedWallet, transaction: walletTx };
    });
  }

  /**
   * Reverse transaction & refund user wallet
   */
  async refundOrder(orderId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      if (order.status === "REVERSED") {
        throw new Error("Order has already been refunded.");
      }

      // Check if paid via wallet
      if (order.paymentMethod === "WALLET") {
        const wallet = await tx.wallet.findUnique({
          where: { userId: order.userId },
        });

        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = wallet.balance + order.amount;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
          });

          const refundRef = `REFUND-${order.reference}`;
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: order.amount,
              type: "CREDIT",
              description: `Refund for failed ${order.type}: ${reason}`,
              reference: refundRef,
              status: "SUCCESS",
              balanceBefore,
              balanceAfter,
            },
          });
        }
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "REVERSED" },
      });

      // Update transaction status if exists
      await tx.transaction.updateMany({
        where: { orderId },
        data: {
          status: "REVERSED",
          errorMessage: `Refunded: ${reason}`,
        },
      });

      // Send in-app notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "Refund Processed",
          message: `₦${order.amount.toLocaleString()} for order ${order.reference} has been refunded to your wallet. Reason: ${reason}`,
          type: "WARNING",
        },
      });

      return updatedOrder;
    });
  }
}

export const walletService = new WalletService();
export default walletService;
