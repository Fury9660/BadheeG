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
  // Also handle full status text as fallback
  'MANIFESTED':       { delhivery_status: 'manifested',        label: 'Manifested' },
  'PICKED UP':        { status: 'shipped', delhivery_status: 'picked_up',    label: 'Picked Up' },
  'IN TRANSIT':       { status: 'shipped', delhivery_status: 'in_transit',   label: 'In Transit' },
  'OUT FOR DELIVERY': { status: 'shipped', delhivery_status: 'out_for_delivery', label: 'Out for Delivery' },
  'DELIVERED':        { status: 'delivered', delhivery_status: 'delivered',  label: 'Delivered' },
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

  // Map status and update order
  const key = (statusType || statusText).toUpperCase()
  const mapping = STATUS_MAP[key]

  if (mapping) {
    const updatePayload: Record<string, any> = {
      delhivery_status: mapping.delhivery_status,
    }

    if (mapping.status) updatePayload.status = mapping.status
    if (key === 'DEL') updatePayload.delivered_at = statusDateTime

    await supabase.from('orders').update(updatePayload).eq('id', order.id)
    console.log(`✅ Order ${order.id} updated: ${JSON.stringify(updatePayload)}`)
  } else {
    console.warn(`Unknown status type: ${statusType} (${statusText}) — storing event only`)
  }
}
