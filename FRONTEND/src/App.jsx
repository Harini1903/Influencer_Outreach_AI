import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Influencers from "./pages/Influencers";
import Campaigns from "./pages/Campaigns";
import Outreach from "./pages/Outreach";

import "./App.css";

function App() {
    const [currentPage, setCurrentPage] = useState("dashboard");

    const navigation = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "⌂",
        },
        {
            id: "influencers",
            label: "Influencers",
            icon: "◎",
        },
        {
            id: "campaigns",
            label: "Campaigns",
            icon: "▣",
        },
        {
            id: "outreach",
            label: "Outreach",
            icon: "✉",
        },
    ];

    function renderPage() {
        switch (currentPage) {
            case "dashboard":
                return <Dashboard />;

            case "influencers":
                return <Influencers />;

            case "campaigns":
                return <Campaigns />;

            case "outreach":
                return <Outreach />;

            default:
                return <Dashboard />;
        }
    }

    return (
        <div className="app-shell">

            {/* SIDEBAR */}
            <aside className="sidebar">

                {/* BRAND */}
                <div className="brand">

                    <div className="brand-logo">
                        <span>I</span>
                    </div>

                    <div className="brand-text">
                        <div className="brand-name">
                            Influence<span>AI</span>
                        </div>

                        <div className="brand-tagline">
                            Creator Intelligence
                        </div>
                    </div>

                </div>

                {/* WORKSPACE */}
                <div className="workspace-label">
                    WORKSPACE
                </div>

                {/* NAVIGATION */}
                <nav className="sidebar-nav">

                    {navigation.map((item) => (
                        <button
                            key={item.id}
                            className={
                                currentPage === item.id
                                    ? "sidebar-nav-item active"
                                    : "sidebar-nav-item"
                            }
                            onClick={() =>
                                setCurrentPage(item.id)
                            }
                        >
                            <span className="nav-icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.label}
                            </span>
                        </button>
                    ))}

                </nav>

                {/* SIDEBAR BOTTOM */}
                <div className="sidebar-bottom">

                    <div className="system-card">

                        <div className="system-indicator">
                            <span></span>
                        </div>

                        <div>
                            <div className="system-title">
                                System Online
                            </div>

                            <div className="system-subtitle">
                                All services operational
                            </div>
                        </div>

                    </div>

                    <div className="sidebar-footer">
                        <span>InfluenceAI</span>
                        <span>v1.0</span>
                    </div>

                </div>

            </aside>

            {/* MAIN AREA */}
            <div className="main-area">

                {/* TOP BAR */}
                <header className="topbar">

                    <div className="breadcrumb">
                        <span>Workspace</span>
                        <span className="breadcrumb-separator">
                            /
                        </span>
                        <strong>
                            {navigation.find(
                                (item) =>
                                    item.id === currentPage
                            )?.label}
                        </strong>
                    </div>

                    <div className="topbar-right">

                        <div className="connection-status">
                            <span className="connection-dot"></span>
                            Backend Connected
                        </div>

                        <div className="profile">

                            <div className="profile-avatar">
                                H
                            </div>

                            <div className="profile-info">
                                <strong>Harini</strong>
                                <span>Admin</span>
                            </div>

                        </div>

                    </div>

                </header>

                {/* PAGE */}
                <main className="content">
                    {renderPage()}
                </main>

            </div>

        </div>
    );
}

export default App;