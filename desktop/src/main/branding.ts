//
// Copyright © 2026 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//

// Whitelabel: brand values consumed by the Electron MAIN process (CLI name,
// tray tooltip, startup log, auto-updater feed URL). The renderer gets its
// brand from the back-end via /branding.json — see desktop/src/ui/preload.ts.
//
// Defaults match upstream Huly. A forked build sets the BRAND_* env vars
// either at app launch (advanced) or bakes them in via the build script.
// Note: electron-builder fields (productName, appId, icons) live in
// desktop-package/package.json and are baked at PACKAGE time, not here.
export interface DesktopBranding {
  // Short brand noun used as CLI program name and tray tooltip.
  name: string
  // Display name used in startup logs and as a fallback for the window title
  // before the back-end branding.json is fetched.
  productName: string
  // Auto-updater feed URL. Fallback when neither env var nor server config provides one.
  updatesUrl: string
  // Auto-updater default channel name. Forks typically pick e.g. 'acme' instead of 'huly'.
  updatesChannel: string
}

export const brand: DesktopBranding = {
  name: process.env.BRAND_NAME ?? 'Huly',
  productName: process.env.BRAND_PRODUCT_NAME ?? `${process.env.BRAND_NAME ?? 'Huly'} Desktop`,
  updatesUrl: process.env.DESKTOP_UPDATES_URL ?? 'https://dist.huly.io',
  updatesChannel: process.env.DESKTOP_UPDATES_CHANNEL ?? 'huly'
}
