import { useEffect, useMemo, useState } from "react";
import { getInfluencers } from "../services/api";

function Influencers() {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [platformFilter, setPlatformFilter] = useState("All");

    useEffect(() => {
        loadInfluencers();
    }, []);

    async function loadInfluencers() {
        setLoading(true);
        setError("");

        try {
            const data = await getInfluencers();
            setInfluencers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Influencer loading error:", err);
            setError(
                err.message || "Failed to load influencers."
            );
        } finally {
            setLoading(false);
        }
    }

    const platforms = useMemo(() => {
        const values = influencers
            .map((item) => item.platform)
            .filter(Boolean)
            .map((item) => String(item));

        return ["All", ...new Set(values)];
    }, [influencers]);

    const filteredInfluencers = useMemo(() => {
        const query = search.toLowerCase().trim();

        return influencers.filter((influencer) => {
            const name = String(
                influencer.full_name ||
                    influencer.name ||
                    ""
            ).toLowerCase();

            const niche = String(
                influencer.niche ||
                    influencer.category ||
                    ""
            ).toLowerCase();

            const platform = String(
                influencer.platform || ""
            );

            const matchesSearch =
                !query ||
                name.includes(query) ||
                niche.includes(query) ||
                platform.toLowerCase().includes(query);

            const matchesPlatform =
                platformFilter === "All" ||
                platform === platformFilter;

            return matchesSearch && matchesPlatform;
        });
    }, [influencers, search, platformFilter]);

    function formatFollowers(value) {
        const number = Number(value || 0);

        if (number >= 1000000) {
            return `${(number / 1000000).toFixed(1)}M`;
        }

        if (number >= 1000) {
            return `${(number / 1000).toFixed(1)}K`;
        }

        return number.toLocaleString();
    }

    function formatEngagement(value) {
        const number = Number(value || 0);
        return `${number.toFixed(2)}%`;
    }

    function getInitials(name) {
        if (!name) return "I";

        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }

    function getPlatformLabel(platform) {
        if (!platform) return "Creator";

        return String(platform)
            .charAt(0)
            .toUpperCase() +
            String(platform).slice(1);
    }

    return (
        <div className="influencers-page">
            <style>{`
                .influencers-page {
                    width: 100%;
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 34px 42px 70px;
                    box-sizing: border-box;
                }

                .influencers-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: #94a3b8;
                    margin-bottom: 28px;
                }

                .influencers-breadcrumb strong {
                    color: #334155;
                }

                .influencers-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 24px;
                    margin-bottom: 28px;
                }

                .influencers-title {
                    margin: 0;
                    font-size: 42px;
                    line-height: 1.05;
                    font-weight: 800;
                    letter-spacing: -1.5px;
                    color: #0f172a;
                }

                .influencers-subtitle {
                    margin: 10px 0 0;
                    color: #64748b;
                    font-size: 17px;
                    line-height: 1.5;
                }

                .influencers-count {
                    min-width: 115px;
                    padding: 13px 18px;
                    border: 1px solid #dbe4f0;
                    border-radius: 14px;
                    background: #ffffff;
                    text-align: center;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
                }

                .influencers-count-number {
                    display: block;
                    font-size: 24px;
                    font-weight: 800;
                    color: #2563eb;
                }

                .influencers-count-label {
                    display: block;
                    margin-top: 2px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                }

                .influencers-toolbar {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    padding: 16px;
                    margin-bottom: 28px;
                    border: 1px solid #dbe4f0;
                    border-radius: 18px;
                    background: #ffffff;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
                }

                .influencers-search-wrapper {
                    position: relative;
                    flex: 1;
                }

                .influencers-search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 17px;
                    pointer-events: none;
                }

                .influencers-search {
                    width: 100%;
                    height: 46px;
                    padding: 0 16px 0 43px;
                    border: 1px solid #dbe4f0;
                    border-radius: 11px;
                    background: #f8fafc;
                    color: #0f172a;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                }

                .influencers-search:focus {
                    border-color: #2563eb;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
                }

                .influencers-filter {
                    height: 46px;
                    min-width: 145px;
                    padding: 0 38px 0 14px;
                    border: 1px solid #dbe4f0;
                    border-radius: 11px;
                    background: #f8fafc;
                    color: #334155;
                    font-size: 14px;
                    font-weight: 600;
                    outline: none;
                    cursor: pointer;
                }

                .influencers-refresh {
                    height: 46px;
                    padding: 0 18px;
                    border: 0;
                    border-radius: 11px;
                    background: #2563eb;
                    color: white;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .influencers-refresh:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .influencers-refresh:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .influencers-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                }

                .influencer-card {
                    position: relative;
                    overflow: hidden;
                    padding: 24px;
                    border: 1px solid #dbe4f0;
                    border-radius: 20px;
                    background: #ffffff;
                    box-shadow: 0 8px 25px rgba(15, 23, 42, 0.045);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        border-color 0.2s ease;
                }

                .influencer-card:hover {
                    transform: translateY(-3px);
                    border-color: #c7d7f5;
                    box-shadow: 0 15px 35px rgba(15, 23, 42, 0.09);
                }

                .influencer-card::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(
                        90deg,
                        #2563eb,
                        #6366f1
                    );
                }

                .influencer-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 15px;
                }

                .influencer-identity {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 0;
                }

                .influencer-avatar {
                    width: 50px;
                    height: 50px;
                    min-width: 50px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(
                        135deg,
                        #2563eb,
                        #4f46e5
                    );
                    color: white;
                    font-size: 15px;
                    font-weight: 800;
                    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
                }

                .influencer-name {
                    margin: 0;
                    color: #0f172a;
                    font-size: 18px;
                    font-weight: 800;
                    line-height: 1.25;
                }

                .influencer-platform {
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 13px;
                }

                .influencer-status {
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: #ecfdf5;
                    color: #15803d;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                    white-space: nowrap;
                }

                .influencer-handle {
                    margin-top: 18px;
                    color: #64748b;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .influencer-niche {
                    display: inline-flex;
                    align-items: center;
                    margin-top: 12px;
                    padding: 7px 11px;
                    border-radius: 8px;
                    background: #eff6ff;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                }

                .influencer-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 20px;
                    padding-top: 18px;
                    border-top: 1px solid #edf2f7;
                }

                .influencer-stat {
                    padding: 12px;
                    border-radius: 12px;
                    background: #f8fafc;
                }

                .influencer-stat-label {
                    display: block;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                }

                .influencer-stat-value {
                    display: block;
                    margin-top: 5px;
                    color: #0f172a;
                    font-size: 18px;
                    font-weight: 800;
                }

                .influencer-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-top: 18px;
                }

                .influencer-availability {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 600;
                }

                .profile-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 9px 13px;
                    border: 1px solid #dbe4f0;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 800;
                    text-decoration: none;
                    transition: 0.2s ease;
                }

                .profile-button:hover {
                    border-color: #2563eb;
                    background: #eff6ff;
                }

                .influencers-empty {
                    padding: 65px 30px;
                    border: 1px dashed #cbd5e1;
                    border-radius: 20px;
                    background: #ffffff;
                    text-align: center;
                }

                .influencers-empty-icon {
                    width: 58px;
                    height: 58px;
                    margin: 0 auto 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 16px;
                    background: #eff6ff;
                    color: #2563eb;
                    font-size: 24px;
                }

                .influencers-empty h3 {
                    margin: 0;
                    color: #0f172a;
                    font-size: 20px;
                }

                .influencers-empty p {
                    margin: 8px 0 0;
                    color: #64748b;
                }

                .influencers-error {
                    margin-bottom: 20px;
                    padding: 14px 16px;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    background: #fef2f2;
                    color: #b91c1c;
                    font-size: 14px;
                }

                .influencers-loading {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                }

                .influencer-skeleton {
                    height: 260px;
                    border-radius: 20px;
                    background: linear-gradient(
                        90deg,
                        #e2e8f0 25%,
                        #f1f5f9 50%,
                        #e2e8f0 75%
                    );
                    background-size: 200% 100%;
                    animation: influencerShimmer 1.5s infinite;
                }

                @keyframes influencerShimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }

                @media (max-width: 900px) {
                    .influencers-page {
                        padding: 28px 24px 60px;
                    }

                    .influencers-grid,
                    .influencers-loading {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 650px) {
                    .influencers-page {
                        padding: 22px 16px 50px;
                    }

                    .influencers-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .influencers-title {
                        font-size: 34px;
                    }

                    .influencers-toolbar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .influencers-search-wrapper {
                        width: 100%;
                    }

                    .influencers-filter,
                    .influencers-refresh {
                        width: 100%;
                    }

                    .influencer-footer {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }
            `}</style>

            <div className="influencers-breadcrumb">
                <span>Workspace</span>
                <span>/</span>
                <strong>Influencers</strong>
            </div>

            <div className="influencers-header">
                <div>
                    <h1 className="influencers-title">
                        Influencers
                    </h1>

                    <p className="influencers-subtitle">
                        Discover and manage your influencer database.
                    </p>
                </div>

                <div className="influencers-count">
                    <span className="influencers-count-number">
                        {influencers.length}
                    </span>

                    <span className="influencers-count-label">
                        Creators
                    </span>
                </div>
            </div>

            {error && (
                <div className="influencers-error">
                    {error}
                </div>
            )}

            <div className="influencers-toolbar">
                <div className="influencers-search-wrapper">
                    <span className="influencers-search-icon">
                        ⌕
                    </span>

                    <input
                        className="influencers-search"
                        type="text"
                        placeholder="Search creators, niches, platforms..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <select
                    className="influencers-filter"
                    value={platformFilter}
                    onChange={(event) =>
                        setPlatformFilter(event.target.value)
                    }
                >
                    {platforms.map((platform) => (
                        <option
                            key={platform}
                            value={platform}
                        >
                            {platform}
                        </option>
                    ))}
                </select>

                <button
                    className="influencers-refresh"
                    onClick={loadInfluencers}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            {loading ? (
                <div className="influencers-loading">
                    <div className="influencer-skeleton"></div>
                    <div className="influencer-skeleton"></div>
                    <div className="influencer-skeleton"></div>
                    <div className="influencer-skeleton"></div>
                </div>
            ) : filteredInfluencers.length === 0 ? (
                <div className="influencers-empty">
                    <div className="influencers-empty-icon">
                        ◉
                    </div>

                    <h3>
                        No influencers found
                    </h3>

                    <p>
                        Try changing your search or filter.
                    </p>
                </div>
            ) : (
                <div className="influencers-grid">
                    {filteredInfluencers.map((influencer) => {
                        const name =
                            influencer.full_name ||
                            influencer.name ||
                            "Unknown Creator";

                        const platform =
                            influencer.platform ||
                            "Creator";

                        const niche =
                            influencer.niche ||
                            influencer.category ||
                            "Content Creator";

                        const followers =
                            influencer.followers ||
                            influencer.follower_count ||
                            0;

                        const engagement =
                            influencer.engagement_rate ||
                            0;

                        const handle =
                            influencer.username ||
                            influencer.handle ||
                            influencer.youtube_channel_id ||
                            "";

                        const availability =
                            influencer.availability ||
                            influencer.status ||
                            "Available";

                        const profileUrl =
                            influencer.profile_url ||
                            influencer.youtube_url ||
                            influencer.instagram_url ||
                            "";

                        return (
                            <div
                                className="influencer-card"
                                key={influencer.id}
                            >
                                <div className="influencer-top">
                                    <div className="influencer-identity">
                                        <div className="influencer-avatar">
                                            {getInitials(name)}
                                        </div>

                                        <div>
                                            <h3 className="influencer-name">
                                                {name}
                                            </h3>

                                            <div className="influencer-platform">
                                                {getPlatformLabel(platform)}
                                            </div>
                                        </div>
                                    </div>

                                    <span className="influencer-status">
                                        {availability}
                                    </span>
                                </div>

                                {handle && (
                                    <div className="influencer-handle">
                                        @{handle.replace(/^@/, "")}
                                    </div>
                                )}

                                <span className="influencer-niche">
                                    {niche}
                                </span>

                                <div className="influencer-stats">
                                    <div className="influencer-stat">
                                        <span className="influencer-stat-label">
                                            Followers
                                        </span>

                                        <span className="influencer-stat-value">
                                            {formatFollowers(
                                                followers
                                            )}
                                        </span>
                                    </div>

                                    <div className="influencer-stat">
                                        <span className="influencer-stat-label">
                                            Engagement
                                        </span>

                                        <span className="influencer-stat-value">
                                            {formatEngagement(
                                                engagement
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="influencer-footer">
                                    <span className="influencer-availability">
                                        ● {availability}
                                    </span>

                                    {profileUrl ? (
                                        <a
                                            className="profile-button"
                                            href={profileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Profile →
                                        </a>
                                    ) : (
                                        <span className="profile-button">
                                            Profile →
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Influencers;