import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const DEFAULT_LTL_BASE  = 'https://ltl-clients-api.delhivery.com'
const DEFAULT_BTOB_BASE = 'https://btob.api.delhivery.com'

// In-memory JWT cache
let _cachedJwtProd = ''
let _tokenExpiryProd = 0
let _cachedJwtDev = ''
let _tokenExpiryDev = 0

async function getJwt(
  username: string, 
  password: string, 
  storedToken: string, 
  btobBase: string, 
  ltlBase: string, 
  isTestMode: boolean
): Promise<string> {
  const cachedJwt = isTestMode ? _cachedJwtDev : _cachedJwtProd
  const tokenExpiry = isTestMode ? _tokenExpiryDev : _tokenExpiryProd

  if (cachedJwt && Date.now() < tokenExpiry) return cachedJwt

  for (const baseUrl of [btobBase, ltlBase]) {
    for (const path of ['ums/login/', 'ums/login']) {
      try {
        const url = `${baseUrl}/${path}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        const resp = await res.json()
        const jwt = resp?.data?.jwt || resp?.jwt || resp?.token || ''

        if (jwt) {
          if (isTestMode) {
            _cachedJwtDev = jwt
            _tokenExpiryDev = Date.now() + (22 * 60 * 60 * 1000)
          } else {
            _cachedJwtProd = jwt
            _tokenExpiryProd = Date.now() + (22 * 60 * 60 * 1000)
          }
          return jwt
        }
        console.warn(`No JWT from ${url}:`, JSON.stringify(resp).slice(0, 200))
      } catch (e) {
        console.error(`Login error for ${url}:`, e)
      }
    }
  }

  return storedToken
}

async function ensureWarehouse(token: string, warehouseName: string, btobBase: string, ltlBase: string): Promise<void> {
  const warehousePayload = {
    name: warehouseName,
    email: 'badheeg6@gmail.com',
    phone: '9521633688',
    address: 'Laxmangarh',
    city: 'Laxmangarh',
    state: 'Rajasthan',
    pin: '332311',
    gstin: 'UR',
    registered_name: 'BADHEE G',
  }
  for (const [base, path] of [
    [btobBase, 'v2/client-warehouse'],
    [ltlBase, 'v2/client-warehouse'],
  ]) {
    try {
      const res = await fetch(`${base}/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(warehousePayload),
      })
      const text = await res.text()
      if (res.status === 200 || res.status === 201 || res.status === 409) return
      console.log(`Warehouse ${base}: ${res.status} ${text.slice(0, 100)}`)
    } catch (e) {
      console.error(`Warehouse error:`, e)
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Query database for test mode setting
    const { data: testModeSetting } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('key', 'delhivery_test_mode')
      .single()
    const isTestMode = testModeSetting?.value === 'true'

    // Configure URLs and credentials dynamically
    let ltlBase = 'https://ltl-clients-api.delhivery.com'
    let btobBase = 'https://btob.api.delhivery.com'
    let username = Deno.env.get('DELHIVERY_USERNAME') || 'BADHEEG6537B2B'
    let password = Deno.env.get('DELHIVERY_PASSWORD') || 'Yuvi@302013'
    let storedTok = Deno.env.get('DELHIVERY_TOKEN') || 'a4a8463308805823aa0fad774f58e792f49dc2a4'

    if (isTestMode) {
      ltlBase = 'https://ltl-clients-api-dev.delhivery.com'
      btobBase = 'https://btob-api-dev.delhivery.com'
      username = Deno.env.get('DELHIVERY_USERNAME_DEV') || 'BADHEEG6537B2B-b2b'
      password = Deno.env.get('DELHIVERY_PASSWORD_DEV') || 'Yuvraj@302013'
      storedTok = Deno.env.get('DELHIVERY_TOKEN_DEV') || 'a4a8463308805823aa0fad774f58e792f49dc2a4'
    }

    // Override global constants locally for this request context
    const LTL_BASE = ltlBase
    const BTOB_BASE = btobBase

    const body = await req.json()
    const { action, details } = body

    if (!username || !password) throw new Error('Delhivery credentials not configured')

    const respond = (data: any, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // AUTO MANIFEST
    if (action === 'auto-manifest') {
      const { orderId } = details
      if (!orderId) throw new Error('orderId is required')

      console.log(`Starting auto-manifest for order ID: ${orderId}`)

      // 1. Fetch order
      const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderErr || !order) {
        console.error(`Order not found: ${orderId}`, orderErr)
        throw new Error(`Order not found: ${orderErr?.message || ''}`)
      }

      // If already manifested, return success
      if (order.lrn_number || order.tracking_id) {
        console.log(`Order ${orderId} already manifested: ${order.lrn_number || order.tracking_id}`)
        return respond({ success: true, message: 'Already manifested', lrn: order.lrn_number || order.tracking_id })
      }

      // 2. Fetch address
      const { data: addr, error: addrErr } = await supabaseClient
        .from('addresses')
        .select('*')
        .eq('id', order.address_id)
        .single()

      if (addrErr || !addr) {
        console.error(`Address not found: ${order.address_id}`, addrErr)
        throw new Error(`Address not found: ${addrErr?.message || ''}`)
      }

      // 3. Fetch default warehouse
      const { data: wh } = await supabaseClient
        .from('delhivery_warehouses')
        .select('name')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle()

      const pickupLocation = wh?.name || 'MODERN FURNITURE CRAFT'

      // 4. Construct payload
      const shortOrderId = (order.order_id || order.id).substring(0, 25)
      const totalValue = order.total_amount || 1000
      const items = order.items || []
      const desc = items.map((i: any) => i.name).join(', ') || 'Furniture'

      const custName = addr.name || order.customer_name || 'Customer'
      const custPhone = String(addr.mobile || addr.phone || '9999999999')
      const custCity = addr.city || 'City'
      const custState = addr.state || 'State'
      const custPin = String(addr.pincode || '110001')
      const custLine1 = addr.line1 || ''
      const custLine2 = addr.line2 || ''

      const fullAddress = [
        custLine1,
        custLine2,
        `${custCity}, ${custState} - ${custPin}`,
        `Ph: ${custPhone}`,
      ].filter(Boolean).join(', ')

      const payload = {
        pickup_location: pickupLocation,
        gstin: 'UR',
        dropoff_location: {
          consignee: custName,
          consignee_name: custName,
          address: fullAddress,
          city: custCity,
          state: custState,
          zip: custPin,
          phone: custPhone,
          mobile: custPhone,
          gstin: 'UR',
          gst_number: 'UR',
        },
        billing_address: {
          name: 'BADHEE G',
          company: 'BADHEE G',
          consignor: 'BADHEE G',
          address: 'Laxmangarh',
          city: 'Laxmangarh',
          state: 'Rajasthan',
          pin: '332311',
          phone: '9521633688',
          gst_number: 'UR',
          gstin: 'UR',
        },
        weight: 10,
        n_value: totalValue,
        d_mode: 'Prepaid',
        product_type: 'S',
        invoices: [{
          ident: shortOrderId,
          n_value: totalValue,
          inv_num: 'INV-' + shortOrderId.substring(0, 8),
          inv_amt: totalValue,
          inv_date: new Date().toISOString().split('T')[0],
        }],
        suborders: [{
          ident: shortOrderId,
          suborder_id: shortOrderId + '-S',
          weight: 10,
          count: 1,
          n_value: totalValue,
          description: desc,
        }],
        shipments: [{
          order_number: shortOrderId,
          consignee: custName,
          consignee_name: custName,
          consignee_address: fullAddress,
          consignee_city: custCity,
          consignee_state: custState,
          consignee_pincode: custPin,
          consignee_phone: custPhone,
          phone: custPhone,
          mobile: custPhone,
          consignee_gst_tin: 'UR',
          payment_mode: (order.payment_method || 'online') === 'cod' ? 'cod' : 'prepaid',
          total_amount: totalValue,
          n_value: totalValue,
          shipment_details: [{
            n_value: totalValue,
            description: desc,
            weight: 10,
            length: 30,
            breadth: 30,
            height: 30,
            box_count: 1,
            suborders: [{
              ident: shortOrderId,
              suborder_id: shortOrderId + '-S',
              weight: 10,
              count: 1,
              n_value: totalValue,
              description: desc,
            }]
          }],
          invoices: [{
            ident: shortOrderId,
            n_value: totalValue,
            inv_num: 'INV-' + shortOrderId.substring(0, 8),
            inv_amt: totalValue,
            inv_date: new Date().toISOString().split('T')[0],
          }]
        }]
      }

      console.log(`Auto-manifesting order ${orderId} with pickup location: ${pickupLocation}`)

      // 5. Call Delhivery v2/manifest
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      await ensureWarehouse(token, pickupLocation, BTOB_BASE, LTL_BASE)

      const manifestRes = await fetch(`${BTOB_BASE}/v2/manifest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await manifestRes.text()
      let initialData: any
      try { initialData = JSON.parse(text) } catch { initialData = { raw: text } }
      console.log(`Auto-manifest initial response for order ${orderId} (Status ${manifestRes.status}):`, text.slice(0, 500))

      const jobId = initialData.data?.job_id || initialData.job_id
      if (!jobId) {
        throw new Error(initialData.message || initialData.error?.message || 'Failed to get Job ID from Delhivery')
      }

      // 6. Poll for LR number (up to 12 attempts of 5s)
      let lrn: string | null = null
      let waybill = ''
      let labelUrl = ''

      for (let i = 0; i < 12; i++) {
        console.log(`Polling for job ${jobId} (Attempt ${i + 1}/12)...`)
        await new Promise(r => setTimeout(r, 5000))
        const pollRes = await fetch(`${BTOB_BASE}/v2/manifest?job_id=${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const pollText = await pollRes.text()
        let pollData: any
        try { pollData = JSON.parse(pollText) } catch { pollData = { raw: pollText } }

        const jobStatus = pollData?.status || pollData
        if (jobStatus?.type === 'Complete' && jobStatus?.success) {
          lrn = jobStatus.value?.lrnum || jobStatus.value?.waybills?.[0]?.ident
          waybill = jobStatus.value?.waybills?.[0]?.ident || ''
          console.log(`Job complete! LR Number: ${lrn}, Waybill: ${waybill}`)
          
          // Try to get label immediately
          const attemptsList: any[] = []
          const ids = [...new Set([waybill, lrn].filter(Boolean))]
          for (const id of ids) {
            attemptsList.push(
              { label: `GET-URLS-LTL-A4-${id}`,   method: 'GET',  url: `${LTL_BASE}/v2/get-label-urls/A4/${id}` },
              { label: `GET-URLS-LTL-a4-${id}`,   method: 'GET',  url: `${LTL_BASE}/v2/get-label-urls/a4/${id}` },
              { label: `GEN-PDF-LTL-${id}`,        method: 'POST', url: `${LTL_BASE}/docket/generate_label_pdf`, body: JSON.stringify({ lrns: [id] }) },
              { label: `GEN-PDF-LTL-v1-${id}`,     method: 'POST', url: `${LTL_BASE}/v1/docket/generate_label_pdf`, body: JSON.stringify({ lrns: [id] }) },
              { label: `GET-URLS-BTOB-A4-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls/A4/${id}` },
              { label: `GET-URLS-BTOB-a4-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls/a4/${id}` },
              { label: `GET-URLS-BTOB-no-size-${id}`, method: 'GET', url: `${BTOB_BASE}/v2/get-label-urls/${id}` },
              { label: `GET-URLS-BTOB-qp-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls?lrn=${id}&size=A4` },
              { label: `GEN-PDF-BTOB-${id}`,       method: 'POST', url: `${BTOB_BASE}/docket/generate_label_pdf`, body: JSON.stringify({ lrns: [id] }) },
              { label: `GEN-PDF-BTOB-v2-${id}`,    method: 'POST', url: `${BTOB_BASE}/v2/label`, body: JSON.stringify({ lrn: id, size: 'A4' }) },
              { label: `GET-LABEL-BTOB-${id}`,     method: 'GET',  url: `${BTOB_BASE}/v2/label/${id}` },
              { label: `DIRECT-LTL-${id}`,         method: 'GET',  url: `${LTL_BASE}/label/print/a4/${id}` },
            )
          }

          const authPrefix = token.startsWith('eyJ') ? 'Bearer' : 'Token'

          for (const attempt of attemptsList) {
            try {
              const hdrs: Record<string,string> = {
                'Authorization': `${authPrefix} ${token}`,
                'Content-Type': 'application/json',
              }
              const opts: RequestInit = { method: attempt.method, headers: hdrs }
              if (attempt.body) opts.body = attempt.body
              const res = await fetch(attempt.url, opts)
              const text = await res.text()
              let data: any
              try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 200) } }

              let found: string | null = null
              if (Array.isArray(data?.data) && data.data.length > 0) found = data.data[0]
              found = found || data?.label_url || data?.url || data?.pdf_url
              if (!found && Array.isArray(data) && data.length > 0) found = data[0]
              if (!found && Array.isArray(data?.urls) && data.urls.length > 0) found = data.urls[0]

              if (found && typeof found === 'string' && found.startsWith('http')) {
                labelUrl = found
                console.log(`Auto-manifest: Label URL retrieved: ${labelUrl}`)
                break
              }

              if (res.status === 302 || res.status === 301) {
                const loc = (res.headers as any).get?.('location')
                if (loc && loc.startsWith('http')) {
                  labelUrl = loc
                  console.log(`Auto-manifest: Label URL retrieved via redirect: ${labelUrl}`)
                  break
                }
              }
            } catch (e: any) {
              console.log(`Auto-manifest: label attempt ${attempt.label} failed: ${e.message}`)
            }
          }
          break
        }
        if (jobStatus?.type === 'Complete' && !jobStatus?.success) {
          console.error(`Job failed:`, jobStatus)
          throw new Error(jobStatus.reason || 'Shipment creation failed')
        }
      }

      if (!lrn) {
        throw new Error(`Job ${jobId} submitted but LR not received yet.`)
      }

      // 7. Update order in DB
      console.log(`Updating order ${orderId} in database with LR: ${lrn}`)
      const { error: updateErr } = await supabaseClient
        .from('orders')
        .update({
          tracking_id: lrn,
          lrn_number: lrn,
          waybill: waybill || null,
          label_url: labelUrl || null,
          delhivery_job_id: jobId,
          delhivery_status: 'manifested',
          status: 'processing',
        })
        .eq('id', orderId)

      if (updateErr) {
        console.error(`Failed to update order in database:`, updateErr)
        throw new Error(`Failed to update order with tracking info: ${updateErr.message}`)
      }

      return respond({ success: true, lrn, waybill, labelUrl, jobId })
    }

    // LOGIN
    if (action === 'login' || action === 'auto-login') {
      const jwt = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      return respond({ jwt, success: !!jwt })
    }

    // DEBUG LOGIN
    if (action === 'debug-login') {
      const res = await fetch(`${LTL_BASE}/ums/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      return respond({ raw: await res.text(), status: res.status })
    }

    // CREATE SHIPMENT
    if (action === 'create-shipment-json' || action === 'create-lr') {
      const { payload } = details
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      await ensureWarehouse(token, payload?.pickup_location || 'MODERN FURNITURE CRAFT', BTOB_BASE, LTL_BASE)

      const res = await fetch(`${BTOB_BASE}/v2/manifest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      console.log(`Manifest ${res.status}:`, text.slice(0, 300))
      return respond(data)
    }

    // CHECK JOB STATUS
    if (action === 'check-job-status') {
      const { jobId } = details
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      const res = await fetch(`${BTOB_BASE}/v2/manifest?job_id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }

      return respond(data)
    }

    // CHECK JOB STATUS + IMMEDIATELY TRY LABEL
    // Used during manifest polling — when job completes, tries to get label URL right away
    // using the SAME JWT session (more reliable than calling later with a fresh JWT)
    if (action === 'check-job-and-label') {
      const { jobId } = details
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      const res = await fetch(`${BTOB_BASE}/v2/manifest?job_id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }

      // If job is complete, try to generate label immediately with same JWT
      const jobStatus = data?.status || data
      let labelUrl: string | null = null
      if (jobStatus?.type === 'Complete' && jobStatus?.success) {
        const lrn  = jobStatus.value?.lrnum
        const wbn  = jobStatus.value?.waybills?.[0]?.ident || ''
        const targets = wbn ? [wbn, lrn] : [lrn]
        for (const id of targets) {
          if (!id) continue
          try {
            const lr = await fetch(`${LTL_BASE}/docket/generate_label_pdf`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ lrns: [id] }),
            })
            const lt = await lr.text()
            let ld: any
            try { ld = JSON.parse(lt) } catch { ld = {} }
            console.log(`Label for ${id}: ${lr.status} ${lt.slice(0, 120)}`)
            const found = Array.isArray(ld?.data) && ld.data.length > 0 ? ld.data[0] : null
            if (found && typeof found === 'string' && found.startsWith('http')) {
              labelUrl = found; break
            }
          } catch (e: any) { console.log('label err', e.message) }
        }
      }
      return respond({ ...data, labelUrl })
    }

    // TRACK SHIPMENT
    if (action === 'track-shipment') {
      const { lrn } = details
      if (!lrn) throw new Error('LRN is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      const res = await fetch(`${BTOB_BASE}/v2/track/${lrn}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      return respond(data)
    }

    // GET LABEL
    // Strategy:
    //   1. If cachedLabelUrl is provided (saved from orders.label_url), skip Delhivery API
    //      and directly fetch the label content from that URL
    //   2. Otherwise, try multiple Delhivery endpoints to get a fresh label URL
    //   3. Once we have a URL, fetch the content and return as base64 data URL
    if (action === 'get-label') {
      const { lrn, waybill, cachedLabelUrl } = details
      if (!lrn) throw new Error('LRN is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode) // ensure token is fresh

      let labelUrl: string | null = cachedLabelUrl || null
      const allDebug: any[] = []

      // Env mismatch check: If cached URL is dev but we are in prod (or vice versa), ignore cached URL
      const currentHost = new URL(LTL_BASE).host;
      if (labelUrl) {
        try {
          const cachedHost = new URL(labelUrl).host;
          if (cachedHost !== currentHost) {
            console.log(`Ignoring cached label URL due to environment mismatch: cached=${cachedHost}, current=${currentHost}`);
            labelUrl = null;
          }
        } catch {
          labelUrl = null;
        }
      }

      // Validate cached URL by checking if it throws an auth or invalid error
      if (labelUrl) {
        try {
          console.log('Validating cached label URL:', labelUrl);
          const res = await fetch(labelUrl);
          if (!res.ok || res.status === 401 || res.status === 403) {
            console.log(`Cached URL validation failed with status ${res.status}. Regenerating.`);
            labelUrl = null;
          } else {
            const text = await res.clone().text();
            if (text.includes('UNAUTHORIZED_LEGACY_JWT') || text.includes('Invalid JWT')) {
              console.log('Cached URL returned auth error in body. Regenerating.');
              labelUrl = null;
            }
          }
        } catch (e: any) {
          console.log('Cached URL validation error:', e.message);
          labelUrl = null;
        }
      }

      if (!labelUrl) {
        type Attempt = { label: string; method: string; url: string; body?: string; headers?: Record<string,string> }
        const attempts: Attempt[] = []

        const ids = [...new Set([waybill, lrn].filter(Boolean))]

        for (const id of ids) {
          // LTL attempts
          attempts.push(
            { label: `GET-URLS-LTL-A4-${id}`,   method: 'GET',  url: `${LTL_BASE}/v2/get-label-urls/A4/${id}` },
            { label: `GET-URLS-LTL-a4-${id}`,   method: 'GET',  url: `${LTL_BASE}/v2/get-label-urls/a4/${id}` },
            { label: `GEN-PDF-LTL-${id}`,        method: 'POST', url: `${LTL_BASE}/docket/generate_label_pdf`,
              body: JSON.stringify({ lrns: [id] }) },
            { label: `GEN-PDF-LTL-v1-${id}`,     method: 'POST', url: `${LTL_BASE}/v1/docket/generate_label_pdf`,
              body: JSON.stringify({ lrns: [id] }) },
            // BTOB attempts — 400 (not 404) means resource EXISTS, size format is wrong
            { label: `GET-URLS-BTOB-A4-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls/A4/${id}` },
            { label: `GET-URLS-BTOB-a4-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls/a4/${id}` },
            { label: `GET-URLS-BTOB-no-size-${id}`, method: 'GET', url: `${BTOB_BASE}/v2/get-label-urls/${id}` },
            { label: `GET-URLS-BTOB-qp-${id}`,   method: 'GET',  url: `${BTOB_BASE}/v2/get-label-urls?lrn=${id}&size=A4` },
            { label: `GEN-PDF-BTOB-${id}`,       method: 'POST', url: `${BTOB_BASE}/docket/generate_label_pdf`,
              body: JSON.stringify({ lrns: [id] }) },
            { label: `GEN-PDF-BTOB-v2-${id}`,    method: 'POST', url: `${BTOB_BASE}/v2/label`,
              body: JSON.stringify({ lrn: id, size: 'A4' }) },
            { label: `GET-LABEL-BTOB-${id}`,     method: 'GET',  url: `${BTOB_BASE}/v2/label/${id}` },
            // Direct print (may redirect or return content without HMAC in dev)
            { label: `DIRECT-LTL-${id}`,         method: 'GET',  url: `${LTL_BASE}/label/print/a4/${id}` },
          )
        }

        const authPrefix = token.startsWith('eyJ') ? 'Bearer' : 'Token';

        for (const attempt of attempts) {
          try {
            const hdrs: Record<string,string> = {
              'Authorization': `${authPrefix} ${token}`,
              'Content-Type': 'application/json',
              ...(attempt.headers || {}),
            }
            const opts: RequestInit = { method: attempt.method, headers: hdrs }
            if (attempt.body) opts.body = attempt.body
            const res = await fetch(attempt.url, opts)
            const text = await res.text()
            let data: any
            try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 200) } }
            console.log(`Label [${attempt.label}] ${res.status}: ${text.slice(0, 100)}`)
            allDebug.push({ label: attempt.label, status: res.status, resp: data })

            // Base64 image returned directly
            if (res.ok && (text.startsWith('iVBOR') || text.startsWith('/9j/') || text.startsWith('data:'))) {
              const clean = text.trim().replace(/[\r\n\s]/g, '')
              const dataUrl = clean.startsWith('data:') ? clean : `data:image/png;base64,${clean}`
              return respond({ success: true, url: dataUrl, labelUrl: attempt.url })
            }

            // Extract URL from JSON response
            let found: string | null = null
            if (Array.isArray(data?.data) && data.data.length > 0) found = data.data[0]
            found = found || data?.label_url || data?.url || data?.pdf_url
            if (!found && Array.isArray(data) && data.length > 0) found = data[0]
            // Check for nested urls array
            if (!found && Array.isArray(data?.urls) && data.urls.length > 0) found = data.urls[0]

            if (found && typeof found === 'string' && found.startsWith('http')) {
              labelUrl = found
              break
            }

            // If 302 redirect, use Location header as the label URL
            if (res.status === 302 || res.status === 301) {
              const loc = (res.headers as any).get?.('location')
              if (loc && loc.startsWith('http')) { labelUrl = loc; break }
            }
          } catch (e: any) {
            allDebug.push({ label: attempt.label, error: e.message })
          }
        }

        if (!labelUrl) {
          return respond({ error: 'Could not get label URL from Delhivery', allAttempts: allDebug }, 400)
        }
      }

      // Fetch label content from the URL and convert to base64
      try {
        console.log('Fetching label content from:', labelUrl)
        const imgRes = await fetch(labelUrl)
        const contentType = imgRes.headers.get('content-type') || ''
        console.log('Label content-type:', contentType, 'status:', imgRes.status)

        if (!imgRes.ok) {
          return respond({ error: `Label URL returned ${imgRes.status}. URL may have expired.`, labelUrl, cached: !!cachedLabelUrl }, 400)
        }

        // Binary image/PDF
        if (contentType.includes('image') || contentType.includes('pdf')) {
          const buffer = await imgRes.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
          const base64 = btoa(binary)
          const mime = contentType.includes('pdf') ? 'application/pdf' : 'image/png'
          return respond({ success: true, url: `data:${mime};base64,${base64}`, labelUrl })
        }

        // Text response (Delhivery returns base64 as text/plain with data: prefix)
        const text = await imgRes.text()
        const clean = text.trim()
        if (clean.startsWith('data:')) return respond({ success: true, url: clean, labelUrl })
        if (clean.startsWith('iVBOR') || clean.startsWith('/9j/') ||
            (clean.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(clean.slice(0, 100)))) {
          return respond({ success: true, url: `data:image/png;base64,${clean.replace(/[\r\n\s]/g, '')}`, labelUrl })
        }
        // Fallback: return label URL for browser to open
        return respond({ success: true, url: labelUrl })
      } catch (fetchErr: any) {
        console.error('Label fetch error:', fetchErr)
        return respond({ success: true, url: labelUrl, fetchError: fetchErr.message })
      }
    }

    // CHECK PINCODE SERVICEABILITY
    if (action === 'check-pincode') {
      const { pincode } = details
      if (!pincode) throw new Error('Pincode is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      const res = await fetch(`${LTL_BASE}/pincode-service/${pincode}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      return respond(data)
    }

    // GET WAREHOUSES LIST
    if (action === 'get-warehouses') {
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)
      const res = await fetch(`${LTL_BASE}/v2/client-warehouse`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      return respond(data)
    }

    // ADD WAREHOUSE
    if (action === 'add-warehouse') {
      const { warehouse } = details
      if (!warehouse?.name) throw new Error('Warehouse name is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)

      const payload = {
        name: warehouse.name,
        email: warehouse.email || '',
        phone: warehouse.phone || '',
        address: warehouse.address || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        pin: warehouse.pincode || '',
        gstin: warehouse.gstin || 'UR',
        registered_name: warehouse.name,
      }

      for (const base of [BTOB_BASE, LTL_BASE]) {
        const res = await fetch(`${base}/v2/client-warehouse`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const text = await res.text()
        let data: any
        try { data = JSON.parse(text) } catch { data = { raw: text } }
        if (res.status === 200 || res.status === 201) return respond({ success: true, data })
      }
      return respond({ success: false, error: 'Failed to create warehouse' }, 400)
    }

    // SCHEDULE PICKUP
    if (action === 'schedule-pickup') {
      const { lrn, pickupLocation, pickupDate } = details
      if (!lrn) throw new Error('LRN is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)

      const res = await fetch(`${BTOB_BASE}/v2/pickup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pd_assigned_code: pickupLocation || 'MODERN FURNITURE CRAFT',
          lrns: [lrn],
          pickup_date: pickupDate || new Date().toISOString().split('T')[0],
        }),
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      console.log(`Schedule pickup ${lrn}: ${res.status} - ${text.slice(0, 200)}`)
      return respond(data)
    }

    // CANCEL SHIPMENT
    if (action === 'cancel-shipment') {
      const { lrn } = details
      if (!lrn) throw new Error('LRN is required')
      const token = await getJwt(username, password, storedTok, BTOB_BASE, LTL_BASE, isTestMode)

      const res = await fetch(`${BTOB_BASE}/v2/manifest/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lrns: [lrn] }),
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { raw: text } }
      console.log(`Cancel ${lrn}: ${res.status}`)
      return respond(data)
    }

    return respond({ error: `Unknown action: ${action}` }, 400)

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
