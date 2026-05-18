//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021-2025 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { MeasureContext } from '@hcengineering/core'
import { setMetadata } from '@hcengineering/platform'
import { StorageConfiguration } from '@hcengineering/server-core'
import { buildStorageFromConfig, storageConfigFromEnv } from '@hcengineering/server-storage'
import serverToken from '@hcengineering/server-token'
import { start } from '.'

export function startFront (ctx: MeasureContext, extraConfig?: Record<string, string | undefined>): void {
  const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? '8080')

  const accountsUrl = process.env.ACCOUNTS_URL
  if (accountsUrl === undefined) {
    console.error('please provide accounts url')
    process.exit(1)
  }

  const accountsUrlInternal = process.env.ACCOUNTS_URL_INTERNAL

  const uploadUrl = process.env.UPLOAD_URL
  if (uploadUrl === undefined) {
    console.error('please provide upload url')
    process.exit(1)
  }

  const gmailUrl = process.env.GMAIL_URL
  if (gmailUrl === undefined) {
    console.error('please provide gmail url')
    process.exit(1)
  }

  const calendarUrl = process.env.CALENDAR_URL
  if (calendarUrl === undefined) {
    console.error('please provide calendar service url')
    process.exit(1)
  }

  const telegramUrl = process.env.TELEGRAM_URL
  if (telegramUrl === undefined) {
    console.error('please provide telegram url')
    process.exit(1)
  }

  const rekoniUrl = process.env.REKONI_URL
  if (rekoniUrl === undefined) {
    console.error('please provide rekoni url')
    process.exit(1)
  }

  const collaboratorUrl = process.env.COLLABORATOR_URL
  if (collaboratorUrl === undefined) {
    console.error('please provide collaborator url')
    process.exit(1)
  }

  const collaborator = process.env.COLLABORATOR

  const modelVersion = process.env.MODEL_VERSION
  if (modelVersion === undefined) {
    console.error('please provide model version requirement')
    process.exit(1)
  }

  const version = process.env.VERSION
  if (version === undefined) {
    console.error('please provide version requirement')
    process.exit(1)
  }

  const serverSecret = process.env.SERVER_SECRET
  if (serverSecret === undefined) {
    console.log('Please provide server secret')
    process.exit(1)
  }

  let previewUrl = process.env.PREVIEW_URL
  if (previewUrl === undefined) {
    previewUrl = ''
  }

  let filesUrl = process.env.FILES_URL
  if (filesUrl === undefined) {
    filesUrl = `${uploadUrl}/:workspace/:filename?file=:blobId&workspace=:workspace`
  }

  let pulseUrl = process.env.PULSE_URL
  if (pulseUrl === undefined) {
    pulseUrl = ''
  }

  const pushPublicKey = process.env.PUSH_PUBLIC_KEY

  const brandingUrl = process.env.BRANDING_URL

  const linkPreviewUrl = process.env.LINK_PREVIEW_URL

  const streamUrl = process.env.STREAM_URL

  const disableSignUp = process.env.DISABLE_SIGNUP

  const hideLocalLogin = process.env.HIDE_LOCAL_LOGIN

  const mailUrl = process.env.MAIL_URL

  const billingUrl = process.env.BILLING_URL

  const paymentUrl = process.env.PAYMENT_URL

  const hulylakeUrl = process.env.HULYLAKE_URL

  const datalakeUrl = process.env.DATALAKE_URL

  const brandingConfig = buildBrandingConfig()

  setMetadata(serverToken.metadata.Secret, serverSecret)
  setMetadata(serverToken.metadata.Service, 'front')

  const storageConfig: StorageConfiguration = storageConfigFromEnv()
  const storageAdapter = buildStorageFromConfig(storageConfig)

  const config = {
    storageAdapter,
    accountsUrl,
    accountsUrlInternal,
    uploadUrl,
    filesUrl,
    modelVersion,
    version,
    gmailUrl,
    telegramUrl,
    rekoniUrl,
    calendarUrl,
    collaboratorUrl,
    collaborator,
    brandingUrl,
    previewUrl,
    pushPublicKey,
    disableSignUp,
    hideLocalLogin,
    linkPreviewUrl,
    streamUrl,
    mailUrl,
    billingUrl,
    paymentUrl,
    pulseUrl,
    hulylakeUrl,
    datalakeUrl,
    brandingConfig
  }
  console.log('Starting Front service with', config)
  const shutdown = start(ctx, config, SERVER_PORT, extraConfig)

  const close = (): void => {
    void storageAdapter.close()
    console.trace('Exiting from server')
    console.log('Shutdown request accepted')
    shutdown()
    process.exit(0)
  }

  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}

