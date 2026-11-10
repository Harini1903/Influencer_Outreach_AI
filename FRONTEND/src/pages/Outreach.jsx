import { useEffect, useMemo, useState } from "react";
import {
    getOutreachMessages,
    getInfluencers,
} from "../services/api";

function Outreach() {
    const [campaignId, setCampaignId] = useState("1");
    const [messages, setMessages] = useState([]);
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingInfluencers, setLoadingInfluencers] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadInfluencers();
        loadOutreach();
    }, []);

    async function loadInfluencers() {
        try {
            setLoadingInfluencers(true);

            const data = await getInfluencers();

            setInfluencers(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                "Failed to load influencers:",
                error
            );
        } finally {
            setLoadingInfluencers(false);
        }
    }

    async function loadOutreach() {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = await getOutreachMessages(
                campaignId
            );

            setMessages(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                "Failed to load outreach:",
                error
            );

            setError(
                error.message ||
                    "Unable to load outreach messages."
            );
        } finally {
            setLoading(false);
        }
    }

    function getInfluencerName(influencerId) {
        const influencer = influencers.find(
            (item) =>
                Number(item.id) ===
                Number(influencerId)
        );

        if (!influencer) {
            return `Influencer #${influencerId}`;
        }

        return (
            influencer.full_name ||
            influencer.name ||
            influencer.channel_name ||
            influencer.username ||
            `Influencer #${influencerId}`
        );
    }

    function getInfluencerInitials(name) {
        if (!name) return "I";

        const words = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    function getMessageContent(message) {
        return (
            message.message ||
            message.generated_message ||
            message.body ||
            message.content ||
            ""
        );
    }

    function getRecipientEmail(message) {
        return (
            message.recipient_email ||
            message.email ||
            message.to_email ||
            "No email available"
        );
    }

    function getStatus(message) {
        return (
            message.status ||
            "draft"
        ).toLowerCase();
    }

    function getStatusLabel(status) {
        switch (status) {
            case "sent":
                return "Sent";

            case "approved":
                return "Approved";

            case "rejected":
                return "Rejected";

            case "draft":
                return "Draft";

            default:
                return status;
        }
    }

    const stats = useMemo(() => {
        return {
            total: messages.length,

            sent: messages.filter(
                (item) =>
                    getStatus(item) === "sent"
            ).length,

            approved: messages.filter(
                (item) =>
                    getStatus(item) === "approved"
            ).length,

            pending: messages.filter(
                (item) =>
                    getStatus(item) === "draft"
            ).length,
        };
    }, [messages]);

    function handleCampaignChange(event) {
        setCampaignId(event.target.value);
    }

    async function handleLoadOutreach() {
        await loadOutreach();
    }

    async function handleApprove(messageId) {
        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `http://127.0.0.1:8000/api/v1/outreach/${messageId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        status: "approved",
                    }),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        "Failed to approve message."
                );
            }

            setMessages((previous) =>
                previous.map((item) =>
                    Number(item.id) ===
                    Number(messageId)
                        ? {
                              ...item,
                              status: "approved",
                          }
                        : item
                )
            );

            setSuccess(
                "Outreach message approved successfully."
            );
        } catch (error) {
            console.error(
                "Approval error:",
                error
            );

            setError(
                error.message ||
                    "Failed to approve message."
            );
        }
    }

    async function handleSend(messageId) {
        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `http://127.0.0.1:8000/api/v1/outreach/${messageId}/send`,
                {
                    method: "POST",
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        "Failed to send email."
                );
            }

            setMessages((previous) =>
                previous.map((item) =>
                    Number(item.id) ===
                    Number(messageId)
                        ? {
                              ...item,
                              status: "sent",
                              sent_at:
                                  data.sent_at ||
                                  new Date().toISOString(),
                          }
                        : item
                )
            );

            setSuccess(
                "Email sent successfully."
            );
        } catch (error) {
            console.error(
                "Send email error:",
                error
            );

            setError(
                error.message ||
                    "Failed to send email."
            );
        }
    }

    return (
        <div className="outreach-page">

            {/* PAGE HEADER */}
            <div className="outreach-header">

                <div>
                    <div className="breadcrumb">
                        Workspace
                        <span>/</span>
                        <strong>Outreach</strong>
                    </div>

                    <h1 className="outreach-title">
                        Outreach
                    </h1>

                    <p className="outreach-subtitle">
                        Review, approve, and send
                        AI-generated influencer
                        outreach messages.
                    </p>
                </div>

                <div className="outreach-header-stat">
                    <span className="header-stat-number">
                        {stats.total}
                    </span>

                    <span className="header-stat-label">
                        Messages
                    </span>
                </div>
            </div>

            {/* STATS */}
            <div className="outreach-stats">

                <div className="outreach-stat-card">
                    <div className="stat-icon">
                        ✉
                    </div>

                    <div>
                        <span>
                            Total Messages
                        </span>

                        <strong>
                            {stats.total}
                        </strong>
                    </div>
                </div>

                <div className="outreach-stat-card">
                    <div className="stat-icon green">
                        ✓
                    </div>

                    <div>
                        <span>
                            Sent
                        </span>

                        <strong>
                            {stats.sent}
                        </strong>
                    </div>
                </div>

                <div className="outreach-stat-card">
                    <div className="stat-icon blue">
                        ●
                    </div>

                    <div>
                        <span>
                            Approved
                        </span>

                        <strong>
                            {stats.approved}
                        </strong>
                    </div>
                </div>

                <div className="outreach-stat-card">
                    <div className="stat-icon orange">
                        ◷
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {stats.pending}
                        </strong>
                    </div>
                </div>

            </div>

            {/* CAMPAIGN SELECTOR */}
            <div className="outreach-control-card">

                <div>
                    <span className="control-label">
                        Campaign
                    </span>

                    <h3>
                        Load campaign outreach
                    </h3>

                    <p>
                        Select a campaign to review
                        its generated influencer
                        messages.
                    </p>
                </div>

                <div className="campaign-control">

                    <input
                        type="number"
                        min="1"
                        value={campaignId}
                        onChange={
                            handleCampaignChange
                        }
                        placeholder="Campaign ID"
                    />

                    <button
                        className="load-button"
                        onClick={
                            handleLoadOutreach
                        }
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : "Load Outreach"}
                    </button>

                </div>

            </div>

            {/* SUCCESS MESSAGE */}
            {success && (
                <div className="success-alert">
                    <div className="success-icon">
                        ✓
                    </div>

                    <div>
                        <strong>
                            {success}
                        </strong>

                        <span>
                            Your outreach workflow
                            has been updated.
                        </span>
                    </div>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="error-alert">
                    <div className="error-icon">
                        !
                    </div>

                    <div>
                        <strong>
                            Something went wrong
                        </strong>

                        <span>
                            {error}
                        </span>
                    </div>
                </div>
            )}

            {/* SECTION HEADER */}
            <div className="messages-header">

                <div>
                    <span className="section-eyebrow">
                        AI GENERATED OUTREACH
                    </span>

                    <h2>
                        Campaign Messages
                    </h2>

                    <p>
                        Review each message before
                        sending it to the creator.
                    </p>
                </div>

                <div className="message-count">
                    {messages.length}{" "}
                    {messages.length === 1
                        ? "message"
                        : "messages"}
                </div>

            </div>

            {/* LOADING */}
            {loading && (
                <div className="outreach-loading">
                    <div className="loading-spinner"></div>

                    <p>
                        Loading outreach messages...
                    </p>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading &&
                messages.length === 0 && (
                    <div className="empty-outreach">

                        <div className="empty-icon">
                            ✉
                        </div>

                        <h3>
                            No outreach messages
                        </h3>

                        <p>
                            No AI-generated outreach
                            messages were found for
                            campaign #{campaignId}.
                        </p>

                        <button
                            className="secondary-action"
                            onClick={
                                handleLoadOutreach
                            }
                        >
                            Refresh
                        </button>

                    </div>
                )}

            {/* MESSAGE LIST */}
            {!loading &&
                messages.length > 0 && (
                    <div className="messages-list">

                        {messages.map(
                            (message) => {
                                const influencerName =
                                    getInfluencerName(
                                        message.influencer_id
                                    );

                                const initials =
                                    getInfluencerInitials(
                                        influencerName
                                    );

                                const status =
                                    getStatus(
                                        message
                                    );

                                return (
                                    <div
                                        className="message-card"
                                        key={
                                            message.id
                                        }
                                    >

                                        {/* CARD TOP */}
                                        <div className="message-card-top">

                                            <div className="creator-info">

                                                <div className="creator-avatar">
                                                    {
                                                        initials
                                                    }
                                                </div>

                                                <div>
                                                    <span className="creator-label">
                                                        INFLUENCER
                                                    </span>

                                                    <h3>
                                                        {
                                                            influencerName
                                                        }
                                                    </h3>

                                                    <p>
                                                        Influencer
                                                        #
                                                        {
                                                            message.influencer_id
                                                        }
                                                    </p>
                                                </div>

                                            </div>

                                            <span
                                                className={`status-badge status-${status}`}
                                            >
                                                <span className="status-dot-small"></span>

                                                {getStatusLabel(
                                                    status
                                                )}
                                            </span>

                                        </div>

                                        {/* CONTACT DETAILS */}
                                        <div className="message-meta">

                                            <div className="meta-row">

                                                <span className="meta-label">
                                                    To
                                                </span>

                                                <span className="meta-value">
                                                    {
                                                        getRecipientEmail(
                                                            message
                                                        )
                                                    }
                                                </span>

                                            </div>

                                            <div className="meta-row">

                                                <span className="meta-label">
                                                    Subject
                                                </span>

                                                <span className="meta-value">
                                                    {
                                                        message.subject ||
                                                        "Potential Collaboration"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        {/* MESSAGE */}
                                        <div className="generated-section">

                                            <div className="generated-label">
                                                <span>
                                                    ✦
                                                </span>

                                                AI GENERATED MESSAGE
                                            </div>

                                            <div className="generated-message">
                                                {getMessageContent(
                                                    message
                                                )}
                                            </div>

                                        </div>

                                        {/* ACTIONS */}
                                        <div className="message-actions">

                                            <div className="action-info">

                                                {status ===
                                                    "sent" && (
                                                    <span className="sent-info">
                                                        ✓ Email
                                                        sent
                                                        successfully
                                                    </span>
                                                )}

                                                {status ===
                                                    "approved" && (
                                                    <span className="approved-info">
                                                        Ready to
                                                        send
                                                    </span>
                                                )}

                                                {status ===
                                                    "draft" && (
                                                    <span className="draft-info">
                                                        Awaiting
                                                        approval
                                                    </span>
                                                )}

                                            </div>

                                            <div className="action-buttons">

                                                {status ===
                                                    "draft" && (
                                                    <button
                                                        className="approve-button"
                                                        onClick={() =>
                                                            handleApprove(
                                                                message.id
                                                            )
                                                        }
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                )}

                                                {status ===
                                                    "approved" && (
                                                    <button
                                                        className="send-button"
                                                        onClick={() =>
                                                            handleSend(
                                                                message.id
                                                            )
                                                        }
                                                    >
                                                        Send Email →
                                                    </button>
                                                )}

                                                {status ===
                                                    "sent" && (
                                                    <button
                                                        className="sent-button"
                                                        disabled
                                                    >
                                                        ✓ Sent
                                                    </button>
                                                )}

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            <style>{`

                .outreach-page {
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 42px 42px 80px;
                    color: #0b1220;
                }

                .outreach-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 30px;
                    margin-bottom: 32px;
                }

                .breadcrumb {
                    color: #94a3b8;
                    font-size: 14px;
                    margin-bottom: 18px;
                }

                .breadcrumb span {
                    margin: 0 10px;
                    color: #cbd5e1;
                }

                .breadcrumb strong {
                    color: #334155;
                }

                .outreach-title {
                    margin: 0;
                    font-size: 48px;
                    line-height: 1;
                    font-weight: 800;
                    letter-spacing: -1.5px;
                }

                .outreach-subtitle {
                    margin: 14px 0 0;
                    max-width: 620px;
                    color: #64748b;
                    font-size: 18px;
                    line-height: 1.55;
                }

                .outreach-header-stat {
                    min-width: 130px;
                    height: 92px;
                    padding: 18px 22px;
                    border-radius: 24px;
                    background: #0b1220;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
                }

                .header-stat-number {
                    font-size: 28px;
                    font-weight: 800;
                }

                .header-stat-label {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin-top: 2px;
                }

                .outreach-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .outreach-stat-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    min-height: 92px;
                    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
                }

                .stat-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 13px;
                    background: #eef2ff;
                    color: #315fe9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 800;
                }

                .stat-icon.green {
                    background: #dcfce7;
                    color: #15803d;
                }

                .stat-icon.blue {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .stat-icon.orange {
                    background: #ffedd5;
                    color: #ea580c;
                }

                .outreach-stat-card span {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .outreach-stat-card strong {
                    display: block;
                    margin-top: 4px;
                    font-size: 25px;
                }

                .outreach-control-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 22px;
                    padding: 24px 26px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 25px;
                    margin-bottom: 24px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
                }

                .control-label {
                    color: #315fe9;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .outreach-control-card h3 {
                    margin: 5px 0;
                    font-size: 18px;
                }

                .outreach-control-card p {
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .campaign-control {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .campaign-control input {
                    width: 130px;
                    height: 46px;
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    padding: 0 14px;
                    font-size: 15px;
                    outline: none;
                }

                .campaign-control input:focus {
                    border-color: #315fe9;
                    box-shadow: 0 0 0 3px rgba(49, 95, 233, 0.1);
                }

                .load-button {
                    height: 46px;
                    border: 0;
                    border-radius: 12px;
                    padding: 0 20px;
                    background: #315fe9;
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                }

                .load-button:hover {
                    background: #244fd0;
                }

                .load-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .success-alert,
                .error-alert {
                    border-radius: 16px;
                    padding: 17px 20px;
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .success-alert {
                    background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                    color: #047857;
                }

                .error-alert {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #b91c1c;
                }

                .success-icon,
                .error-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                }

                .success-icon {
                    background: #d1fae5;
                }

                .error-icon {
                    background: #fee2e2;
                }

                .success-alert strong,
                .error-alert strong {
                    display: block;
                    font-size: 14px;
                }

                .success-alert span,
                .error-alert span {
                    display: block;
                    margin-top: 3px;
                    font-size: 13px;
                }

                .messages-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin: 36px 0 18px;
                }

                .section-eyebrow {
                    color: #315fe9;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.2px;
                }

                .messages-header h2 {
                    margin: 5px 0 4px;
                    font-size: 27px;
                    letter-spacing: -0.5px;
                }

                .messages-header p {
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .message-count {
                    background: #eaf0ff;
                    color: #315fe9;
                    border-radius: 999px;
                    padding: 8px 14px;
                    font-size: 13px;
                    font-weight: 800;
                }

                .messages-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .message-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 28px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .message-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
                }

                .message-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                }

                .creator-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .creator-avatar {
                    width: 58px;
                    height: 58px;
                    border-radius: 18px;
                    background: #0b1220;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 800;
                }

                .creator-label {
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                }

                .creator-info h3 {
                    margin: 3px 0;
                    font-size: 21px;
                }

                .creator-info p {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 13px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 800;
                }

                .status-dot-small {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .status-sent {
                    background: #dcfce7;
                    color: #15803d;
                }

                .status-approved {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .status-draft {
                    background: #fef3c7;
                    color: #b45309;
                }

                .status-rejected {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .message-meta {
                    border-top: 1px solid #e2e8f0;
                    border-bottom: 1px solid #e2e8f0;
                    margin-top: 24px;
                    padding: 18px 0;
                }

                .meta-row {
                    display: grid;
                    grid-template-columns: 90px 1fr;
                    gap: 10px;
                    padding: 7px 0;
                }

                .meta-label {
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 800;
                }

                .meta-value {
                    color: #334155;
                    font-size: 14px;
                    word-break: break-word;
                }

                .generated-section {
                    margin-top: 22px;
                }

                .generated-label {
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }

                .generated-label span {
                    color: #315fe9;
                    margin-right: 5px;
                }

                .generated-message {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 17px;
                    padding: 20px;
                    color: #334155;
                    font-size: 15px;
                    line-height: 1.8;
                    white-space: pre-wrap;
                }

                .message-actions {
                    margin-top: 22px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .action-info {
                    font-size: 13px;
                    color: #64748b;
                }

                .sent-info {
                    color: #15803d;
                    font-weight: 700;
                }

                .approved-info {
                    color: #2563eb;
                    font-weight: 700;
                }

                .draft-info {
                    color: #b45309;
                    font-weight: 700;
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                }

                .approve-button,
                .send-button,
                .sent-button {
                    border: 0;
                    border-radius: 11px;
                    padding: 12px 18px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .approve-button {
                    background: #eaf0ff;
                    color: #315fe9;
                }

                .approve-button:hover {
                    background: #dbe5ff;
                }

                .send-button {
                    background: #315fe9;
                    color: white;
                    box-shadow: 0 8px 18px rgba(49, 95, 233, 0.2);
                }

                .send-button:hover {
                    background: #244fd0;
                }

                .sent-button {
                    background: #dcfce7;
                    color: #15803d;
                    cursor: default;
                }

                .outreach-loading {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 22px;
                    padding: 55px 20px;
                    text-align: center;
                }

                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #dbe5ff;
                    border-top-color: #315fe9;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 15px;
                }

                .outreach-loading p {
                    color: #64748b;
                    margin: 0;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .empty-outreach {
                    background: white;
                    border: 1px dashed #cbd5e1;
                    border-radius: 24px;
                    padding: 65px 25px;
                    text-align: center;
                }

                .empty-icon {
                    width: 62px;
                    height: 62px;
                    margin: 0 auto 15px;
                    border-radius: 20px;
                    background: #eef2ff;
                    color: #315fe9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 25px;
                }

                .empty-outreach h3 {
                    margin: 0;
                    font-size: 20px;
                }

                .empty-outreach p {
                    color: #64748b;
                    margin: 8px auto 20px;
                    max-width: 420px;
                }

                .secondary-action {
                    border: 1px solid #cbd5e1;
                    background: white;
                    border-radius: 10px;
                    padding: 10px 18px;
                    font-weight: 700;
                    cursor: pointer;
                }

                @media (max-width: 900px) {
                    .outreach-page {
                        padding: 30px 24px 60px;
                    }

                    .outreach-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .outreach-control-card {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .campaign-control {
                        width: 100%;
                    }

                    .campaign-control input {
                        flex: 1;
                    }
                }

                @media (max-width: 640px) {
                    .outreach-page {
                        padding: 24px 16px 50px;
                    }

                    .outreach-header {
                        flex-direction: column;
                    }

                    .outreach-title {
                        font-size: 38px;
                    }

                    .outreach-header-stat {
                        width: 100%;
                    }

                    .outreach-stats {
                        grid-template-columns: 1fr;
                    }

                    .message-card {
                        padding: 20px;
                    }

                    .message-card-top {
                        flex-direction: column;
                    }

                    .message-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .action-buttons {
                        width: 100%;
                    }

                    .approve-button,
                    .send-button,
                    .sent-button {
                        width: 100%;
                    }

                    .meta-row {
                        grid-template-columns: 1fr;
                        gap: 3px;
                    }

                    .campaign-control {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .campaign-control input {
                        width: 100%;
                        box-sizing: border-box;
                    }
                }

            `}</style>
        </div>
    );
}

export default Outreach;