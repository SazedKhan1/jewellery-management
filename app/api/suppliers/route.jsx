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

// GET ALL SUPPLIERS
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("GET SUPPLIERS ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch suppliers.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ADD SUPPLIER
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      address,
      openingDue,
      status,
    } = body;

    // VALIDATION
    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Supplier name is required." },
        { status: 400 }
      );
    }

    // CHECK DUPLICATE NAME
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { message: "Supplier with this name already exists." },
        { status: 400 }
      );
    }

    // GENERATE SUPPLIER CODE
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    const nextId = lastSupplier ? lastSupplier.id + 1 : 1;

    const supplierCode = `SUP-${String(nextId).padStart(6, "0")}`;

    const due = Number(openingDue) || 0;

    if (due < 0) {
      return NextResponse.json(
        { message: "Opening due cannot be negative." },
        { status: 400 }
      );
    }

    // CREATE SUPPLIER
    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        openingDue: due,
        status: status !== undefined ? Boolean(status) : true,
      },
    });

    return NextResponse.json(
      {
        message: "Supplier created successfully.",
        data: supplier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SUPPLIER ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create supplier.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// UPDATE SUPPLIER
export async function PUT(request) {
  try {
    const body = await request.json();

    const {
      id,
      name,
      phone,
      email,
      address,
      openingDue,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Supplier ID is required." },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Supplier name is required." },
        { status: 400 }
      );
    }

    const supplierId = Number(id);

    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { message: "Supplier not found." },
        { status: 404 }
      );
    }

    // CHECK DUPLICATE NAME
    const duplicateSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
        NOT: {
          id: supplierId,
        },
      },
    });

    if (duplicateSupplier) {
      return NextResponse.json(
        { message: "Another supplier with this name already exists." },
        { status: 400 }
      );
    }

    const due = Number(openingDue) || 0;

    if (due < 0) {
      return NextResponse.json(
        { message: "Opening due cannot be negative." },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        openingDue: due,
        status: status !== undefined ? Boolean(status) : existingSupplier.status,
      },
    });

    return NextResponse.json({
      message: "Supplier updated successfully.",
      data: supplier,
    });
  } catch (error) {
    console.error("UPDATE SUPPLIER ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update supplier.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE SUPPLIER
export async function DELETE(request) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Supplier ID is required." },
        { status: 400 }
      );
    }

    const supplierId = Number(id);

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { message: "Supplier not found." },
        { status: 404 }
      );
    }

    await prisma.supplier.delete({
      where: {
        id: supplierId,
      },
    });

    return NextResponse.json({
      message: "Supplier deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE SUPPLIER ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to delete supplier.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}