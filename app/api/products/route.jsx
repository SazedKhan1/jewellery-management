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
// GET PRODUCTS
// =========================

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch products",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// =========================
// POST PRODUCT
// =========================

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      barcode,
      name,
      categoryId,
      jewelleryType,
      karat,
      purity,
      grossWeight,
      stoneWeight,
      netWeight,
      wastagePercent,
      makingCharge,
      stoneCharge,
      purchasePrice,
      sellingPrice,
      stockQuantity,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        {
          message: "Product Name and Category are required.",
        },
        { status: 400 }
      );
    }

    // =========================
    // AUTO PRODUCT CODE
    // =========================

    const lastProduct = await prisma.product.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    const nextNumber = (lastProduct?.id || 0) + 1;

    const productCode = `PRD-${String(nextNumber).padStart(6, "0")}`;

    // =========================
    // BARCODE DUPLICATE CHECK
    // =========================

    if (barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: {
          barcode: barcode.trim(),
        },
      });

      if (existingBarcode) {
        return NextResponse.json(
          {
            message: "Barcode already exists.",
          },
          { status: 409 }
        );
      }
    }

    // =========================
    // CATEGORY CHECK
    // =========================

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          message: "Selected category not found.",
        },
        { status: 404 }
      );
    }

    // =========================
    // CREATE PRODUCT
    // =========================

    const product = await prisma.product.create({
      data: {
        productCode,

        barcode: barcode?.trim() || null,

        name: name.trim(),

        categoryId: Number(categoryId),

        jewelleryType: jewelleryType?.trim() || null,

        karat: karat?.trim() || null,

        purity: purity ? Number(purity) : null,

        grossWeight: grossWeight ? Number(grossWeight) : 0,

        stoneWeight: stoneWeight ? Number(stoneWeight) : 0,

        netWeight: netWeight ? Number(netWeight) : 0,

        wastagePercent: wastagePercent
          ? Number(wastagePercent)
          : 0,

        makingCharge: makingCharge
          ? Number(makingCharge)
          : 0,

        stoneCharge: stoneCharge
          ? Number(stoneCharge)
          : 0,

        purchasePrice: purchasePrice
          ? Number(purchasePrice)
          : 0,

        sellingPrice: sellingPrice
          ? Number(sellingPrice)
          : 0,

        stockQuantity: stockQuantity
          ? Number(stockQuantity)
          : 0,

        status: true,
      },

      include: {
        category: true,
      },
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create product.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// =========================
// PUT PRODUCT
// =========================

export async function PUT(request) {
  try {
    const body = await request.json();

    const {
      id,
      barcode,
      name,
      categoryId,
      jewelleryType,
      karat,
      purity,
      grossWeight,
      stoneWeight,
      netWeight,
      wastagePercent,
      makingCharge,
      stoneCharge,
      purchasePrice,
      sellingPrice,
      stockQuantity,
      status,
    } = body;

    // =========================
    // REQUIRED ID
    // =========================

    if (!id) {
      return NextResponse.json(
        {
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    // =========================
    // REQUIRED FIELDS
    // =========================

    if (!name || !categoryId) {
      return NextResponse.json(
        {
          message: "Product Name and Category are required.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK PRODUCT
    // =========================

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    // =========================
    // BARCODE DUPLICATE CHECK
    // =========================

    if (barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: {
          barcode: barcode.trim(),
        },
      });

      if (
        existingBarcode &&
        existingBarcode.id !== Number(id)
      ) {
        return NextResponse.json(
          {
            message: "Barcode already exists.",
          },
          { status: 409 }
        );
      }
    }

    // =========================
    // CATEGORY CHECK
    // =========================

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          message: "Selected category not found.",
        },
        { status: 404 }
      );
    }

    // =========================
    // UPDATE PRODUCT
    // =========================

    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },

      data: {
        barcode: barcode?.trim() || null,

        name: name.trim(),

        categoryId: Number(categoryId),

        jewelleryType:
          jewelleryType?.trim() || null,

        karat:
          karat?.trim() || null,

        purity:
          purity !== "" && purity !== null
            ? Number(purity)
            : null,

        grossWeight:
          grossWeight !== "" && grossWeight !== null
            ? Number(grossWeight)
            : 0,

        stoneWeight:
          stoneWeight !== "" && stoneWeight !== null
            ? Number(stoneWeight)
            : 0,

        netWeight:
          netWeight !== "" && netWeight !== null
            ? Number(netWeight)
            : 0,

        wastagePercent:
          wastagePercent !== "" && wastagePercent !== null
            ? Number(wastagePercent)
            : 0,

        makingCharge:
          makingCharge !== "" && makingCharge !== null
            ? Number(makingCharge)
            : 0,

        stoneCharge:
          stoneCharge !== "" && stoneCharge !== null
            ? Number(stoneCharge)
            : 0,

        purchasePrice:
          purchasePrice !== "" && purchasePrice !== null
            ? Number(purchasePrice)
            : 0,

        sellingPrice:
          sellingPrice !== "" && sellingPrice !== null
            ? Number(sellingPrice)
            : 0,

        stockQuantity:
          stockQuantity !== "" && stockQuantity !== null
            ? Number(stockQuantity)
            : 0,

        status:
          typeof status === "boolean"
            ? status
            : existingProduct.status,
      },

      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update product.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// =========================
// DELETE PRODUCT
// =========================

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    // =========================
    // REQUIRED ID
    // =========================

    if (!id) {
      return NextResponse.json(
        {
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK PRODUCT
    // =========================

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    // =========================
    // DELETE PRODUCT
    // =========================

    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Failed to delete product. It may be used in another transaction.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}