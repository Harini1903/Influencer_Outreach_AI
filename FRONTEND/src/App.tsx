/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ToastContainer } from './components/common/ToastContainer';

// Modals
import { InfluencerProfileModal } from './components/modals/InfluencerProfileModal';
import { CreateCampaignModal } from './components/modals/CreateCampaignModal';
import { CreateInfluencerModal } from './components/modals/CreateInfluencerModal';
import { AddToCampaignModal } from './components/modals/AddToCampaignModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { MatchingPage } from './pages/MatchingPage';
import { OutreachPage } from './pages/OutreachPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

import { Influencer, Campaign } from './types';

function MainApp() {
  const {
    currentView,
    setCurrentView,
    selectedInfluencer,
    setSelectedInfluencer,
    setSelectedCampaign,
    setTargetOutreach,
    openCreateCampaignModal,
    setOpenCreateCampaignModal,
    openCreateInfluencerModal,
    setOpenCreateInfluencerModal,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [targetForCampaignModal, setTargetForCampaignModal] = useState<Influencer | null>(null);

  // If user is on the Landing Page, render full landing experience
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage />
        <ToastContainer />
      </>
    );
  }

  // Handle direct actions from components
  const handleAddToCampaign = (inf: Influencer) => {
    setTargetForCampaignModal(inf);
  };

  const handleGenerateOutreach = (inf: Influencer, campaignId?: number) => {
    setTargetOutreach({ influencer: inf, campaignId });
    setCurrentView('outreach');
  };

  const handleSelectCampaignForMatch = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setCurrentView('matching');
  };

  const handleSelectCampaignForOutreach = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setTargetOutreach({ campaignId: camp.id });
    setCurrentView('outreach');
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <TopHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'dashboard' && <DashboardPage />}

          {currentView === 'discover' && (
            <DiscoverPage
              onAddToCampaign={handleAddToCampaign}
              onGenerateOutreach={handleGenerateOutreach}
            />
          )}

          {currentView === 'campaigns' && (
            <CampaignsPage
              onSelectCampaignForMatch={handleSelectCampaignForMatch}
              onSelectCampaignForOutreach={handleSelectCampaignForOutreach}
            />
          )}

          {currentView === 'matching' && (
            <MatchingPage
              onAddToCampaign={handleAddToCampaign}
              onGenerateOutreach={handleGenerateOutreach}
            />
          )}

          {currentView === 'outreach' && <OutreachPage />}

          {currentView === 'analytics' && <AnalyticsPage />}

          {currentView === 'assistant' && <AssistantPage />}

          {currentView === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals */}
      {selectedInfluencer && (
        <InfluencerProfileModal
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onAddToCampaign={handleAddToCampaign}
          onGenerateOutreach={handleGenerateOutreach}
        />
      )}

      {openCreateCampaignModal && (
        <CreateCampaignModal
          isOpen={openCreateCampaignModal}
          onClose={() => setOpenCreateCampaignModal(false)}
        />
      )}

      {openCreateInfluencerModal && (
        <CreateInfluencerModal
          isOpen={openCreateInfluencerModal}
          onClose={() => setOpenCreateInfluencerModal(false)}
        />
      )}

      {targetForCampaignModal && (
        <AddToCampaignModal
          influencer={targetForCampaignModal}
          onClose={() => setTargetForCampaignModal(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
