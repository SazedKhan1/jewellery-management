import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  password: "",
  database: "jewellery_management",
  port: 3306,
});

const prisma = new PrismaClient({ adapter });

function toNumber(value) {
  return Number(value || 0);
}

function decimalValue(value) {
  return Number(value || 0);
}

function formatReturnNo(id) {
  return `PRN-${String(id).padStart(6, "0")}`;
}

// =====================================================
// GET - Purchase Return List
// =====================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const supplierId = searchParams.get("supplierId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const where = {};

    if (search) {
      where.OR = [
        {
          returnNo: {
            contains: search,
          },
        },
        {
          supplier: {
            name: {
              contains: search,
            },
          },
        },
        {
          purchase: {
            purchaseNo: {
              contains: search,
            },
          },
        },
      ];
    }

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    if (from || to) {
      where.returnDate = {};

      if (from) {
        const fromDate = new Date(`${from}T00:00:00`);
        where.returnDate.gte = fromDate;
      }

      if (to) {
        const toDate = new Date(`${to}T23:59:59.999`);
        where.returnDate.lte = toDate;
      }
    }

    const returns = await prisma.purchaseReturn.findMany({
      where,
      include: {
        supplier: true,

        purchase: {
          include: {
            supplier: true,
          },
        },

        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },

            purchaseItem: true,
          },
        },
      },

      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("GET PURCHASE RETURNS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load purchase returns",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GET SINGLE PURCHASE WITH RETURN INFORMATION
// PUT /api/purchase-returns
// body: { purchaseId }
// =====================================================
export async function PUT(request) {
  try {
    const body = await request.json();

    const purchaseId = Number(body.purchaseId);

    if (!purchaseId) {
      return NextResponse.json(
        {
          error: "Purchase ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const purchase = await prisma.purchase.findUnique({
      where: {
        id: purchaseId,
      },

      include: {
        supplier: true,

        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },

            returns: true,
          },
        },

        returns: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          error: "Purchase not found",
        },
        {
          status: 404,
        }
      );
    }

    const items = purchase.items.map((item) => {
      const alreadyReturnedQty = item.returns.reduce(
        (sum, returnItem) => {
          return sum + Number(returnItem.quantity || 0);
        },
        0
      );

      const availableQuantity =
        Number(item.quantity || 0) - alreadyReturnedQty;

      return {
        ...item,

        alreadyReturnedQty,
        availableQuantity,
      };
    });

    return NextResponse.json({
      ...purchase,
      items,
    });
  } catch (error) {
    console.error("GET PURCHASE FOR RETURN ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load purchase",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST - Create Purchase Return
// =====================================================
export async function POST(request) {
  try {
    const body = await request.json();

    const purchaseId = Number(body.purchaseId);
    const note = body.note || "";
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!purchaseId) {
      return NextResponse.json(
        {
          error: "Purchase ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          error: "At least one return item is required",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // Load purchase
    // -------------------------------------------------

    const purchase = await prisma.purchase.findUnique({
      where: {
        id: purchaseId,
      },

      include: {
        supplier: true,

        items: {
          include: {
            product: true,
            returns: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          error: "Purchase not found",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // Validate return items
    // -------------------------------------------------

    const purchaseItemsMap = new Map(
      purchase.items.map((item) => [item.id, item])
    );

    const preparedItems = [];

    for (const rawItem of rawItems) {
      const purchaseItemId = Number(rawItem.purchaseItemId);
      const quantity = Number(rawItem.quantity || 0);

      if (!purchaseItemId) {
        return NextResponse.json(
          {
            error: "Invalid purchase item",
          },
          {
            status: 400,
          }
        );
      }

      if (quantity <= 0) {
        return NextResponse.json(
          {
            error: "Return quantity must be greater than 0",
          },
          {
            status: 400,
          }
        );
      }

      const purchaseItem =
        purchaseItemsMap.get(purchaseItemId);

      if (!purchaseItem) {
        return NextResponse.json(
          {
            error: `Purchase item ${purchaseItemId} not found`,
          },
          {
            status: 404,
          }
        );
      }

      const alreadyReturnedQty =
        purchaseItem.returns.reduce(
          (sum, item) =>
            sum + Number(item.quantity || 0),
          0
        );

      const availableQuantity =
        Number(purchaseItem.quantity || 0) -
        alreadyReturnedQty;

      if (quantity > availableQuantity) {
        return NextResponse.json(
          {
            error: `Return quantity for ${purchaseItem.product.name} cannot exceed available quantity ${availableQuantity}`,
          },
          {
            status: 400,
          }
        );
      }

      const grossWeight =
        toNumber(rawItem.grossWeight) * quantity;

      const stoneWeight =
        toNumber(rawItem.stoneWeight) * quantity;

      const netWeight =
        toNumber(rawItem.netWeight) * quantity;

      const rate = toNumber(rawItem.rate);

      const makingCharge =
        toNumber(rawItem.makingCharge) * quantity;

      const stoneCharge =
        toNumber(rawItem.stoneCharge) * quantity;

      const itemTotal =
        toNumber(rawItem.totalAmount) ||
        rate * quantity +
          makingCharge +
          stoneCharge;

      preparedItems.push({
        purchaseItemId,
        productId: purchaseItem.productId,
        quantity,

        grossWeight,
        stoneWeight,
        netWeight,

        rate,
        makingCharge,
        stoneCharge,

        totalAmount: itemTotal,
      });
    }

    // -------------------------------------------------
    // Calculate totals
    // -------------------------------------------------

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    const totalAmount = subtotal;

    // -------------------------------------------------
    // Generate temporary return number
    // -------------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // ---------------------------------------------
        // Create return first
        // ---------------------------------------------

        const purchaseReturn =
          await tx.purchaseReturn.create({
            data: {
              returnNo: `TEMP-${Date.now()}-${Math.floor(
                Math.random() * 10000
              )}`,

              purchaseId: purchase.id,
              supplierId: purchase.supplierId,

              returnDate: new Date(),

              subtotal,
              totalAmount,

              note,

              status: "COMPLETED",
            },
          });

        const returnNo = formatReturnNo(
          purchaseReturn.id
        );

        // ---------------------------------------------
        // Update actual return number
        // ---------------------------------------------

        await tx.purchaseReturn.update({
          where: {
            id: purchaseReturn.id,
          },

          data: {
            returnNo,
          },
        });

        // ---------------------------------------------
        // Create return items
        // ---------------------------------------------

        for (const item of preparedItems) {
          await tx.purchaseReturnItem.create({
            data: {
              purchaseReturnId: purchaseReturn.id,

              purchaseItemId: item.purchaseItemId,

              productId: item.productId,

              quantity: item.quantity,

              grossWeight: item.grossWeight,
              stoneWeight: item.stoneWeight,
              netWeight: item.netWeight,

              rate: item.rate,

              makingCharge: item.makingCharge,
              stoneCharge: item.stoneCharge,

              totalAmount: item.totalAmount,
            },
          });

          // -------------------------------------------
          // Update Product Stock
          // -------------------------------------------

          const product =
            await tx.product.findUnique({
              where: {
                id: item.productId,
              },
            });

          if (!product) {
            throw new Error(
              `Product ${item.productId} not found`
            );
          }

          const currentStock =
            Number(product.stockQuantity || 0);

          if (currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Current stock: ${currentStock}, return quantity: ${item.quantity}`
            );
          }

          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          // -------------------------------------------
          // Stock Transaction
          // -------------------------------------------

          await tx.stockTransaction.create({
            data: {
              productId: item.productId,

              transactionType: "PURCHASE_RETURN",

              quantity: -item.quantity,

              grossWeight: -item.grossWeight,
              stoneWeight: -item.stoneWeight,
              netWeight: -item.netWeight,

              referenceType: "PURCHASE_RETURN",

              referenceId: purchaseReturn.id,

              note: `Purchase Return ${returnNo}`,
            },
          });
        }

        // ---------------------------------------------
        // IMPORTANT:
        // Adjust Purchase Due Amount
        // ---------------------------------------------

        const oldDueAmount =
          Number(purchase.dueAmount || 0);

        const oldPaidAmount =
          Number(purchase.paidAmount || 0);

        const purchaseTotal =
          Number(purchase.totalAmount || 0);

        /*
          Return should reduce the supplier payable.

          Example:

          Purchase = 100,000
          Paid    = 20,000
          Due     = 80,000

          Return = 10,000

          New Purchase Total = 90,000
          New Due            = 70,000
        */

        const newTotalAmount = Math.max(
          0,
          purchaseTotal - totalAmount
        );

        let newDueAmount = Math.max(
          0,
          oldDueAmount - totalAmount
        );

        /*
          If return amount is greater than due amount,
          we don't create negative due.

          In that situation paid amount should also be
          reduced if necessary so accounting remains valid.
        */

        let newPaidAmount = oldPaidAmount;

        if (
          newPaidAmount + newDueAmount >
          newTotalAmount
        ) {
          newPaidAmount = Math.max(
            0,
            newTotalAmount - newDueAmount
          );
        }

        // ---------------------------------------------
        // Update Purchase
        // ---------------------------------------------

        await tx.purchase.update({
          where: {
            id: purchase.id,
          },

          data: {
            totalAmount: newTotalAmount,

            paidAmount: newPaidAmount,

            dueAmount: newDueAmount,
          },
        });

        // ---------------------------------------------
        // Return complete record
        // ---------------------------------------------

        return await tx.purchaseReturn.findUnique({
          where: {
            id: purchaseReturn.id,
          },

          include: {
            supplier: true,

            purchase: true,

            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },

                purchaseItem: true,
              },
            },
          },
        });
      }
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "CREATE PURCHASE RETURN ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to create purchase return",
      },
      {
        status: 500,
      }
    );
  }
}