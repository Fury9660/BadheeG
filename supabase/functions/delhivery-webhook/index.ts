import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-delhivery-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Delhivery StatusType → internal status mapping
// Source: Delhivery Scan Push/Webhook documentation
const STATUS_MAP: Record<string, { status?: string; delhivery_status: string; label: string }> = {
  // Legacy shortcodes (Fallback)
  'MF':   { delhivery_status: 'manifested',         label: 'Manifested' },
  'PKD':  { status: 'processing', delhivery_status: 'packed',            label: 'Packed' },
  'PU':   { status: 'shipped',    delhivery_status: 'picked_up',         label: 'Picked Up' },
  'IT':   { status: 'shipped',    delhivery_status: 'in_transit',        label: 'In Transit' },
  'OFD':  { status: 'shipped',    delhivery_status: 'out_for_delivery',  label: 'Out for Delivery' },
  'DEL':  { status: 'delivered',  delhivery_status: 'delivered',         label: 'Delivered' },
  'RTO':  { status: 'returned',   delhivery_status: 'rto',               label: 'Return to Origin' },
  'RTOM': { status: 'returned',   delhivery_status: 'rto_manifested',    label: 'RTO Manifested' },
  'UD':   { delhivery_status: 'undelivered',         label: 'Undelivered' },
  'DLY':  { delhivery_status: 'delayed',             label: 'Delayed' },
  'CNX':  { status: 'cancelled',  delhivery_status: 'cancelled',         label: 'Cancelled' },
  'LOST': { delhivery_status: 'lost',                label: 'Lost' },

  // --- Combined StatusType + Status mappings (Official B2B Webhook Docs) ---
  // Forward shipment flow (UD = Undelivered/Active, DL = Delivered/Terminal)
  'UD_MANIFESTED': { delhivery_status: 'manifested',        label: 'Manifested' },
  'UD_NOT PICKED': { status: 'processing', delhivery_status: 'not_picked',    label: 'Not Picked' },
  'UD_IN TRANSIT': { status: 'shipped',    delhivery_status: 'in_transit',    label: 'In Transit' },
  'UD_PENDING':    { delhivery_status: 'pending',            label: 'Pending' },
  'UD_DISPATCHED': { status: 'shipped',    delhivery_status: 'out_for_delivery', label: 'Out for Delivery' },
  'DL_DELIVERED':  { status: 'delivered',  delhivery_status: 'delivered',     label: 'Delivered' },

  // Return shipment flow (RT = Return Transit, DL = Delivered/Terminal)
  'RT_IN TRANSIT': { status: 'returned',   delhivery_status: 'rto_in_transit', label: 'RTO In Transit' },
  'RT_PENDING':    { status: 'returned',   delhivery_status: 'rto_pending',    label: 'RTO Pending' },
  'RT_DISPATCHED': { status: 'returned',   delhivery_status: 'rto_dispatched', label: 'RTO Dispatched' },
  'DL_RTO':        { status: 'returned',   delhivery_status: 'rto',            label: 'Returned to Origin' },

  // Lost shipment flow
  'LT_LOST':       { delhivery_status: 'lost',               label: 'Lost' },

  // --- Full Status Text Fallbacks ---
  'MANIFESTED':       { delhivery_status: 'manifested',        label: 'Manifested' },
  'NOT PICKED':       { status: 'processing', delhivery_status: 'not_picked',    label: 'Not Picked' },
  'PENDING':          { delhivery_status: 'pending',            label: 'Pending' },
  'DISPATCHED':       { status: 'shipped',    delhivery_status: 'out_for_delivery', label: 'Out for Delivery' },
  'IN TRANSIT':       { status: 'shipped',    delhivery_status: 'in_transit',   label: 'In Transit' },
  'OUT FOR DELIVERY': { status: 'shipped',    delhivery_status: 'out_for_delivery', label: 'Out for Delivery' },
  'DELIVERED':        { status: 'delivered',  delhivery_status: 'delivered',  label: 'Delivered' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Respond 200 IMMEDIATELY (Delhivery requires < 500ms response)
  const responsePromise = new Response(
    JSON.stringify({ success: true, message: 'Received' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )

  // Process async in background (don't await before responding)
  processWebhook(req.clone()).catch(err => console.error('Webhook processing error:', err))

  return responsePromise
})

async function processWebhook(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  const text = await req.text()
  console.log('Delhivery webhook received:', text.slice(0, 500))

  let payloads: any[] = []
  try {
    const parsed = JSON.parse(text)
    payloads = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    // Try form-encoded
    const params = new URLSearchParams(text)
    const data = params.get('data')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        payloads = Array.isArray(parsed) ? parsed : [parsed]
      } catch {}
    }
  }

  for (const payload of payloads) {
    try {
      await processEvent(supabase, payload)
    } catch (err) {
      console.error('Error processing event:', err, JSON.stringify(payload).slice(0, 200))
    }
  }
}

