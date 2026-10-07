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

// GET PURCHASES
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const supplierId = searchParams.get("supplierId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const where = {};

    // Search by Purchase No
    if (search) {
      where.OR = [
        {
          purchaseNo: {
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
      ];
    }

    // Supplier filter
    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    // Date filter
    if (from || to) {
      where.purchaseDate = {};

      if (from) {
        where.purchaseDate.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        where.purchaseDate.lte = new Date(`${to}T23:59:59`);
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,

      include: {
        supplier: true,

        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },

      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch purchases.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// GET SINGLE PURCHASE
export async function PUT(request) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          message: "Purchase ID is required.",
        },
        { status: 400 }
      );
    }

    const purchase = await prisma.purchase.findUnique({
      where: {
        id: Number(id),
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
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          message: "Purchase not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("GET PURCHASE DETAILS ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch purchase details.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}