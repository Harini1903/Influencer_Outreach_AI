import { useEffect, useState } from "react";
import {
    getCampaigns,
    createCampaign,
    matchCampaign,
} from "../services/api";

function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    const [creating, setCreating] = useState(false);
    const [matchingId, setMatchingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        brand_name: "",
        industry: "",
        target_niche: "",
        target_location: "",
        min_followers: "",
        max_followers: "",
        min_engagement_rate: "",
        campaign_description: "",
    });

    useEffect(() => {
        loadCampaigns();
    }, []);

    async function loadCampaigns() {
        try {
            setLoading(true);
            setError("");

            const data = await getCampaigns();

            setCampaigns(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load campaigns:", err);

            setError(
                err.message ||
                    "Unable to load campaigns."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleCreateCampaign(event) {
        event.preventDefault();

        setError("");
        setMessage("");

        if (
            !form.brand_name.trim() ||
            !form.industry.trim() ||
            !form.target_niche.trim() ||
            !form.target_location.trim() ||
            !form.campaign_description.trim()
        ) {
            setError(
                "Please fill in all required campaign details."
            );
            return;
        }

        if (
            form.min_followers &&
            form.max_followers &&
            Number(form.min_followers) >
                Number(form.max_followers)
        ) {
            setError(
                "Minimum followers cannot be greater than maximum followers."
            );
            return;
        }

        try {
            setCreating(true);

            const campaignData = {
                brand_name: form.brand_name.trim(),
                industry: form.industry.trim(),
                target_niche: form.target_niche.trim(),
                target_location:
                    form.target_location.trim(),

                min_followers:
                    form.min_followers === ""
                        ? null
                        : Number(form.min_followers),

                max_followers:
                    form.max_followers === ""
                        ? null
                        : Number(form.max_followers),

                min_engagement_rate:
                    form.min_engagement_rate === ""
                        ? null
                        : Number(
                              form.min_engagement_rate
                          ),

                campaign_description:
                    form.campaign_description.trim(),
            };

            const createdCampaign =
                await createCampaign(campaignData);

            setCampaigns((previous) => [
                createdCampaign,
                ...previous,
            ]);

            setForm({
                brand_name: "",
                industry: "",
                target_niche: "",
                target_location: "",
                min_followers: "",
                max_followers: "",
                min_engagement_rate: "",
                campaign_description: "",
            });

            setMessage(
                "Campaign created successfully."
            );
        } catch (err) {
            console.error(
                "Campaign creation error:",
                err
            );

            setError(
                err.message ||
                    "Failed to create campaign."
            );
        } finally {
            setCreating(false);
        }
    }

    async function handleFindInfluencers(campaignId) {
        setError("");
        setMessage("");
        setMatchingId(campaignId);

        try {
            const result =
                await matchCampaign(campaignId);

            const matchCount =
                result?.matches?.length || 0;

            setMessage(
                matchCount > 0
                    ? `${matchCount} influencers matched successfully.`
                    : "Campaign analyzed successfully, but no matching influencers were found."
            );
        } catch (err) {
            console.error(
                "Campaign matching error:",
                err
            );

            setError(
                err.message ||
                    "Failed to find matching influencers."
            );
        } finally {
            setMatchingId(null);
        }
    }

    function formatFollowers(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Any";
        }

        const number = Number(value);

        if (number >= 1000000) {
            return `${(
                number / 1000000
            ).toFixed(1)}M`;
        }

        if (number >= 1000) {
            return `${(
                number / 1000
            ).toFixed(1)}K`;
        }

        return number.toString();
    }

    function getInitials(name) {
        if (!name) return "C";

        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        <div className="campaigns-page">
            <style>{`
                .campaigns-page {
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 42px 42px 80px;
                    color: #0f172a;
                }

                .campaigns-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 30px;
                    margin-bottom: 32px;
                }

                .eyebrow {
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 1.8px;
                    color: #6b7da6;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }

                .campaigns-header h1 {
                    margin: 0;
                    font-size: 48px;
                    line-height: 1;
                    font-weight: 900;
                    letter-spacing: -1.8px;
                }

                .campaigns-header p {
                    margin: 14px 0 0;
                    color: #64748b;
                    font-size: 17px;
                    line-height: 1.6;
                }

                .campaign-count {
                    background: #eef4ff;
                    color: #2458d6;
                    border: 1px solid #dbe7ff;
                    border-radius: 999px;
                    padding: 11px 18px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .alert {
                    padding: 14px 18px;
                    border-radius: 12px;
                    margin-bottom: 22px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .alert-success {
                    background: #ecfdf3;
                    color: #087443;
                    border: 1px solid #bbf7d0;
                }

                .alert-error {
                    background: #fff1f2;
                    color: #be123c;
                    border: 1px solid #fecdd3;
                }

                .create-card {
                    background: white;
                    border: 1px solid #dce5f2;
                    border-radius: 22px;
                    padding: 34px;
                    margin-bottom: 42px;
                    box-shadow:
                        0 12px 40px rgba(15, 23, 42, 0.06);
                }

                .create-header {
                    display: flex;
                    gap: 18px;
                    align-items: flex-start;
                    margin-bottom: 30px;
                }

                .create-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(
                        135deg,
                        #2458d6,
                        #4d7cff
                    );
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: 400;
                    box-shadow:
                        0 8px 22px rgba(37, 88, 214, 0.25);
                }

                .create-header h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 900;
                }

                .create-header p {
                    margin: 6px 0 0;
                    color: #64748b;
                    line-height: 1.5;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 22px;
                }

                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .field.full {
                    grid-column: 1 / -1;
                }

                .field label {
                    font-size: 13px;
                    font-weight: 800;
                    color: #334155;
                }

                .field input,
                .field textarea {
                    width: 100%;
                    box-sizing: border-box;
                    border: 1px solid #d7e0ed;
                    border-radius: 11px;
                    padding: 14px 15px;
                    font-size: 14px;
                    font-family: inherit;
                    color: #0f172a;
                    background: #fbfcfe;
                    outline: none;
                    transition: 0.2s;
                }

                .field input:focus,
                .field textarea:focus {
                    border-color: #3970ed;
                    box-shadow:
                        0 0 0 4px rgba(59, 112, 237, 0.10);
                    background: white;
                }

                .field textarea {
                    min-height: 125px;
                    resize: vertical;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 24px;
                }

                .create-button {
                    border: none;
                    border-radius: 11px;
                    background: #2563eb;
                    color: white;
                    padding: 13px 23px;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow:
                        0 8px 20px rgba(37, 99, 235, 0.20);
                    transition: 0.2s;
                }

                .create-button:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .create-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 18px;
                }

                .section-header h2 {
                    margin: 0;
                    font-size: 25px;
                    font-weight: 900;
                }

                .section-header span {
                    color: #64748b;
                    font-size: 14px;
                }

                .campaign-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 22px;
                }

                .campaign-card {
                    background: white;
                    border: 1px solid #dce5f2;
                    border-radius: 20px;
                    padding: 25px;
                    min-height: 270px;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    transition:
                        transform 0.2s,
                        box-shadow 0.2s,
                        border-color 0.2s;
                }

                .campaign-card:hover {
                    transform: translateY(-3px);
                    border-color: #c8d7f4;
                    box-shadow:
                        0 18px 45px rgba(
                            15,
                            23,
                            42,
                            0.09
                        );
                }

                .campaign-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    align-items: flex-start;
                }

                .brand-block {
                    display: flex;
                    gap: 13px;
                    align-items: center;
                }

                .brand-avatar {
                    width: 46px;
                    height: 46px;
                    border-radius: 14px;
                    background: #eef3ff;
                    color: #2458d6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 14px;
                }

                .brand-block h3 {
                    margin: 0;
                    font-size: 19px;
                    font-weight: 900;
                }

                .brand-block p {
                    margin: 4px 0 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .status {
                    border-radius: 999px;
                    padding: 7px 12px;
                    background: #ecfdf3;
                    color: #087443;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }

                .campaign-description {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 20px 0;
                    min-height: 45px;
                }

                .campaign-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 22px;
                }

                .tag {
                    background: #f5f8fc;
                    border: 1px solid #e1e8f2;
                    border-radius: 8px;
                    padding: 7px 10px;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 700;
                }

                .campaign-footer {
                    margin-top: auto;
                    padding-top: 18px;
                    border-top: 1px solid #edf1f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                }

                .campaign-id {
                    color: #94a3b8;
                    font-size: 12px;
                    font-weight: 800;
                }

                .find-button {
                    border: none;
                    border-radius: 10px;
                    background: #0f172a;
                    color: white;
                    padding: 11px 16px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .find-button:hover {
                    background: #2563eb;
                }

                .find-button:disabled {
                    opacity: 0.55;
                    cursor: wait;
                }

                .empty-state {
                    background: white;
                    border: 1px dashed #cbd5e1;
                    border-radius: 20px;
                    padding: 50px 30px;
                    text-align: center;
                    color: #64748b;
                }

                .loading-state {
                    padding: 50px;
                    text-align: center;
                    color: #64748b;
                }

                @media (max-width: 900px) {
                    .campaigns-page {
                        padding: 30px 24px 60px;
                    }

                    .campaign-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 700px) {
                    .campaigns-header {
                        flex-direction: column;
                    }

                    .campaigns-header h1 {
                        font-size: 38px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .field.full {
                        grid-column: auto;
                    }

                    .create-card {
                        padding: 24px;
                    }
                }
            `}</style>

            {/* PAGE HEADER */}
            <div className="campaigns-header">
                <div>
                    <div className="eyebrow">
                        Campaign Management
                    </div>

                    <h1>Campaigns</h1>

                    <p>
                        Create campaigns and find the best
                        influencers using AI.
                    </p>
                </div>

                <div className="campaign-count">
                    {campaigns.length} campaigns
                </div>
            </div>

            {/* ALERTS */}
            {message && (
                <div className="alert alert-success">
                    ✓ {message}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* CREATE CAMPAIGN */}
            <div className="create-card">
                <div className="create-header">
                    <div className="create-icon">
                        +
                    </div>

                    <div>
                        <h2>
                            Create New Campaign
                        </h2>

                        <p>
                            Define your campaign
                            requirements and let AI find
                            the right creators.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleCreateCampaign}
                >
                    <div className="form-grid">
                        <div className="field">
                            <label>
                                Brand Name
                            </label>

                            <input
                                name="brand_name"
                                value={
                                    form.brand_name
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. FitLife"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Industry
                            </label>

                            <input
                                name="industry"
                                value={
                                    form.industry
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Health & Fitness"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Target Niche
                            </label>

                            <input
                                name="target_niche"
                                value={
                                    form.target_niche
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Fitness"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Target Location
                            </label>

                            <input
                                name="target_location"
                                value={
                                    form.target_location
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Chennai"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Minimum Followers
                            </label>

                            <input
                                type="number"
                                name="min_followers"
                                value={
                                    form.min_followers
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. 5000"
                                min="0"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Maximum Followers
                            </label>

                            <input
                                type="number"
                                name="max_followers"
                                value={
                                    form.max_followers
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. 100000"
                                min="0"
                            />
                        </div>

                        <div className="field">
                            <label>
                                Minimum Engagement Rate (%)
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                name="min_engagement_rate"
                                value={
                                    form.min_engagement_rate
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. 3.5"
                                min="0"
                            />
                        </div>

                        <div className="field full">
                            <label>
                                Campaign Description
                            </label>

                            <textarea
                                name="campaign_description"
                                value={
                                    form.campaign_description
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Describe your campaign, product, target audience and what you want from creators..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="create-button"
                            disabled={creating}
                        >
                            {creating
                                ? "Creating Campaign..."
                                : "Create Campaign →"}
                        </button>
                    </div>
                </form>
            </div>

            {/* CAMPAIGN LIST */}
            <div className="section-header">
                <h2>
                    Your Campaigns
                </h2>

                <span>
                    Manage campaigns and discover
                    creators
                </span>
            </div>

            {loading ? (
                <div className="loading-state">
                    Loading campaigns...
                </div>
            ) : campaigns.length === 0 ? (
                <div className="empty-state">
                    <h3>
                        No campaigns yet
                    </h3>

                    <p>
                        Create your first campaign
                        above to start finding
                        influencers.
                    </p>
                </div>
            ) : (
                <div className="campaign-grid">
                    {campaigns.map((campaign) => (
                        <div
                            className="campaign-card"
                            key={campaign.id}
                        >
                            <div className="campaign-top">
                                <div className="brand-block">
                                    <div className="brand-avatar">
                                        {getInitials(
                                            campaign.brand_name
                                        )}
                                    </div>

                                    <div>
                                        <h3>
                                            {campaign.brand_name ||
                                                "Untitled Campaign"}
                                        </h3>

                                        <p>
                                            {campaign.industry ||
                                                "General"}
                                            {" · "}
                                            {campaign.target_niche ||
                                                "All niches"}
                                        </p>
                                    </div>
                                </div>

                                <div className="status">
                                    ACTIVE
                                </div>
                            </div>

                            <p className="campaign-description">
                                {campaign.campaign_description ||
                                    "No campaign description provided."}
                            </p>

                            <div className="campaign-tags">
                                <div className="tag">
                                    📍{" "}
                                    {campaign.target_location ||
                                        "Any location"}
                                </div>

                                <div className="tag">
                                    👥{" "}
                                    {formatFollowers(
                                        campaign.min_followers
                                    )}
                                    {" – "}
                                    {formatFollowers(
                                        campaign.max_followers
                                    )}
                                </div>

                                <div className="tag">
                                    📈{" "}
                                    {campaign.min_engagement_rate
                                        ? `${campaign.min_engagement_rate}%+ engagement`
                                        : "Any engagement"}
                                </div>
                            </div>

                            <div className="campaign-footer">
                                <div className="campaign-id">
                                    Campaign #
                                    {campaign.id}
                                </div>

                                <button
                                    className="find-button"
                                    onClick={() =>
                                        handleFindInfluencers(
                                            campaign.id
                                        )
                                    }
                                    disabled={
                                        matchingId ===
                                        campaign.id
                                    }
                                >
                                    {matchingId ===
                                    campaign.id
                                        ? "Finding..."
                                        : "Find Influencers →"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Campaigns;