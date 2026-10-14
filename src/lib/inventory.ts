import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Atomic Order Deletion with Transactional Inventory Reversal
 * Strictly enforces stock integrity:
 * - If order is NEW, CONFIRMED, SENT_TO_CARRIER, IN_DELIVERY, or DELIVERED: restores inventory
 * - If order is CANCELLED, RETURNED, or REFUSED: skips restocking to prevent double-restock
 * - Restores product.stock and variantOption.stock
 * - Decrements promo code usedCount if applicable
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

    const nonRestockStatuses = ["CANCELLED", "RETURNED", "REFUSED"];
    const shouldRestock = !nonRestockStatuses.includes(order.status);

    if (shouldRestock) {
      for (const item of order.items) {
        // 1. Restock base product if productId exists
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
            console.warn(`Product ${item.productId} may have been deleted, skipping product stock update:`, e);
          }

          // 2. Restock variant options if specified
          if (item.variantSelections) {
            try {
              const selections: Record<string, string> = JSON.parse(item.variantSelections || "{}");
              for (const [variantName, optionLabel] of Object.entries(selections)) {
                // Find matching variant option for this product
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

      // 3. Decrement promo code usage count if used
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
          console.warn("Failed to update promo code used count:", e);
        }
      }
    }

    // 4. Cascade delete associated records
    await tx.review.deleteMany({
      where: { orderId },
    }).catch(() => {});

    await tx.orderItem.deleteMany({
      where: { orderId },
    });

    // 5. Delete order
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
