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

function number(value) {
  return Number(value || 0);
}

function money(value) {
  return Number(number(value).toFixed(2));
}

function getBalanceParts(balance) {
  const value = money(balance);

  return {
    netBalance: value,
    dueBalance: value > 0 ? value : 0,
    advanceBalance: value < 0 ? Math.abs(value) : 0,
  };
}

/*
  ============================================================
  GET CUSTOMERS
  ============================================================
*/

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: "desc",
      },
    });

    const customerList = customers.map((customer) => {
      const balance =
        number(customer.openingDue) -
        number(customer.openingAdvance);

      const {
        netBalance,
        dueBalance,
        advanceBalance,
      } = getBalanceParts(balance);

      return {
        ...customer,

        openingDue: money(customer.openingDue),

        openingAdvance: money(
          customer.openingAdvance
        ),

        netBalance,

        dueBalance,

        advanceBalance,

        currentBalance: dueBalance,
      };
    });

    return NextResponse.json(customerList);
  } catch (error) {
    console.error(
      "GET CUSTOMERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to fetch customers.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ============================================================
  ADD CUSTOMER
  ============================================================
*/

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      address,
      openingDue,
      openingAdvance,
      status,
    } = body;

    /*
      NAME VALIDATION
    */

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          message: "Customer name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      DUPLICATE NAME
    */

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          name: {
            equals: name.trim(),
          },
        },
      });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message:
            "Customer with this name already exists.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      OPENING BALANCE
    */

    const due = number(openingDue);
    const advance = number(openingAdvance);

    if (due < 0) {
      return NextResponse.json(
        {
          message:
            "Opening due cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (advance < 0) {
      return NextResponse.json(
        {
          message:
            "Opening advance cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      BOTH CANNOT EXIST TOGETHER
    */

    if (due > 0 && advance > 0) {
      return NextResponse.json(
        {
          message:
            "Opening due and opening advance cannot both be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      SUPPLIER CODE STYLE

      CUS-000001
    */

    const lastCustomer =
      await prisma.customer.findFirst({
        orderBy: {
          id: "desc",
        },
      });

    const nextId =
      lastCustomer
        ? lastCustomer.id + 1
        : 1;

    const customerCode =
      `CUS-${String(nextId).padStart(6, "0")}`;

    /*
      CREATE
    */

    const customer =
      await prisma.customer.create({
        data: {
          customerCode,

          name: name.trim(),

          phone:
            phone?.trim() || null,

          email:
            email?.trim() || null,

          address:
            address?.trim() || null,

          openingDue: due,

          openingAdvance: advance,

          status:
            status !== undefined
              ? Boolean(status)
              : true,
        },
      });

    return NextResponse.json(
      {
        message:
          "Customer created successfully.",

        data: customer,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE CUSTOMER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to create customer.",

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ============================================================
  UPDATE CUSTOMER
  ============================================================
*/

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
      openingAdvance,
      status,
    } = body;

    /*
      ID
    */

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Customer ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      NAME
    */

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          message:
            "Customer name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const customerId =
      Number(id);

    /*
      FIND CUSTOMER
    */

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          message:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      DUPLICATE NAME
    */

    const duplicateCustomer =
      await prisma.customer.findFirst({
        where: {
          name: {
            equals: name.trim(),
          },

          NOT: {
            id: customerId,
          },
        },
      });

    if (duplicateCustomer) {
      return NextResponse.json(
        {
          message:
            "Another customer with this name already exists.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      OPENING BALANCE
    */

    const due = number(openingDue);

    const advance =
      number(openingAdvance);

    if (due < 0) {
      return NextResponse.json(
        {
          message:
            "Opening due cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (advance < 0) {
      return NextResponse.json(
        {
          message:
            "Opening advance cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (due > 0 && advance > 0) {
      return NextResponse.json(
        {
          message:
            "Opening due and opening advance cannot both be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      UPDATE
    */

    const customer =
      await prisma.customer.update({
        where: {
          id: customerId,
        },

        data: {
          name:
            name.trim(),

          phone:
            phone?.trim() || null,

          email:
            email?.trim() || null,

          address:
            address?.trim() || null,

          openingDue: due,

          openingAdvance: advance,

          status:
            status !== undefined
              ? Boolean(status)
              : existingCustomer.status,
        },
      });

    return NextResponse.json({
      message:
        "Customer updated successfully.",

      data: customer,
    });
  } catch (error) {
    console.error(
      "UPDATE CUSTOMER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to update customer.",

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ============================================================
  DELETE CUSTOMER
  ============================================================
*/

export async function DELETE(request) {
  try {
    const body =
      await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Customer ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const customerId =
      Number(id);

    const customer =
      await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          message:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    return NextResponse.json({
      message:
        "Customer deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE CUSTOMER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to delete customer.",

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}