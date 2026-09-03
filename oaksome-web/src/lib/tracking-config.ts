import { cache } from 'react'

export type TrackingConfig = {
  gtmContainerId: string
  ga4MeasurementId: string
  googleAdsConversionId: string
  linkedinPartnerId: string
  linkedinConvFormSubmitId: string
  metaPixelId: string
  axeptioClientId: string
}

const ODOO_URL = process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL || ''

function emptyConfig(): TrackingConfig {
  return {
    gtmContainerId: '',
    ga4MeasurementId: '',
    googleAdsConversionId: '',
    linkedinPartnerId: '',
    linkedinConvFormSubmitId: '',
    metaPixelId: '',
    axeptioClientId: '',
  }
}

export const getTrackingConfig = cache(async (): Promise<TrackingConfig> => {
  if (!ODOO_URL) return emptyConfig()
  try {
    const res = await fetch(`${ODOO_URL}/api/oaksome/v1/tracking-config`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return emptyConfig()
    const json = await res.json()
    const data = json.data ?? json
    return {
      gtmContainerId: data.gtm_container_id || '',
      ga4MeasurementId: data.ga4_measurement_id || '',
      googleAdsConversionId: data.google_ads_conversion_id || '',
      linkedinPartnerId: data.linkedin_partner_id || '',
      linkedinConvFormSubmitId: data.linkedin_conv_form_submit_id || '',
      metaPixelId: data.meta_pixel_id || '',
      axeptioClientId: data.axeptio_client_id || '',
    }
  } catch {
    return emptyConfig()
  }
})
