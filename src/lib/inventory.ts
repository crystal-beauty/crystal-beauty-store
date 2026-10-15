import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Inactive statuses where physical stock is not reserved and should be back in inventory.
 */
export const INACTIVE_ORDER_STATUSES = ["CANCELLED", "RETURNED", "REFUSED"] as const;

export type OrderItemWithVariant = {
  productId: string | null;
  quantity: number;
  variantSelections: string;
};

/**
 * Restores product and variant inventory + decrements promo code usedCount.
 */
export async function restockOrderInventory(
  tx: Prisma.TransactionClient,
  order: { items: OrderItemWithVariant[]; promoCodeId?: string | null }
) {
  for (const item of order.items) {
    if (item.productId) {
      try {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      } catch (e) {
        console.warn(`Product ${item.productId} may have been deleted, skipping stock increment:`, e);
      }

      if (item.variantSelections) {
        try {
          const selections: Record<string, string> = JSON.parse(item.variantSelections || "{}");
          for (const [variantName, optionLabel] of Object.entries(selections)) {
            const option = await tx.variantOption.findFirst({
              where: {
                label: optionLabel,
                variant: {
                  productId: item.productId,
                  name: variantName,
                },
              },
            });

            if (option && option.stock !== null) {
              await tx.variantOption.update({
                where: { id: option.id },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        } catch (err) {
          console.error("Failed to parse variant selections or restore variant stock:", err);
        }
      }
    }
  }

  if (order.promoCodeId) {
    try {
      const promo = await tx.promoCode.findUnique({
        where: { id: order.promoCodeId },
      });
      if (promo && promo.usedCount > 0) {
        await tx.promoCode.update({
          where: { id: order.promoCodeId },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        });
      }
    } catch (e) {
      console.warn("Failed to decrement promo code used count:", e);
    }
  }
}

/**
 * Deducts product and variant inventory + increments promo code usedCount.
 */
export async function deductOrderInventory(
  tx: Prisma.TransactionClient,
  order: { items: OrderItemWithVariant[]; promoCodeId?: string | null }
) {
  for (const item of order.items) {
    if (item.productId) {
      try {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } catch (e) {
        console.warn(`Product ${item.productId} may have been deleted, skipping stock decrement:`, e);
      }

      if (item.variantSelections) {
        try {
          const selections: Record<string, string> = JSON.parse(item.variantSelections || "{}");
          for (const [variantName, optionLabel] of Object.entries(selections)) {
            const option = await tx.variantOption.findFirst({
              where: {
                label: optionLabel,
                variant: {
                  productId: item.productId,
                  name: variantName,
                },
              },
            });

            if (option && option.stock !== null) {
              await tx.variantOption.update({
                where: { id: option.id },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }
          }
        } catch (err) {
          console.error("Failed to parse variant selections or deduct variant stock:", err);
        }
      }
    }
  }

  if (order.promoCodeId) {
    try {
      await tx.promoCode.update({
        where: { id: order.promoCodeId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    } catch (e) {
      console.warn("Failed to increment promo code used count:", e);
    }
  }
}

/**
 * Atomically updates order status, maintaining strict inventory integrity across transitions:
 * - Active -> Inactive (e.g. NEW/CONFIRMED -> CANCELLED/REFUSED/RETURNED): Restores inventory
 * - Inactive -> Active (e.g. CANCELLED -> CONFIRMED): Deducts inventory
 * - Active -> Active or Inactive -> Inactive: No inventory adjustment needed
 */
export async function updateOrderStatusAtomic(
  orderId: string,
  newStatus: string,
  options?: {
    by?: string;
    notes?: string | null;
    extraData?: Record<string, unknown>;
  }
) {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Commande introuvable");
    }

    const wasActive = !INACTIVE_ORDER_STATUSES.includes(order.status as (typeof INACTIVE_ORDER_STATUSES)[number]);
    const willBeActive = !INACTIVE_ORDER_STATUSES.includes(newStatus as (typeof INACTIVE_ORDER_STATUSES)[number]);

    if (wasActive && !willBeActive) {
      await restockOrderInventory(tx, order);
    } else if (!wasActive && willBeActive) {
      await deductOrderInventory(tx, order);
    }

    const history = JSON.parse(order.statusHistory || "[]");
    if (order.status !== newStatus) {
      history.push({
        status: newStatus,
        at: new Date().toISOString(),
        by: options?.by || "system",
      });
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      statusHistory: JSON.stringify(history),
      ...(options?.notes !== undefined ? { notes: options.notes } : {}),
      ...(newStatus === "SENT_TO_CARRIER" && !order.sentToCarrierAt ? { sentToCarrierAt: new Date() } : {}),
      ...(newStatus === "DELIVERED" && !order.deliveredAt ? { deliveredAt: new Date() } : {}),
      ...(options?.extraData || {}),
    };

    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    return updated;
  });
}

/**
 * Atomic Order Deletion with Transactional Inventory Reversal
 * Strictly enforces stock integrity:
 * - If order is active (NEW, CONFIRMED, SENT_TO_CARRIER, IN_DELIVERY, or DELIVERED): restores inventory
 * - If order is already inactive (CANCELLED, RETURNED, or REFUSED): skips restocking to prevent double-restock
 * - Cascade-deletes reviews and order items before deleting the order
 */
export async function deleteOrderAtomic(orderId: string) {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Commande introuvable");
    }

    const shouldRestock = !INACTIVE_ORDER_STATUSES.includes(order.status as (typeof INACTIVE_ORDER_STATUSES)[number]);

    if (shouldRestock) {
      await restockOrderInventory(tx, order);
    }

    // Cascade delete associated records
    await tx.review.deleteMany({
      where: { orderId },
    }).catch(() => {});

    await tx.orderItem.deleteMany({
      where: { orderId },
    });

    // Delete order
    await tx.order.delete({
      where: { id: orderId },
    });

    return {
      success: true,
      restocked: shouldRestock,
      orderNumber: order.orderNumber,
    };
  });
}