// Whitelabel: build a single-brand Branding object from BRAND_* env vars.
// Returned object is wrapped server-side as { '*': brandingConfig } so the
// existing host-keyed BrandingMap mechanism keeps working unchanged.
// Returns undefined when no BRAND_NAME is set (i.e. default Huly deployment),
// in which case the existing static branding.json (if any) is served instead.
function buildBrandingConfig (): Record<string, any> | undefined {
  const name = process.env.BRAND_NAME
  if (name === undefined || name === '') return undefined

  const links: Array<{ rel: string, href: string, type?: string, sizes?: string }> = []
  if (process.env.BRAND_FAVICON_URL !== undefined) {
    links.push({ rel: 'icon', href: process.env.BRAND_FAVICON_URL })
  }
  if (process.env.BRAND_PWA_MANIFEST_URL !== undefined) {
    links.push({ rel: 'manifest', href: process.env.BRAND_PWA_MANIFEST_URL })
  }

  const logo: Record<string, string> = {}
  if (process.env.BRAND_LOGO_LIGHT_URL !== undefined) logo.light = process.env.BRAND_LOGO_LIGHT_URL
  if (process.env.BRAND_LOGO_DARK_URL !== undefined) logo.dark = process.env.BRAND_LOGO_DARK_URL
  if (process.env.BRAND_WORDMARK_LIGHT_URL !== undefined) logo.wordmarkLight = process.env.BRAND_WORDMARK_LIGHT_URL
  if (process.env.BRAND_WORDMARK_DARK_URL !== undefined) logo.wordmarkDark = process.env.BRAND_WORDMARK_DARK_URL

  const theme: Record<string, any> = {}
  if (process.env.BRAND_PRIMARY_COLOR !== undefined) theme.primary = process.env.BRAND_PRIMARY_COLOR
  if (process.env.BRAND_PRIMARY_HOVER_COLOR !== undefined) theme.primaryHover = process.env.BRAND_PRIMARY_HOVER_COLOR
  if (process.env.BRAND_PRIMARY_PRESSED_COLOR !== undefined) theme.primaryPressed = process.env.BRAND_PRIMARY_PRESSED_COLOR
  if (process.env.BRAND_ACCENT_COLOR !== undefined) theme.accent = process.env.BRAND_ACCENT_COLOR
  if (process.env.BRAND_LOGIN_GRADIENT_FROM !== undefined && process.env.BRAND_LOGIN_GRADIENT_TO !== undefined) {
    theme.loginGradient = {
      from: process.env.BRAND_LOGIN_GRADIENT_FROM,
      to: process.env.BRAND_LOGIN_GRADIENT_TO
    }
  }

  const support: Record<string, string> = {}
  if (process.env.BRAND_SUPPORT_URL !== undefined) support.supportLink = process.env.BRAND_SUPPORT_URL
  if (process.env.BRAND_DOCS_URL !== undefined) support.docsLink = process.env.BRAND_DOCS_URL
  if (process.env.BRAND_REPORT_BUG_URL !== undefined) support.reportBugLink = process.env.BRAND_REPORT_BUG_URL
  if (process.env.BRAND_PRIVACY_URL !== undefined) support.privacyPolicyLink = process.env.BRAND_PRIVACY_URL

  return {
    name,
    title: process.env.BRAND_TITLE ?? name,
    ...(process.env.BRAND_SIGNUP_URL !== undefined ? { signupUrl: process.env.BRAND_SIGNUP_URL } : {}),
    ...(links.length > 0 ? { links } : {}),
    ...(Object.keys(logo).length > 0 ? { logo } : {}),
    ...(Object.keys(theme).length > 0 ? { theme } : {}),
    ...(Object.keys(support).length > 0 ? { support } : {})
  }
}
