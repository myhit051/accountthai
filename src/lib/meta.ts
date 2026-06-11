import { db } from '@/db'
import { metaIntegrations } from '@/db/schema'
import { decryptToken } from '@/lib/utils'
import { eq } from 'drizzle-orm'

const GRAPH = 'https://graph.facebook.com/v23.0'

// Graph error code 190 = OAuthException (invalid/expired token), 102 = session issue
export class MetaTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MetaTokenError'
  }
}

interface GraphError {
  message: string
  code: number
}

async function graphGet(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url)
  const json = await res.json()
  const error = json.error as GraphError | undefined
  if (error) {
    if (error.code === 190 || error.code === 102) {
      throw new MetaTokenError(error.message)
    }
    throw new Error(`Meta Graph API error ${error.code}: ${error.message}`)
  }
  return json
}

function buildUrl(path: string, token: string, params: Record<string, string> = {}): string {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('access_token', token)
  return url.toString()
}

export interface MetaConnection {
  accessToken: string
  adAccountId: string
  adAccountName: string | null
  currency: string | null
}

export async function getMetaIntegration(tenantId: string): Promise<MetaConnection | null> {
  const [integration] = await db.select().from(metaIntegrations)
    .where(eq(metaIntegrations.tenantId, tenantId)).limit(1)

  if (!integration?.accessToken || !integration.adAccountId) return null

  return {
    accessToken: decryptToken(integration.accessToken),
    adAccountId: integration.adAccountId,
    adAccountName: integration.adAccountName,
    currency: integration.currency,
  }
}

export interface MetaAdAccount {
  id: string // "act_<id>"
  name: string
  accountId: string
  currency: string
}

export async function fetchAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const json = await graphGet(buildUrl('me/adaccounts', token, {
    fields: 'id,name,account_id,currency',
    limit: '100',
  }))
  const data = (json.data || []) as Array<{ id: string; name: string; account_id: string; currency: string }>
  return data.map(a => ({ id: a.id, name: a.name, accountId: a.account_id, currency: a.currency }))
}

export interface BillingCharge {
  date: string // ISO datetime from event_time
  amount: number
  currency: string
  transactionId: string
}

export async function fetchBillingCharges(
  token: string,
  actId: string,
  since: string, // YYYY-MM-DD
  until: string
): Promise<BillingCharge[]> {
  const charges: BillingCharge[] = []
  let url: string | null = buildUrl(`${actId}/activities`, token, {
    fields: 'event_time,event_type,extra_data',
    since,
    until,
    limit: '500',
  })

  for (let page = 0; url && page < 5; page++) {
    const json = await graphGet(url)
    const data = (json.data || []) as Array<{ event_time: string; event_type: string; extra_data?: string }>

    for (const event of data) {
      if (event.event_type !== 'ad_account_billing_charge' || !event.extra_data) continue
      try {
        const extra = JSON.parse(event.extra_data) as { currency?: string; new_value?: number; transaction_id?: string }
        charges.push({
          date: event.event_time,
          amount: (extra.new_value || 0) / 100,
          currency: extra.currency || 'THB',
          transactionId: extra.transaction_id || '',
        })
      } catch {
        // skip events with malformed extra_data
      }
    }

    const paging = json.paging as { next?: string } | undefined
    url = paging?.next || null
  }

  return charges.sort((a, b) => b.date.localeCompare(a.date))
}

export interface DailySpend {
  date: string // YYYY-MM-DD
  spend: number
}

export async function fetchDailySpend(
  token: string,
  actId: string,
  since: string,
  until: string
): Promise<DailySpend[]> {
  const json = await graphGet(buildUrl(`${actId}/insights`, token, {
    fields: 'spend',
    time_increment: '1',
    time_range: JSON.stringify({ since, until }),
    limit: '500',
  }))
  const data = (json.data || []) as Array<{ spend: string; date_start: string }>
  return data
    .map(d => ({ date: d.date_start, spend: parseFloat(d.spend) || 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function metaReceiptUrl(transactionId: string): string {
  return `https://www.facebook.com/ads/receipt/?transaction_id=${encodeURIComponent(transactionId)}`
}
