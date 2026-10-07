import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import DashboardCard from "../../components/DashboardCard";

export default function DashboardPage() {

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar />


        <div className="dashboard-container">


          {/* =====================================
              STATISTICS
          ===================================== */}

          <section className="stats-grid">

            <DashboardCard
              title="Today's Sales"
              value="৳ 1,25,500"
              subtitle="vs yesterday"
              trend="+12.5%"
              icon="৳"
              type="sales"
            />

            <DashboardCard
              title="Today's Purchase"
              value="৳ 85,200"
              subtitle="vs yesterday"
              trend="+8.2%"
              icon="↓"
              type="purchase"
            />

            <DashboardCard
              title="Gold Stock"
              value="1,245.50 g"
              subtitle="Total gold stock"
              trend="22K"
              icon="◈"
              type="gold"
            />

            <DashboardCard
              title="Customer Due"
              value="৳ 3,45,800"
              subtitle="48 customers"
              trend="Pending"
              icon="!"
              type="due"
            />

          </section>


          {/* =====================================
              SALES + GOLD RATE
          ===================================== */}

          <section className="dashboard-grid">


            {/* Sales Overview */}

            <div className="dashboard-panel sales-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Sales Overview
                  </h2>

                  <p>
                    Monthly sales performance
                  </p>

                </div>


                <select className="period-select">

                  <option>
                    Last 7 Months
                  </option>

                  <option>
                    Last 30 Days
                  </option>

                  <option>
                    This Year
                  </option>

                </select>

              </div>


              <div className="chart-area">

                <div className="chart-y-axis">

                  <span>৳ 5L</span>
                  <span>৳ 4L</span>
                  <span>৳ 3L</span>
                  <span>৳ 2L</span>
                  <span>৳ 1L</span>
                  <span>0</span>

                </div>


                <div className="chart-content">

                  <div className="chart-lines">

                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>

                  </div>


                  <div className="chart-bars">

                    <div
                      className="chart-column"
                      style={{ height: "42%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "60%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "48%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "73%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "58%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "88%" }}
                    >
                      <span></span>
                    </div>

                    <div
                      className="chart-column"
                      style={{ height: "70%" }}
                    >
                      <span></span>
                    </div>

                  </div>


                  <div className="chart-labels">

                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>

                  </div>

                </div>

              </div>

            </div>


            {/* Gold Rate */}

            <div className="dashboard-panel gold-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Today's Gold Rate
                  </h2>

                  <p>
                    Current selling rate
                  </p>

                </div>

                <span className="live-status">
                  ● Live
                </span>

              </div>


              <div className="gold-rate-list">

                <div className="gold-rate-item">

                  <div className="gold-name">
                    <span className="gold-circle">
                      24
                    </span>

                    <div>
                      <strong>24K Gold</strong>
                      <small>99.9% Purity</small>
                    </div>
                  </div>

                  <strong>
                    ৳ 18,250/g
                  </strong>

                </div>


                <div className="gold-rate-item">

                  <div className="gold-name">

                    <span className="gold-circle">
                      22
                    </span>

                    <div>
                      <strong>22K Gold</strong>
                      <small>91.6% Purity</small>
                    </div>

                  </div>

                  <strong>
                    ৳ 16,730/g
                  </strong>

                </div>


                <div className="gold-rate-item">

                  <div className="gold-name">

                    <span className="gold-circle">
                      21
                    </span>

                    <div>
                      <strong>21K Gold</strong>
                      <small>87.5% Purity</small>
                    </div>

                  </div>

                  <strong>
                    ৳ 15,970/g
                  </strong>

                </div>


                <div className="gold-rate-item">

                  <div className="gold-name">

                    <span className="gold-circle">
                      18
                    </span>

                    <div>
                      <strong>18K Gold</strong>
                      <small>75.0% Purity</small>
                    </div>

                  </div>

                  <strong>
                    ৳ 13,700/g
                  </strong>

                </div>


                <div className="gold-rate-item">

                  <div className="gold-name">

                    <span className="gold-circle silver">
                      Ag
                    </span>

                    <div>
                      <strong>Silver</strong>
                      <small>99.9% Purity</small>
                    </div>

                  </div>

                  <strong>
                    ৳ 250/g
                  </strong>

                </div>

              </div>


              <button className="rate-history-btn">
                View Rate History →
              </button>

            </div>

          </section>


          {/* =====================================
              RECENT SALES + QUICK ACTION
          ===================================== */}

          <section className="bottom-grid">


            {/* Recent Sales */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Recent Sales
                  </h2>

                  <p>
                    Latest jewellery transactions
                  </p>

                </div>

                <button className="view-btn">
                  View All →
                </button>

              </div>


              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>

                      <th>
                        INVOICE
                      </th>

                      <th>
                        CUSTOMER
                      </th>

                      <th>
                        PRODUCT
                      </th>

                      <th>
                        WEIGHT
                      </th>

                      <th>
                        AMOUNT
                      </th>

                      <th>
                        STATUS
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    <tr>

                      <td>
                        <strong>#INV-10025</strong>
                      </td>

                      <td>
                        Rahim Ahmed
                      </td>

                      <td>
                        Gold Ring
                      </td>

                      <td>
                        5.25g
                      </td>

                      <td>
                        ৳ 45,500
                      </td>

                      <td>
                        <span className="status paid">
                          Paid
                        </span>
                      </td>

                    </tr>


                    <tr>

                      <td>
                        <strong>#INV-10024</strong>
                      </td>

                      <td>
                        Karim Uddin
                      </td>

                      <td>
                        Gold Chain
                      </td>

                      <td>
                        9.80g
                      </td>

                      <td>
                        ৳ 82,000
                      </td>

                      <td>
                        <span className="status due-status">
                          Due
                        </span>
                      </td>

                    </tr>


                    <tr>

                      <td>
                        <strong>#INV-10023</strong>
                      </td>

                      <td>
                        Nusrat Jahan
                      </td>

                      <td>
                        Diamond Ring
                      </td>

                      <td>
                        4.15g
                      </td>

                      <td>
                        ৳ 1,25,000
                      </td>

                      <td>
                        <span className="status paid">
                          Paid
                        </span>
                      </td>

                    </tr>


                    <tr>

                      <td>
                        <strong>#INV-10022</strong>
                      </td>

                      <td>
                        Arif Hossain
                      </td>

                      <td>
                        Gold Bracelet
                      </td>

                      <td>
                        7.40g
                      </td>

                      <td>
                        ৳ 68,300
                      </td>

                      <td>
                        <span className="status paid">
                          Paid
                        </span>
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>


            {/* Quick Actions */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Frequently used actions
                  </p>

                </div>

              </div>


              <div className="quick-actions">

                <button>

                  <span className="quick-icon">
                    +
                  </span>

                  <div>
                    <strong>New Sale</strong>
                    <small>Create jewellery invoice</small>
                  </div>

                </button>


                <button>

                  <span className="quick-icon purchase">
                    +
                  </span>

                  <div>
                    <strong>New Purchase</strong>
                    <small>Purchase from supplier</small>
                  </div>

                </button>


                <button>

                  <span className="quick-icon old-gold">
                    ◇
                  </span>

                  <div>
                    <strong>Old Gold</strong>
                    <small>Receive old jewellery</small>
                  </div>

                </button>


                <button>

                  <span className="quick-icon customer">
                    ♙
                  </span>

                  <div>
                    <strong>Add Customer</strong>
                    <small>Create new customer</small>
                  </div>

                </button>

              </div>

            </div>

          </section>


          {/* =====================================
              BOTTOM INFORMATION
          ===================================== */}

          <section className="info-grid">


            {/* Low Stock */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Low Stock Alert
                  </h2>

                  <p>
                    Products requiring attention
                  </p>

                </div>

                <span className="alert-count">
                  4 Items
                </span>

              </div>


              <div className="stock-list">

                <div className="stock-item">

                  <div>
                    <strong>
                      Gold Ring - R102
                    </strong>

                    <small>
                      22K Gold
                    </small>
                  </div>

                  <span className="stock-warning">
                    2 pcs
                  </span>

                </div>


                <div className="stock-item">

                  <div>
                    <strong>
                      Gold Chain - C205
                    </strong>

                    <small>
                      22K Gold
                    </small>
                  </div>

                  <span className="stock-warning">
                    1 pcs
                  </span>

                </div>


                <div className="stock-item">

                  <div>
                    <strong>
                      Diamond Ring - D110
                    </strong>

                    <small>
                      Diamond
                    </small>
                  </div>

                  <span className="stock-warning">
                    1 pcs
                  </span>

                </div>

              </div>

            </div>


            {/* Customer Due */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Customer Due
                  </h2>

                  <p>
                    Recent outstanding payments
                  </p>

                </div>

                <button className="view-btn">
                  View All →
                </button>

              </div>


              <div className="due-list">

                <div className="due-item">

                  <div className="customer-mini">
                    RA
                  </div>

                  <div className="due-customer">

                    <strong>
                      Rahim Ahmed
                    </strong>

                    <small>
                      #INV-10018
                    </small>

                  </div>

                  <strong className="due-amount">
                    ৳ 25,000
                  </strong>

                </div>


                <div className="due-item">

                  <div className="customer-mini">
                    KU
                  </div>

                  <div className="due-customer">

                    <strong>
                      Karim Uddin
                    </strong>

                    <small>
                      #INV-10024
                    </small>

                  </div>

                  <strong className="due-amount">
                    ৳ 18,500
                  </strong>

                </div>


                <div className="due-item">

                  <div className="customer-mini">
                    NH
                  </div>

                  <div className="due-customer">

                    <strong>
                      Nusrat Jahan
                    </strong>

                    <small>
                      #INV-10012
                    </small>

                  </div>

                  <strong className="due-amount">
                    ৳ 12,800
                  </strong>

                </div>

              </div>

            </div>


          </section>

        </div>

      </main>

    </div>
  );
}