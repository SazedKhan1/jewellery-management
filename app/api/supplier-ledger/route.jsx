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

function parseDateStart(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseDateEnd(value) {
  if (!value) return null;

  const date = new Date(`${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/*
  ============================================================
  GET SUPPLIER LEDGER
  ============================================================

  ACCOUNTING:

  Opening Due       = Debit
  Purchase          = Debit

  Purchase Return   = Credit
  Purchase Paid     = Credit
  Supplier Payment  = Credit

  Positive Balance  = Supplier Due
  Negative Balance  = Supplier Advance
*/
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const supplierIdParam =
      searchParams.get("supplierId");

    const fromDate =
      searchParams.get("fromDate");

    const toDate =
      searchParams.get("toDate");

    const supplierWhere = supplierIdParam
      ? {
          id: Number(supplierIdParam),
        }
      : {};

    /*
      ============================================================
      SUPPLIERS
      ============================================================
    */

    const suppliers =
      await prisma.supplier.findMany({
        where: supplierWhere,

        orderBy: {
          id: "desc",
        },
      });

    const supplierIds =
      suppliers.map(
        (supplier) => supplier.id
      );

    /*
      ============================================================
      NO SUPPLIER
      ============================================================
    */

    if (supplierIds.length === 0) {
      return NextResponse.json({
        suppliers: [],

        summary: {
          openingBalance: 0,
          openingDue: 0,
          openingAdvance: 0,

          totalPurchase: 0,
          totalPurchasePaid: 0,
          totalPurchaseReturn: 0,
          totalSupplierPayment: 0,

          netBalance: 0,
          currentBalance: 0,
          dueBalance: 0,
          advanceBalance: 0,
        },

        filteredSummary: {
          openingBalance: 0,
          openingDue: 0,
          openingAdvance: 0,

          totalPurchase: 0,
          totalPurchasePaid: 0,
          totalPurchaseReturn: 0,
          totalSupplierPayment: 0,

          periodBalance: 0,
          periodDue: 0,
          periodAdvance: 0,
        },

        ledger: [],
        payments: [],
      });
    }

    /*
      ============================================================
      ALL TRANSACTIONS
      ============================================================
    */

    const [
      allPurchases,
      allPurchaseReturns,
      allSupplierPayments,
    ] = await Promise.all([
      prisma.purchase.findMany({
        where: {
          supplierId: {
            in: supplierIds,
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.purchaseReturn.findMany({
        where: {
          supplierId: {
            in: supplierIds,
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.supplierPayment.findMany({
        where: {
          supplierId: {
            in: supplierIds,
          },

          status: "COMPLETED",
        },

        include: {
          supplier: true,
        },

        orderBy: {
          paymentDate: "asc",
        },
      }),
    ]);

    /*
      ============================================================
      OPENING DUE FROM SUPPLIER
      ============================================================

      This is the IMPORTANT FIX.

      Supplier table already contains:

      supplier.openingDue
    */

    const supplierOpeningDue =
      suppliers.reduce(
        (sum, supplier) =>
          sum +
          number(
            supplier.openingDue
          ),
        0
      );

    /*
      Currently system supports
      Opening Due.

      Opening Advance is kept as
      0 because there is no
      openingAdvance field in schema.
    */

    const supplierOpeningAdvance = 0;

    /*
      ============================================================
      ALL TIME TOTALS
      ============================================================
    */

    let totalPurchase = 0;
    let totalPurchasePaid = 0;
    let totalPurchaseReturn = 0;
    let totalSupplierPayment = 0;

    /*
      PURCHASE
    */

    allPurchases.forEach(
      (purchase) => {
        totalPurchase += number(
          purchase.totalAmount
        );

        totalPurchasePaid += number(
          purchase.paidAmount
        );
      }
    );

    /*
      PURCHASE RETURN
    */

    allPurchaseReturns.forEach(
      (item) => {
        totalPurchaseReturn += number(
          item.totalAmount
        );
      }
    );

    /*
      SUPPLIER PAYMENT
    */

    allSupplierPayments.forEach(
      (payment) => {
        totalSupplierPayment += number(
          payment.amount
        );
      }
    );

    /*
      ============================================================
      ALL TIME NET BALANCE
      ============================================================

      Opening Due
      + Purchase
      - Purchase Return
      - Purchase Paid
      - Supplier Payment
    */

    const netBalance =
      supplierOpeningDue +
      totalPurchase -
      totalPurchaseReturn -
      totalPurchasePaid -
      totalSupplierPayment;

    const {
      dueBalance,
      advanceBalance,
    } =
      getBalanceParts(netBalance);

    /*
      ============================================================
      DATE FILTER
      ============================================================
    */

    const startDate =
      parseDateStart(fromDate);

    const endDate =
      parseDateEnd(toDate);

    /*
      ============================================================
      FILTERED TRANSACTIONS
      ============================================================
    */

    const filteredPurchaseWhere = {
      supplierId: {
        in: supplierIds,
      },
    };

    const filteredReturnWhere = {
      supplierId: {
        in: supplierIds,
      },
    };

    const filteredPaymentWhere = {
      supplierId: {
        in: supplierIds,
      },

      status: "COMPLETED",
    };

    if (startDate || endDate) {
      const purchaseDateFilter = {};
      const returnDateFilter = {};
      const paymentDateFilter = {};

      if (startDate) {
        purchaseDateFilter.gte =
          startDate;

        returnDateFilter.gte =
          startDate;

        paymentDateFilter.gte =
          startDate;
      }

      if (endDate) {
        purchaseDateFilter.lte =
          endDate;

        returnDateFilter.lte =
          endDate;

        paymentDateFilter.lte =
          endDate;
      }

      filteredPurchaseWhere.createdAt =
        purchaseDateFilter;

      filteredReturnWhere.createdAt =
        returnDateFilter;

      filteredPaymentWhere.paymentDate =
        paymentDateFilter;
    }

    const [
      filteredPurchases,
      filteredPurchaseReturns,
      filteredSupplierPayments,
    ] = await Promise.all([
      prisma.purchase.findMany({
        where:
          filteredPurchaseWhere,

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.purchaseReturn.findMany({
        where:
          filteredReturnWhere,

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.supplierPayment.findMany({
        where:
          filteredPaymentWhere,

        include: {
          supplier: true,
        },

        orderBy: {
          paymentDate: "asc",
        },
      }),
    ]);

    /*
      ============================================================
      TRANSACTIONS BEFORE FROM DATE
      ============================================================

      If From Date is selected:

      Opening Balance =
      Supplier Opening Due
      + Previous Purchases
      - Previous Returns
      - Previous Purchase Paid
      - Previous Supplier Payments
    */

    let previousPurchase = 0;
    let previousPurchasePaid = 0;
    let previousPurchaseReturn = 0;
    let previousSupplierPayment = 0;

    if (startDate) {
      /*
        Previous PURCHASE
      */

      allPurchases.forEach(
        (purchase) => {
          const date =
            new Date(
              purchase.createdAt
            );

          if (
            date < startDate
          ) {
            previousPurchase +=
              number(
                purchase.totalAmount
              );

            previousPurchasePaid +=
              number(
                purchase.paidAmount
              );
          }
        }
      );

      /*
        Previous PURCHASE RETURN
      */

      allPurchaseReturns.forEach(
        (item) => {
          const date =
            new Date(
              item.createdAt
            );

          if (
            date < startDate
          ) {
            previousPurchaseReturn +=
              number(
                item.totalAmount
              );
          }
        }
      );

      /*
        Previous SUPPLIER PAYMENT
      */

      allSupplierPayments.forEach(
        (payment) => {
          const date =
            new Date(
              payment.paymentDate
            );

          if (
            date < startDate
          ) {
            previousSupplierPayment +=
              number(
                payment.amount
              );
          }
        }
      );
    }

    /*
      ============================================================
      OPENING BALANCE
      ============================================================
    */

    const openingBalance =
      supplierOpeningDue +
      previousPurchase -
      previousPurchaseReturn -
      previousPurchasePaid -
      previousSupplierPayment;

    const openingDue =
      openingBalance > 0
        ? openingBalance
        : 0;

    const openingAdvance =
      openingBalance < 0
        ? Math.abs(
            openingBalance
          )
        : 0;

    /*
      ============================================================
      FILTERED PERIOD TOTALS
      ============================================================
    */

    let filteredTotalPurchase = 0;
    let filteredTotalPurchasePaid = 0;
    let filteredTotalPurchaseReturn = 0;
    let filteredTotalSupplierPayment = 0;

    filteredPurchases.forEach(
      (purchase) => {
        filteredTotalPurchase +=
          number(
            purchase.totalAmount
          );

        filteredTotalPurchasePaid +=
          number(
            purchase.paidAmount
          );
      }
    );

    filteredPurchaseReturns.forEach(
      (item) => {
        filteredTotalPurchaseReturn +=
          number(
            item.totalAmount
          );
      }
    );

    filteredSupplierPayments.forEach(
      (payment) => {
        filteredTotalSupplierPayment +=
          number(
            payment.amount
          );
      }
    );

    /*
      ============================================================
      PERIOD BALANCE
      ============================================================
    */

    const periodBalance =
      openingBalance +
      filteredTotalPurchase -
      filteredTotalPurchaseReturn -
      filteredTotalPurchasePaid -
      filteredTotalSupplierPayment;

    const periodDue =
      periodBalance > 0
        ? periodBalance
        : 0;

    const periodAdvance =
      periodBalance < 0
        ? Math.abs(
            periodBalance
          )
        : 0;

    /*
      ============================================================
      LEDGER
      ============================================================
    */

    const ledger = [];

    /*
      ============================================================
      OPENING BALANCE ROW
      ============================================================
    */

    /*
      Show Opening Balance when:

      1. From Date exists
      OR
      2. Supplier has Opening Due
    */

    if (
      startDate ||
      supplierOpeningDue > 0
    ) {
      ledger.push({
        id: "opening-balance",

        date:
          startDate ||
          new Date(),

        type: "OPENING BALANCE",

        reference: "OPENING",

        debit:
          openingBalance > 0
            ? money(openingBalance)
            : 0,

        credit:
          openingBalance < 0
            ? money(
                Math.abs(
                  openingBalance
                )
              )
            : 0,

        paymentMethod: "-",

        paymentBreakdown: null,

        referenceNo: null,

        note:
          openingBalance > 0
            ? "Opening Due carried forward"
            : openingBalance < 0
            ? "Opening Advance carried forward"
            : "Opening Balance",

        sortOrder: 0,
      });
    }

    /*
      ============================================================
      PURCHASE
      ============================================================
    */

    filteredPurchases.forEach(
      (purchase) => {
        ledger.push({
          id:
            `purchase-${purchase.id}`,

          date:
            purchase.createdAt,

          type: "PURCHASE",

          reference:
            purchase.purchaseNo ||
            `PUR-${purchase.id}`,

          debit:
            money(
              purchase.totalAmount
            ),

          credit: 0,

          paymentMethod: "-",

          paymentBreakdown: null,

          referenceNo: null,

          note:
            purchase.note ||
            null,

          sortOrder: 1,
        });

        /*
          Purchase Paid
        */

        if (
          number(
            purchase.paidAmount
          ) > 0
        ) {
          ledger.push({
            id:
              `purchase-paid-${purchase.id}`,

            date:
              purchase.createdAt,

            type:
              "PURCHASE PAYMENT",

            reference:
              purchase.purchaseNo ||
              `PUR-${purchase.id}`,

            debit: 0,

            credit:
              money(
                purchase.paidAmount
              ),

            paymentMethod:
              "PURCHASE",

            paymentBreakdown:
              null,

            referenceNo:
              null,

            note:
              null,

            sortOrder: 2,
          });
        }
      }
    );

    /*
      ============================================================
      PURCHASE RETURN
      ============================================================
    */

    filteredPurchaseReturns.forEach(
      (item) => {
        ledger.push({
          id:
            `purchase-return-${item.id}`,

          date:
            item.createdAt,

          type:
            "PURCHASE RETURN",

          reference:
            item.returnNo ||
            `RET-${item.id}`,

          debit: 0,

          credit:
            money(
              item.totalAmount
            ),

          paymentMethod: "-",

          paymentBreakdown:
            null,

          referenceNo:
            null,

          note:
            item.note ||
            null,

          sortOrder: 3,
        });
      }
    );

    /*
      ============================================================
      SUPPLIER PAYMENT
      ============================================================
    */

    filteredSupplierPayments.forEach(
      (payment) => {
        let breakdown = [];

        if (
          payment.paymentBreakdown &&
          Array.isArray(
            payment.paymentBreakdown
          )
        ) {
          breakdown =
            payment.paymentBreakdown;
        }

        ledger.push({
          id:
            `payment-${payment.id}`,

          date:
            payment.paymentDate,

          type: "PAYMENT",

          reference:
            payment.paymentNo ||
            `PAY-${payment.id}`,

          debit: 0,

          credit:
            money(
              payment.amount
            ),

          paymentMethod:
            payment.paymentMethod ||
            "CASH",

          paymentBreakdown:
            breakdown,

          referenceNo:
            payment.referenceNo ||
            null,

          note:
            payment.note ||
            null,

          sortOrder: 4,
        });
      }
    );

    /*
      ============================================================
      SORT LEDGER
      ============================================================
    */

    ledger.sort(
      (a, b) => {
        const dateDifference =
          new Date(
            a.date
          ).getTime() -
          new Date(
            b.date
          ).getTime();

        if (
          dateDifference !== 0
        ) {
          return dateDifference;
        }

        return (
          number(
            a.sortOrder
          ) -
          number(
            b.sortOrder
          )
        );
      }
    );

    /*
      ============================================================
      RUNNING BALANCE
      ============================================================
    */

    let runningBalance =
      openingBalance;

    const finalLedger =
      ledger.map(
        (item) => {
          /*
            Opening row already
            contains opening balance.

            So don't add it twice.
          */

          if (
            item.type !==
            "OPENING BALANCE"
          ) {
            runningBalance =
              runningBalance +
              number(
                item.debit
              ) -
              number(
                item.credit
              );
          }

          const balance =
            money(
              runningBalance
            );

          return {
            ...item,

            balance,

            balanceType:
              balance < 0
                ? "ADVANCE"
                : "DUE",
          };
        }
      );

    /*
      ============================================================
      PAYMENT HISTORY
      ============================================================
    */

    const payments =
      filteredSupplierPayments.map(
        (payment) => {
          let breakdown = [];

          if (
            payment.paymentBreakdown &&
            Array.isArray(
              payment.paymentBreakdown
            )
          ) {
            breakdown =
              payment.paymentBreakdown;
          }

          return {
            id:
              payment.id,

            paymentNo:
              payment.paymentNo,

            paymentDate:
              payment.paymentDate,

            supplierId:
              payment.supplierId,

            supplierName:
              payment.supplier?.name ||
              "-",

            amount:
              money(
                payment.amount
              ),

            paymentMethod:
              payment.paymentMethod ||
              "CASH",

            paymentBreakdown:
              breakdown,

            referenceNo:
              payment.referenceNo ||
              "",

            note:
              payment.note ||
              "",

            status:
              payment.status,
          };
        }
      );

    /*
      ============================================================
      SUPPLIER LIST BALANCE
      ============================================================

      IMPORTANT:

      Supplier Opening Due is included.
    */

    const supplierList =
      await Promise.all(
        suppliers.map(
          async (
            supplier
          ) => {
            const [
              supplierPurchases,
              supplierReturns,
              supplierPaymentsData,
            ] =
              await Promise.all([
                prisma.purchase.findMany({
                  where: {
                    supplierId:
                      supplier.id,
                  },
                }),

                prisma.purchaseReturn.findMany({
                  where: {
                    supplierId:
                      supplier.id,
                  },
                }),

                prisma.supplierPayment.findMany({
                  where: {
                    supplierId:
                      supplier.id,

                    status:
                      "COMPLETED",
                  },
                }),
              ]);

            const purchaseTotal =
              supplierPurchases.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  number(
                    item.totalAmount
                  ),
                0
              );

            const purchasePaid =
              supplierPurchases.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  number(
                    item.paidAmount
                  ),
                0
              );

            const returnTotal =
              supplierReturns.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  number(
                    item.totalAmount
                  ),
                0
              );

            const paymentTotal =
              supplierPaymentsData.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  number(
                    item.amount
                  ),
                0
              );

            /*
              IMPORTANT:

              Opening Due is included
              in supplier balance.
            */

            const balance =
              number(
                supplier.openingDue
              ) +
              purchaseTotal -
              returnTotal -
              purchasePaid -
              paymentTotal;

            const {
              dueBalance:
                supplierDue,
              advanceBalance:
                supplierAdvance,
            } =
              getBalanceParts(
                balance
              );

            return {
              ...supplier,

              openingDue:
                money(
                  supplier.openingDue
                ),

              netBalance:
                money(balance),

              currentBalance:
                money(
                  supplierDue
                ),

              dueBalance:
                money(
                  supplierDue
                ),

              advanceBalance:
                money(
                  supplierAdvance
                ),
            };
          }
        )
      );

    /*
      ============================================================
      RESPONSE
      ============================================================
    */

    return NextResponse.json({
      suppliers:
        supplierList,

      /*
        ALL TIME SUMMARY
      */

      summary: {
        openingBalance:
          money(
            supplierOpeningDue
          ),

        openingDue:
          money(
            supplierOpeningDue
          ),

        openingAdvance:
          money(
            supplierOpeningAdvance
          ),

        totalPurchase:
          money(
            totalPurchase
          ),

        totalPurchasePaid:
          money(
            totalPurchasePaid
          ),

        totalPurchaseReturn:
          money(
            totalPurchaseReturn
          ),

        totalSupplierPayment:
          money(
            totalSupplierPayment
          ),

        netBalance:
          money(
            netBalance
          ),

        currentBalance:
          money(
            dueBalance
          ),

        dueBalance:
          money(
            dueBalance
          ),

        advanceBalance:
          money(
            advanceBalance
          ),
      },

      /*
        FILTERED SUMMARY
      */

      filteredSummary: {
        openingBalance:
          money(
            openingBalance
          ),

        openingDue:
          money(
            openingDue
          ),

        openingAdvance:
          money(
            openingAdvance
          ),

        totalPurchase:
          money(
            filteredTotalPurchase
          ),

        totalPurchasePaid:
          money(
            filteredTotalPurchasePaid
          ),

        totalPurchaseReturn:
          money(
            filteredTotalPurchaseReturn
          ),

        totalSupplierPayment:
          money(
            filteredTotalSupplierPayment
          ),

        periodBalance:
          money(
            periodBalance
          ),

        periodDue:
          money(
            periodDue
          ),

        periodAdvance:
          money(
            periodAdvance
          ),
      },

      ledger:
        finalLedger,

      payments,
    });
  } catch (error) {
    console.error(
      "SUPPLIER LEDGER GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load supplier ledger",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ============================================================
  CREATE SUPPLIER PAYMENT
  ============================================================
*/

export async function POST(request) {
  try {
    const body =
      await request.json();

    const {
      supplierId,
      paymentDate,
      amount,
      paymentMethod,
      paymentBreakdown,
      referenceNo,
      note,
    } = body;

    /*
      Supplier required
    */

    if (!supplierId) {
      return NextResponse.json(
        {
          error:
            "Supplier is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Check supplier
    */

    const supplier =
      await prisma.supplier.findUnique({
        where: {
          id: Number(
            supplierId
          ),
        },
      });

    if (!supplier) {
      return NextResponse.json(
        {
          error:
            "Supplier not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      ============================================================
      PAYMENT AMOUNT
      ============================================================
    */

    let finalAmount =
      number(amount);

    /*
      ============================================================
      PAYMENT BREAKDOWN
      ============================================================
    */

    let breakdown = [];

    if (
      Array.isArray(
        paymentBreakdown
      )
    ) {
      breakdown =
        paymentBreakdown
          .filter(
            (item) =>
              number(
                item.amount
              ) > 0
          )
          .map(
            (item) => ({
              method:
                item.method ||
                "CASH",

              amount:
                number(
                  item.amount
                ),

              referenceNo:
                item.referenceNo ||
                "",
            })
          );
    }

    /*
      If breakdown exists,
      calculate final amount
      from breakdown.
    */

    if (
      breakdown.length > 0
    ) {
      finalAmount =
        breakdown.reduce(
          (
            sum,
            item
          ) =>
            sum +
            number(
              item.amount
            ),
          0
        );
    }

    /*
      Payment > 0
    */

    if (
      finalAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      ============================================================
      PAYMENT METHOD
      ============================================================
    */

    const uniqueMethods =
      [
        ...new Set(
          breakdown.map(
            (item) =>
              item.method
          )
        ),
      ];

    let finalPaymentMethod =
      paymentMethod ||
      "CASH";

    if (
      uniqueMethods.length >
      1
    ) {
      finalPaymentMethod =
        "MULTI";
    } else if (
      uniqueMethods.length ===
      1
    ) {
      finalPaymentMethod =
        uniqueMethods[0];
    }

    /*
      ============================================================
      GENERATE PAYMENT NUMBER
      ============================================================
    */

    const lastPayment =
      await prisma.supplierPayment.findFirst(
        {
          orderBy: {
            id: "desc",
          },

          select: {
            id: true,
          },
        }
      );

    const nextId =
      (lastPayment?.id || 0) +
      1;

    const paymentNo =
      `SPY-${String(
        nextId
      ).padStart(6, "0")}`;

    /*
      ============================================================
      IMPORTANT ACCOUNTING RULE
      ============================================================

      Payment is allowed even if:

      Current Due = 0

      Example:

      Due = 0
      Payment = 5,000

      Result:
      Advance = 5,000

      Example:

      Due = 3,000
      Payment = 5,000

      Result:
      Advance = 2,000

      No restriction here.
    */

    const payment =
      await prisma.supplierPayment.create(
        {
          data: {
            paymentNo,

            supplierId:
              Number(
                supplierId
              ),

            paymentDate:
              paymentDate
                ? new Date(
                    `${paymentDate}T00:00:00`
                  )
                : new Date(),

            amount:
              finalAmount,

            paymentMethod:
              finalPaymentMethod,

            paymentBreakdown:
              breakdown.length >
              0
                ? breakdown
                : null,

            referenceNo:
              referenceNo ||
              null,

            note:
              note ||
              null,

            status:
              "COMPLETED",
          },
        }
      );

    /*
      ============================================================
      RESPONSE
      ============================================================
    */

    return NextResponse.json({
      success: true,

      message:
        "Supplier payment saved successfully.",

      payment: {
        id:
          payment.id,

        paymentNo:
          payment.paymentNo,

        amount:
          money(
            payment.amount
          ),

        paymentMethod:
          payment.paymentMethod,
      },
    });
  } catch (error) {
    console.error(
      "SUPPLIER PAYMENT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to save supplier payment",
      },
      {
        status: 500,
      }
    );
  }
}