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

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch categories",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("CATEGORY BODY:", body);

    const name = body.name?.trim();
    const description = body.description?.trim() || null;

    if (!name) {
      return NextResponse.json(
        {
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        name: name,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          message: "Category already exists",
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name,
        description: description,
        status: true,
      },
    });

    console.log("CATEGORY CREATED:", category);

    return NextResponse.json(category, {
      status: 201,
    });
  } catch (error) {
    console.error("POST CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create category",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}