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

const prisma = new PrismaClient({
  adapter,
});

// =========================
// GET STOCK
// =========================

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET STOCK ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch stock.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// POST STOCK TRANSACTION
// =========================

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      productId,
      transactionType,
      quantity,
      grossWeight,
      stoneWeight,
      netWeight,
      referenceType,
      referenceId,
      note,
    } = body;

    // =========================
    // VALIDATION
    // =========================

    if (!productId) {
      return NextResponse.json(
        {
          message: "Product is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!transactionType) {
      return NextResponse.json(
        {
          message: "Transaction type is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      Number(quantity) < 0
    ) {
      return NextResponse.json(
        {
          message: "Quantity cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // NUMBER CONVERSION
    // =========================

    const qty = Number(quantity) || 0;
    const gross = Number(grossWeight) || 0;
    const stone = Number(stoneWeight) || 0;
    const net = Number(netWeight) || 0;

    if (gross < 0 || stone < 0 || net < 0) {
      return NextResponse.json(
        {
          message: "Weight cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // FIND PRODUCT
    // =========================

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // TRANSACTION TYPE
    // =========================

    let stockChange = 0;

    switch (transactionType) {
      case "OPENING":
        stockChange = qty;
        break;

      case "PURCHASE":
        stockChange = qty;
        break;

      case "SALES":
        stockChange = -qty;
        break;

      case "PURCHASE_RETURN":
        stockChange = -qty;
        break;

      case "SALES_RETURN":
        stockChange = qty;
        break;

      case "ADJUSTMENT_IN":
        stockChange = qty;
        break;

      case "ADJUSTMENT_OUT":
        stockChange = -qty;
        break;

      default:
        return NextResponse.json(
          {
            message: "Invalid transaction type.",
          },
          {
            status: 400,
          }
        );
    }

    // =========================
    // CHECK STOCK
    // =========================

    const newStock =
      product.stockQuantity + stockChange;

    if (newStock < 0) {
      return NextResponse.json(
        {
          message: `Insufficient stock. Current stock is ${product.stockQuantity}.`,
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // DATABASE TRANSACTION
    // =========================

    const result = await prisma.$transaction(
      async (tx) => {
        const transaction =
          await tx.stockTransaction.create({
            data: {
              productId: Number(productId),

              transactionType,

              quantity: qty,

              grossWeight: gross,

              stoneWeight: stone,

              netWeight: net,

              referenceType:
                referenceType?.trim() || null,

              referenceId:
                referenceId !== undefined &&
                referenceId !== null &&
                referenceId !== ""
                  ? Number(referenceId)
                  : null,

              note: note?.trim() || null,
            },
          });

        const updatedProduct =
          await tx.product.update({
            where: {
              id: Number(productId),
            },

            data: {
              stockQuantity: newStock,
            },

            include: {
              category: true,
            },
          });

        return {
          transaction,
          product: updatedProduct,
        };
      }
    );

    return NextResponse.json(
      {
        message: "Stock updated successfully.",

        data: result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST STOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to update stock.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// GET STOCK HISTORY
// =========================

export async function PUT(request) {
  try {
    const body = await request.json();

    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        {
          message: "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const history =
      await prisma.stockTransaction.findMany({
        where: {
          productId: Number(productId),
        },

        include: {
          product: {
            include: {
              category: true,
            },
          },
        },

        orderBy: {
          id: "desc",
        },
      });

    return NextResponse.json(history);
  } catch (error) {
    console.error(
      "GET STOCK HISTORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to fetch stock history.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}