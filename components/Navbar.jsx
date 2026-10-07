"use client";

import { useState } from "react";

export default function Navbar() {

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="navbar">

      <div className="navbar-left">

        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your jewellery business
          </p>
        </div>

      </div>


      <div className="navbar-right">

        {/* Date */}

        <div className="today-date">
          <span>Today</span>
          <strong>
            26 September 2026
          </strong>
        </div>


        {/* Notification */}

        <div className="notification-wrapper">

          <button
            className="notification-btn"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
          >
            🔔

            <span className="notification-dot"></span>

          </button>


          {showNotifications && (

            <div className="notification-dropdown">

              <div className="notification-header">
                <strong>Notifications</strong>
                <span>3 New</span>
              </div>

              <div className="notification-item">
                <span>⚠</span>

                <div>
                  <strong>Low Stock Alert</strong>
                  <p>Gold Ring stock is low.</p>
                </div>
              </div>

              <div className="notification-item">
                <span>৳</span>

                <div>
                  <strong>Payment Due</strong>
                  <p>Customer payment is pending.</p>
                </div>
              </div>

              <div className="notification-item">
                <span>◇</span>

                <div>
                  <strong>Old Gold</strong>
                  <p>New old gold received.</p>
                </div>
              </div>

            </div>

          )}

        </div>


        {/* Profile */}

        <div className="profile">

          <div className="profile-avatar">
            A
          </div>

          <div className="profile-info">

            <strong>
              Admin
            </strong>

            <small>
              Administrator
            </small>

          </div>

          <span className="profile-arrow">
            ▾
          </span>

        </div>

      </div>

    </header>
  );
}