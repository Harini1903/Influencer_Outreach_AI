const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function getInfluencers() {
  const response = await fetch(
    `${API_BASE_URL}/influencers/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch influencers");
  }

  return response.json();
}

export async function getCampaigns() {
  const response = await fetch(
    `${API_BASE_URL}/campaigns/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }

  return response.json();
}

export async function getOutreachMessages(campaignId) {
  const response = await fetch(
    `${API_BASE_URL}/outreach/campaign/${campaignId}`
  );

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      data.detail ||
      `Failed to fetch outreach messages with status ${response.status}`
    );
  }

  return data;
}

export async function createCampaign(campaignData) {
  const response = await fetch(
    `${API_BASE_URL}/campaigns/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(campaignData),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
      `Campaign creation failed with status ${response.status}`
    );
  }

  return data;
}

export async function matchCampaign(campaignId) {
  const response = await fetch(
    `${API_BASE_URL}/campaigns/${campaignId}/match`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Campaign matching error:", data);

    throw new Error(
      data.detail ||
      `Campaign matching failed with status ${response.status}`
    );
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(
    "http://127.0.0.1:8000/health"
  );

  if (!response.ok) {
    throw new Error("Backend connection failed");
  }

  return response.json();
}