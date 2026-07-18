import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar/app-sidebar';
import { Header } from './header';
import { getUserDetails } from '@/actions/auth.actions';
import { redirect } from 'next/navigation';
import { Footer } from '@/components/app-sidebar/footer';
import { CommandPalette } from '@/components/command-palette/command-palette';
import { KeyboardShortcutsHelp } from '@/components/command-palette/keyboard-shortcuts-help';
import { SessionExpiryBanner } from '@/components/session-expiry-banner';
import React from 'react';

import { PrivacyConsentDialog } from '@/components/privacy-consent-dialog';

export default async function MainPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserDetails();

  if (!user) {
    redirect('/');
  }

  const showPrivacyConsent = !!user.employeeProfile && !user.privacyConsentDate;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header user={user} />
        <div className="bg-uncategorized-main grow p-[20px] lg:p-[28px]">{children}</div>
        <Footer />
      </SidebarInset>

      <CommandPalette />
      <KeyboardShortcutsHelp />
      <SessionExpiryBanner />
      {showPrivacyConsent && <PrivacyConsentDialog />}
    </SidebarProvider>
  );
}
