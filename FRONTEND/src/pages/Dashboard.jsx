import { useEffect, useState } from "react";
import {
    getInfluencers,
    getCampaigns,
    getOutreachMessages,
    checkBackendHealth,
} from "../services/api";

function Dashboard({ onNavigate }) {

    const [influencers, setInfluencers] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [outreachMessages, setOutreachMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [backendStatus, setBackendStatus] = useState("Checking...");
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {

        setLoading(true);
        setError("");

        try {

            await checkBackendHealth();

            setBackendStatus("Backend Connected");

            const influencerData =
                await getInfluencers();

            setInfluencers(
                Array.isArray(influencerData)
                    ? influencerData
                    : []
            );

            try {

                const campaignData =
                    await getCampaigns();

                setCampaigns(
                    Array.isArray(campaignData)
                        ? campaignData
                        : []
                );

            } catch (campaignError) {

                console.error(
                    "Campaign loading error:",
                    campaignError
                );

                /*
                 Don't make the entire dashboard
                 look broken because campaigns
                 endpoint failed.
                */

                setCampaigns([]);

                setError(
                    "Campaign data could not be loaded."
                );
            }

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            setBackendStatus(
                "Backend Offline"
            );

            setError(
                "Unable to connect to the backend."
            );

        } finally {

            setLoading(false);
        }
    }

    const totalInfluencers =
        influencers.length;

    const activeCampaigns =
        campaigns.length;

    const aiMatches =
        outreachMessages.length;

    const outreachSent =
        outreachMessages.filter(
            item =>
                String(item.status)
                    .toLowerCase() === "sent"
        ).length;

    const latestCampaign =
        campaigns.length > 0
            ? campaigns[
                campaigns.length - 1
            ]
            : null;

    return (
        <div className="page">

            {/* HEADER */}

            <div className="dashboard-header">

                <div>
                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        AI-powered influencer discovery
                        & outreach
                    </p>
                </div>

                <div
                    className={
                        backendStatus ===
                        "Backend Connected"
                            ? "backend-status connected"
                            : "backend-status disconnected"
                    }
                >
                    <span className="status-dot"></span>

                    {backendStatus}
                </div>

            </div>


            {/* WELCOME */}

            <div className="dashboard-welcome">

                <h2>
                    Welcome back 👋
                </h2>

                <p>
                    Discover the right influencers,
                    match them with campaigns,
                    and manage personalized
                    outreach from one place.
                </p>

            </div>


            {/* ERROR */}

            {error && (
                <div className="form-message">
                    {error}
                </div>
            )}


            {/* STATS */}

            <div className="stats-grid">

                <div className="stat-card">
                    <span className="stat-label">
                        Total Influencers
                    </span>

                    <strong className="stat-value">
                        {loading
                            ? "—"
                            : totalInfluencers}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        Active Campaigns
                    </span>

                    <strong className="stat-value">
                        {loading
                            ? "—"
                            : activeCampaigns}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        AI Matches
                    </span>

                    <strong className="stat-value">
                        {loading
                            ? "—"
                            : aiMatches}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        Outreach Sent
                    </span>

                    <strong className="stat-value">
                        {loading
                            ? "—"
                            : outreachSent}
                    </strong>
                </div>

            </div>


            {/* RECENT CAMPAIGN */}

            <div className="section-title">
                Recent Campaign
            </div>

            {latestCampaign ? (

                <div className="recent-campaign-card">

                    <div>

                        <h2>
                            {
                                latestCampaign.brand_name
                            }
                        </h2>

                        <p>
                            {
                                latestCampaign.industry
                            }

                            {" · "}

                            {
                                latestCampaign
                                    .campaign_description
                            }
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={() =>
                            onNavigate("campaigns")
                        }
                    >
                        View Campaign
                    </button>

                </div>

            ) : (

                <div className="empty-state">

                    <h2>
                        No campaigns yet
                    </h2>

                    <p>
                        Create your first campaign
                        to start discovering
                        influencers.
                    </p>

                </div>

            )}


            {/* ACTIONS */}

            <div className="dashboard-actions">

                <button
                    className="primary-button"
                    onClick={() =>
                        onNavigate("influencers")
                    }
                >
                    Discover Influencers
                </button>

                <button
                    className="secondary-button"
                    onClick={() =>
                        onNavigate("campaigns")
                    }
                >
                    Create Campaign
                </button>

                <button
                    className="secondary-button"
                    onClick={() =>
                        onNavigate("outreach")
                    }
                >
                    Manage Outreach
                </button>

            </div>

        </div>
    );
}

export default Dashboard;