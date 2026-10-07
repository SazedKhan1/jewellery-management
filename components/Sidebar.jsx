"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    title: "Sales",
    href: "/sales",
    icon: "▣",
  },
  {
    title: "Purchase",
    href: "/purchase",
    icon: "◈",
  },
  {
    title: "Products",
    href: "/products",
    icon: "◆",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: "▤",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: "♙",
  },
  {
    title: "Old Gold",
    href: "/old-gold",
    icon: "◇",
  },
  {
    title: "Karigar",
    href: "/karigar",
    icon: "⚒",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "▥",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="logo-area">

        <div className="logo-icon">
          J
        </div>

        <div className="logo-text">
          <h2>Jewellery</h2>
          <span>Management System</span>
        </div>

      </div>


      {/* Main Menu */}

      <div className="menu-title">
        MAIN MENU
      </div>

      <nav className="sidebar-menu">

        {menuItems.map((item) => {

          const active = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`menu-item ${active ? "active" : ""}`}
            >

              <span className="menu-icon">
                {item.icon}
              </span>

              <span className="menu-label">
                {item.title}
              </span>

            </Link>
          );

        })}

      </nav>


      {/* Bottom */}

      <div className="sidebar-bottom">

        <Link
          href="/settings"
          className={`menu-item ${
            pathname === "/settings" ? "active" : ""
          }`}
        >

          <span className="menu-icon">
            ⚙
          </span>

          <span className="menu-label">
            Settings
          </span>

        </Link>

        <div className="menu-item logout">

          <span className="menu-icon">
            ↪
          </span>

          <span className="menu-label">
            Logout
          </span>

        </div>

      </div>

    </aside>
  );
}