async function processEvent(supabase: any, payload: any) {
  // Delhivery actual payload format:
  // { "Shipment": { "Status": { "StatusType": "OFD", "StatusDateTime": "...", "StatusLocation": "..." }, "AWB": "220256736", "ReferenceNo": "..." } }
  const shipment = payload?.Shipment || payload?.shipment || payload
  const statusObj = shipment?.Status || shipment?.status || {}
  const statusType = statusObj?.StatusType || statusObj?.statusType || payload?.status || payload?.StatusCode || ''
  const statusText = statusObj?.Status || statusObj?.status || statusType
  const statusLocation = statusObj?.StatusLocation || statusObj?.statusLocation || payload?.location || payload?.city || ''
  const statusDateTime = statusObj?.StatusDateTime || statusObj?.statusDateTime || payload?.timestamp || new Date().toISOString()
  const instructions = statusObj?.Instructions || statusObj?.instructions || ''

  // AWB / LRN from Shipment.AWB
  const lrn = shipment?.AWB || shipment?.Waybill || shipment?.waybill || payload?.waybill || payload?.lrnum || payload?.lr_number || ''
  const refNo = shipment?.ReferenceNo || shipment?.referenceNo || payload?.reference_no || ''

  if (!lrn) {
    console.warn('No AWB/LRN in payload:', JSON.stringify(payload).slice(0, 300))
    return
  }

  console.log(`Event: AWB=${lrn}, StatusType=${statusType}, Location=${statusLocation}`)

  // Find order
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, delhivery_status, order_id')
    .or(`tracking_id.eq.${lrn},lrn_number.eq.${lrn}`)
    .limit(1)

  if (!orders?.length) {
    console.warn(`Order not found for LRN: ${lrn}`)
    return
  }

  const order = orders[0]

  // Save to delhivery_events table
  await supabase.from('delhivery_events').insert({
    order_id: order.id,
    lrn,
    status: statusText || statusType,
    location: statusLocation,
    city: statusLocation.split('(')[0].trim(),
    timestamp: statusDateTime,
    raw_data: payload,
  })

  // Map status and update order using composite check (e.g. UD_IN TRANSIT), specific text, or type fallback
  const keyText = statusText ? statusText.trim().toUpperCase() : ''
  const keyType = statusType ? statusType.trim().toUpperCase() : ''
  const combinedKey = keyType && keyText ? `${keyType}_${keyText}` : ''

  const mapping = STATUS_MAP[combinedKey] || STATUS_MAP[keyText] || STATUS_MAP[keyType]

  if (mapping) {
    const updatePayload: Record<string, any> = {
      delhivery_status: mapping.delhivery_status,
    }

    if (mapping.status) updatePayload.status = mapping.status
    if (mapping.delhivery_status === 'delivered') {
      updatePayload.delivered_at = statusDateTime
    }

    await supabase.from('orders').update(updatePayload).eq('id', order.id)
    console.log(`✅ Order ${order.id} updated: ${JSON.stringify(updatePayload)} (Mapped from Combined:${combinedKey} / Text:${keyText} / Type:${keyType})`)
  } else {
    console.warn(`Unknown status type/text: ${statusType} (${statusText}) — storing event only`)
  }
}
