# Delhivery B2B API — Complete Integration Documentation

> **Source:** Delhivery Developer Portal (`one.delhivery.com`) & Express API Hub  
> **Last Reviewed:** May 2026  
> **Contact (Technical):** lastmile-integration@delhivery.com  
> **Contact (Operational):** client.support@delhivery.com  
> **Onboarding/Credentials:** de.onb@delhivery.com

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Key Terminology](#2-key-terminology)
3. [Pre-Requisites for Integration](#3-pre-requisites-for-integration)
4. [Authentication](#4-authentication)
5. [Base URLs — Test vs Production](#5-base-urls--test-vs-production)
6. [Integration Flow — 9 Steps](#6-integration-flow--9-steps)
7. [API Reference](#7-api-reference)
   - 7.1 [Pin-code Serviceability API](#71-pin-code-serviceability-api)
   - 7.2 [Bulk Waybill API](#72-bulk-waybill-api)
   - 7.3 [Fetch Waybill API](#73-fetch-waybill-api)
   - 7.4 [Order Creation / Manifestation API](#74-order-creation--manifestation-api)
   - 7.5 [Order Tracking API (Pull)](#75-order-tracking-api-pull)
   - 7.6 [Tracking via Push API (Webhook)](#76-tracking-via-push-api-webhook)
   - 7.7 [Edit Order API](#77-edit-order-api)
   - 7.8 [Cancel Order API](#78-cancel-order-api)
   - 7.9 [Packing Slip / Shipping Label API](#79-packing-slip--shipping-label-api)
   - 7.10 [Pickup Request Creation API](#710-pickup-request-creation-api)
   - 7.11 [Client Warehouse Creation API](#711-client-warehouse-creation-api)
   - 7.12 [Client Warehouse Edit API](#712-client-warehouse-edit-api)
   - 7.13 [Invoice / Shipping Charge Calculation API](#713-invoice--shipping-charge-calculation-api)
   - 7.14 [NDR (Non-Delivery Report) Action API](#714-ndr-non-delivery-report-action-api)
   - 7.15 [B2B Serviceability API](#715-b2b-serviceability-api)
8. [Shipment Types & Flows](#8-shipment-types--flows)
9. [GST & Compliance Details](#9-gst--compliance-details)
10. [Special Shipment Scenarios](#10-special-shipment-scenarios)
11. [Rate Limits & Throttling](#11-rate-limits--throttling)
12. [Error Handling & HTTP Codes](#12-error-handling--http-codes)
13. [Best Practices](#13-best-practices)
14. [Plugins & E-commerce Integrations](#14-plugins--e-commerce-integrations)
15. [Support & Escalation Matrix](#15-support--escalation-matrix)

---

## 1. Overview & Architecture

Delhivery is India's largest integrated logistics company, providing express parcel delivery, B2B freight, warehousing, and supply chain services.

The **Delhivery API** is organized around **REST**. It uses:

- **Predictable, resource-oriented URLs**
- **HTTP status codes** to indicate API errors
- **Cross-origin resource sharing (CORS)** support for browser-based integrations
- **JSON** as the primary data format for request and response bodies

There are two separate API systems depending on shipment type:

| API System | Use Case | Base Domain |
|---|---|---|
| **Express / Last-Mile API** | B2C forward & reverse shipments | `staging-express.delhivery.com` (test) / `track.delhivery.com` (prod) |
| **B2B / LTL API** | Business-to-business freight (larger shipments) | `ltl-clients-api-dev.delhivery.com` (test) / `ltl-clients-api.delhivery.com` (prod) |
| **B2B Booking API** | B2B order booking | `btob.api.delhivery.com` |

---

## 2. Key Terminology

| Term | Definition |
|---|---|
| **Waybill (AWB)** | Unique tracking number assigned to every shipment in Delhivery's network |
| **Order ID** | Client-assigned identifier associated with a shipment; should be unique per order |
| **Payload** | All key-value pairs passed with an API request |
| **Token** | The sole authentication parameter required to access all APIs |
| **Pickup Location / Warehouse** | A registered physical location from which shipments are collected |
| **Test / Staging Environment** | Sandbox environment for integration testing (no real shipments created) |
| **Production Environment** | Live environment; creates actual shipments and requests |
| **BD / CS Team** | Business Development / Client Support representative managing your account |
| **Account Types** | Express or Surface |
| **Express Service** | Movement of goods from a transport hub to a final destination (home delivery) |
| **Prepaid Shipment** | Delivery where payment has already been made by the buyer |
| **COD Shipment** | Cash On Delivery — payment collected from the consignee at delivery |
| **RVP / Reverse Pickup** | Picking up a shipment from a customer and delivering it back to client warehouse |
| **MPS** | Multi-Piece Shipment — multiple boxes in a single order, each with its own waybill |
| **NDR** | Non-Delivery Report — raised when delivery could not be completed |
| **NSZ** | "Not Serviceable Zone" — the pincode cannot be serviced by Delhivery |
| **E-waybill** | Government-mandated electronic waybill required when shipment value exceeds ₹50,000 |
| **HQ Name** | Your company's client account name as registered with Delhivery |

---

## 3. Pre-Requisites for Integration

Before making any API calls, you must complete the following two checkpoints.

### Pre-Requisite 1 — Client Account Information

Contact your **BD/CS Relation Manager** at Delhivery to obtain:

| Credential | Description |
|---|---|
| **Client Name (HQ Name)** | Your account name as registered in Delhivery's system |
| **User ID** | Your assigned user identifier |
| **API Token** | A unique 12–16 character string used for all API authentication |
| **Pickup / Warehouse Name** | The registered name of your warehouse location(s) |
| **Staging URL** | `https://staging-express.delhivery.com` |
| **AWB URL (Test)** | `https://staging-express.delhivery.com/waybill/api/bulk/` |
| **Pincode URL (Test)** | `https://staging-express.delhivery.com/c/api/pin-codes/` |

> **Important:** API Tokens are issued in two stages:
> - **Stage 1 — Test Token:** Used during integration testing in the sandbox environment.
> - **Stage 2 — Production Token:** Shared after successful UAT; used to access live APIs.
> - The token is unique per account. Do NOT share it with others.

### Pre-Requisite 2 — Warehouses / Pickup Locations

At least one registered pickup location must exist before order creation is possible.

Warehouses can be registered in one of two ways:
1. **Via email:** Send warehouse details to `Vendordesk@delhivery.com`
2. **Via API:** Use the [Client Warehouse Creation API](#711-client-warehouse-creation-api) (useful for dynamic/automated setups)

---

## 4. Authentication

All API calls require a **Bearer Token** passed in the HTTP `Authorization` header.

**Header format:**
```
Authorization: Token <your-api-token>
Content-Type: application/json
```

**Example (cURL):**
```bash
curl --location 'https://track.delhivery.com/api/v1/packages/' \
  --header 'Authorization: Token 787yguhbhb7755667' \
  --header 'Content-Type: application/json'
```

**B2B / LTL Login (Username + Password):**
For the B2B LTL system, an initial login call is required to obtain a session token:

```bash
curl --location 'https://ltl-clients-api.delhivery.com/ums/login' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }'
```

The response contains the auth token to be passed in subsequent B2B API calls.

> **Note:** Token values for Test and Production environments are different. Always test with the staging token before switching to the production token.

---

## 5. Base URLs — Test vs Production

| Environment | Base URL |
|---|---|
| **Test (Express)** | `https://staging-express.delhivery.com` |
| **Production (Express)** | `https://track.delhivery.com` |
| **Test (B2B LTL)** | `https://ltl-clients-api-dev.delhivery.com` |
| **Production (B2B LTL)** | `https://ltl-clients-api.delhivery.com` |
| **B2B Booking** | `https://btob.api.delhivery.com` |

All production REST URLs are structurally identical to their staging counterparts — only the base URL changes.

---

## 6. Integration Flow — 9 Steps

The following is the recommended integration sequence. Steps marked **Must Have** are required for basic functionality; others are optional enhancements.

| Step | API | Priority |
|---|---|---|
| 1 | Pin-code Serviceability Check | Must Have |
| 2 | Warehouse / Pickup Location Setup | Must Have |
| 3 | Pre-generate Waybill (AWB) | Must Have (for MPS) |
| 4 | Order / Package Creation (Manifestation) | Must Have |
| 5 | Generate Shipping Label (Packing Slip) | Must Have |
| 6 | Create Pickup Request | Can Have |
| 7 | Track Shipment | Must Have |
| 8 | Edit / Cancel Order | Can Have |
| 9 | NDR Action | Can Have |

---

## 7. API Reference

---

### 7.1 Pin-code Serviceability API

Validates whether a specific pin code is serviceable by Delhivery, and whether it supports **Prepaid** and/or **COD** shipments.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/c/api/pin-codes/json/?parameter` |
| Production | `https://track.delhivery.com/c/api/pin-codes/json/?parameter` |

**B2B / LTL Serviceability:**

| Environment | URL |
|---|---|
| Test | `https://ltl-clients-api-dev.delhivery.com/pincode-service/{pincode}` |
| Production | `https://ltl-clients-api.delhivery.com/pincode-service/{pincode}` |

**Response Flags:**

- The API returns each pincode with flags indicating serviceability for prepaid and COD.
- A response of `"NSZ"` (Not Serviceable Zone) on a waybill means the pincode cannot be serviced.

**Important Notes:**
- The serviceability API should be called during order allocation and booking.
- If a pincode is **not serviceable**, the booking/order creation API must **not** be called.

---

### 7.2 Bulk Waybill API

Generates a list of waybill numbers in advance. These pre-generated waybills can be stored and assigned to orders during creation.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/waybill/api/bulk/json/?cl={client_name}&token={api_token}&count={count}` |
| Production | `https://track.delhivery.com/waybill/api/bulk/json/?cl={client_name}&token={api_token}&count={count}` |

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `cl` | Yes | Your registered client name (case-sensitive) |
| `token` | Yes | Your API token |
| `count` | Yes | Number of waybills to generate |

**Rate Limits:**

- Maximum **10,000 waybills** per single request.
- Maximum **50,000 waybills** per 5 minutes. Exceeding this throttles your IP for 1 minute.

**Notes:**
- Waybills from this API differ from those provided during onboarding.
- For regular B2C single-piece shipments, if no waybill is passed in the order creation API, one is auto-assigned dynamically. This auto-assignment is **not available** for Multi-Piece Shipments (MPS).

---

### 7.3 Fetch Waybill API

Fetches a single waybill number on demand with each API call.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/waybill/api/fetch/` |
| Production | `https://track.delhivery.com/waybill/api/fetch/` |

Use this when you need one waybill at a time rather than fetching in bulk.

---

### 7.4 Order Creation / Manifestation API

Creates a shipment in Delhivery's system. This is the core API that pushes shipment soft data (seller details, consignee info, product details, pickup location, payment mode, etc.) to Delhivery.

**Method:** `POST`  
**Content-Type:** `application/x-www-form-urlencoded`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/cmu/create.json` |
| Production | `https://track.delhivery.com/api/cmu/create.json` |

**Payload format requirement:**
```
format=json&data=<JSON_ENCODED_PAYLOAD>
```
The `format=json&data=` prefix is **mandatory** in the request body.

**Waybill Assignment Options:**

Two approaches are supported:
1. **Pre-fill waybill:** Fetch a waybill from the Bulk/Fetch Waybill API and include it in the payload.
2. **Auto-assignment:** Leave the waybill field blank; Delhivery auto-generates one. (Only works for single-piece B2C shipments, not MPS.)

**Payment Mode Values:**

| Value | Use Case |
|---|---|
| `Prepaid` | Forward shipment — payment already made |
| `COD` | Forward shipment — collect cash at delivery |
| `Pickup` | Reverse shipment — picking up from customer |

**Key Mandatory Fields:**

| Field | Required | Notes |
|---|---|---|
| `pin` | Yes | Delivery pin code |
| `phone` | Yes | Consignee phone number |
| `address` | Yes | Delivery address |
| `order_id` | Yes* | Should be unique per order when waybill is not passed |
| `payment_mode` | Yes | `Prepaid`, `COD`, or `Pickup` |
| `pickup_location` | Yes | Exact name of registered warehouse (case-sensitive) |
| `client` | Yes | Exact client/HQ name as registered (case-sensitive) |
| `seller_gst_tin` | Yes | GST TIN of the seller |
| `hsn_code` | Yes | HSN code for each product in the package |
| `ewbn` (e-waybill) | Conditional | Mandatory if shipment value > ₹50,000 |

**Shipment Types:**

**Single-Piece Shipment:** One waybill represents a package that may contain multiple items (e.g., a box containing a T-shirt, shoes, and shampoo). Waybill is optional — can be auto-assigned.

**Multi-Piece Shipment (MPS):** Multiple separate boxes in one order. Each box must be assigned its own waybill explicitly. Auto-assignment does not apply.

**Uniqueness Rules for Order ID:**
- When waybill is **not** passed: Order ID must be unique across all orders.
- When waybill **is** passed: The primary key is `(order_id + waybill)`, so the same Order ID can appear with different waybills.

**Reverse Pickup (RVP) Order Creation:**

Use the same API and URL as forward shipment with these changes:
- Set `payment_mode = "Pickup"`
- If return address keys are passed, the shipment is delivered to that return address.
- If return address keys are not passed, the shipment is delivered to the warehouse address.

**Special Characters:**

The following characters are **not accepted** in payload fields: `&`, `#`, `%`, `;`, `\`

If a backslash is present, escape it as `\\`. If the payload is JSON-encoded, these characters are handled automatically.

**Fragile Shipments:**

Pass at the root level of the payload:
```json
{
  "fragile_shipment": true
}
```
Do not include this key if the shipment is not fragile.

---

### 7.5 Order Tracking API (Pull)

Retrieves real-time package details and current scan/status of a shipment.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/v1/packages/<waybill>/?parameter` |
| Production | `https://track.delhivery.com/api/v1/packages/<waybill>/?parameter` |

**Trackable Package Types:**

- **Prepaid:** Forward delivery, payment already collected.
- **COD:** Forward delivery, cash to be collected at door.
- **Pickup:** Reverse — collected from customer and returned to warehouse.

**Rate Limit:** 750 requests per 5 minutes per IP.

**Response:** Returns all scan events on the package including timestamps, locations, and status codes.

---

### 7.6 Tracking via Push API (Webhook)

Instead of polling the Pull API, you can receive real-time status updates automatically.

**Method:** `POST` (Delhivery pushes to your endpoint)

**How it works:**
1. Provide Delhivery with an open HTTPS endpoint URL on your server.
2. Delhivery configures your account to push every scan event to that endpoint in a default JSON format.
3. Your server must respond with an HTTP 200 to acknowledge receipt.

**Use this when:** You need near-real-time tracking updates without continuously polling the Pull API.

---

### 7.7 Edit Order API

Updates package details after manifestation. Allows correction of consignee details, address, or other order fields.

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/p/edit` |
| Production | `https://track.delhivery.com/api/p/edit` |

**Notes:**
- Only certain fields can be edited post-manifestation.
- The order must be in an editable state (not yet picked up or out for delivery).
- Special characters (`&`, `#`, `%`, `;`, `\`) are not accepted.

---

### 7.8 Cancel Order API

Cancels an existing shipment/order.

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/p/edit` |
| Production | `https://track.delhivery.com/api/p/edit` |

**Cancellation Key:**
```json
{
  "cancellation": "true"
}
```

**Allowed Statuses for Cancellation:**

The order must be in one of the following states:

- Manifested
- In Transit
- Pending
- Open
- Scheduled

**Post-Cancellation Status:**

| Shipment Type | Status After Cancellation |
|---|---|
| Prepaid / COD | Changed to `"Returned"` |
| Pickup (RVP) | Changed to `"Cancelled"` |

---

### 7.9 Packing Slip / Shipping Label API

Generates the shipping label (packing slip) for a given waybill. The label contains all information required to be printed on the physical package.

**Method:** `GET` / `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/p/packing_slip/?wbns=<waybill>` |
| Production | `https://track.delhivery.com/api/p/packing_slip/?wbns=<waybill>` |

**Notes:**
- The response provides all data needed to design your own label layout.
- This is an **optional** API — labels can also be downloaded directly from the Client Panel (CL Panel).
- For GST compliance, labels must include: HSN code, tax type, tax percentage, tax amount, and company authentication (signature and stamp).

---

### 7.10 Pickup Request Creation API

Schedules a pickup request so Delhivery's team collects manifested shipments from your warehouse.

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/fm/request/new/` |
| Production | `https://track.delhivery.com/fm/request/new/` |

**Required Inputs:**

| Field | Description |
|---|---|
| `pickup_time` | Requested pickup time |
| `pickup_date` | Requested pickup date |
| `pickup_location` | Registered warehouse name |
| `expected_package_count` | Number of packages to be picked up |

**Response:** Returns a `pickup_id` on success.

**Scheduling Rules:**
- Multiple pickup requests can be made per day, but only after the previous pickup has been completed (for a single warehouse).
- For multiple warehouses, multiple simultaneous pickup requests are allowed.
- This API is optional — pickup requests can also be created via the Client Panel.

---

### 7.11 Client Warehouse Creation API

Registers a new pickup location (warehouse) in Delhivery's system.

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/backend/clientwarehouse/create/` |
| Production | `https://track.delhivery.com/api/backend/clientwarehouse/create/` |

**Notes:**
- Every physical location from which shipments are picked up is treated as a "warehouse."
- Orders can only be created for **registered** pickup locations.
- This API is **optional** — Delhivery's FMS team can create warehouses on your behalf (recommended for one-time setups).
- Integrate this API if your use case requires **dynamic/automated** addition of pickup locations.
- Only the documented payload fields are accepted; no additional arbitrary key-value pairs.

A successful response returns the submitted warehouse details along with a success message in JSON.

---

### 7.12 Client Warehouse Edit API

Updates the details of an existing registered warehouse.

**Method:** `POST` (REST)

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/backend/clientwarehouse/edit/` |
| Production | `https://track.delhivery.com/api/backend/clientwarehouse/edit/` |

Use this to update address, contact information, or other warehouse metadata after initial registration.

---

### 7.13 Invoice / Shipping Charge Calculation API

Calculates an **approximate** shipping charge for a given shipment. Useful for displaying estimated costs to customers before order placement.

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/kinko/invoice/` |
| Production | `https://track.delhivery.com/api/kinko/invoice/` |

**Important Caveat:** This API provides **approximate/estimated** charges only. The actual billed amount may differ.

---

### 7.14 NDR (Non-Delivery Report) Action API

Allows clients to take action on packages that could not be delivered (NDR status). This is an **asynchronous** API — it always returns a `UPL ID` in the response, which can be used to check the status of the action.

**Sub-APIs:**

#### NDR Action API

**Method:** `POST`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/p/update` |
| Production | `https://track.delhivery.com/api/p/update` |

**Core Parameters:**

| Parameter | Mandatory | Type | Description |
|---|---|---|---|
| `waybill` | Yes | String | Waybill number of the NDR package |
| `act` | Yes | String | Action keyword (see below) |

**Available Actions (`act` values):**

**1. `DEFER_DLV` — Defer Delivery Date**
- Schedules delivery for a later date.
- Maximum deferral is **6 days from the first pending date**.
- Package must have one of the following status codes: `EOD-74`, `EOD-15`, `EOD-11`, `EOD-3`, `EOD-16`, `EOD-6`, `ST-108`

Additional parameter:

| Parameter | Mandatory | Type | Description |
|---|---|---|---|
| `deferred_date` | Yes | String | Date in `YYYY-MM-DD` format |

**2. `EDIT_DETAILS` — Edit Consignee Information**
- Corrects consignee name, phone, or address.
- Can only be applied when the package is in **pending** status.

Additional parameters (all optional but at least one required):

| Parameter | Mandatory | Type | Description |
|---|---|---|---|
| `name` | No | String | Consignee name |
| `phone` | No | String | Consignee phone number |
| `add` | No | String | Consignee address |

**3. `RE-ATTEMPT` — Schedule Re-Delivery Attempt**
- Requests a fresh delivery attempt as per NDR instructions.
- Package must be in **pending** status.
- Package must have one of the following status codes: `EOD-74`, `EOD-15`, `EOD-104`, `EOD-43`, `EOD-86`, `EOD-11`, `EOD-16`, `EOD-69`, `EOD-6`, `ST-108`

#### Get NDR Status API

Check the status of an NDR action using the `UPL ID` returned by the NDR Action API.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://staging-express.delhivery.com/api/p/update/status/?upl_id=<UPL_ID>` |
| Production | `https://track.delhivery.com/api/p/update/status/?upl_id=<UPL_ID>` |

---

### 7.15 B2B Serviceability API

Specific to the B2B/LTL (Less-Than-Truckload) product. Checks whether a pincode is serviceable for B2B freight shipments.

**Method:** `GET`

| Environment | URL |
|---|---|
| Test | `https://ltl-clients-api-dev.delhivery.com/pincode-service/{pincode}` |
| Production | `https://ltl-clients-api.delhivery.com/pincode-service/{pincode}` |

**Notes:**
- Must be called **before** booking a B2B order.
- If the pincode is not serviceable, the booking API must not be called.
- Requires a valid B2B auth token (obtained via the `/ums/login` endpoint).

---

## 8. Shipment Types & Flows

### Forward Flow (Prepaid / COD)

Client warehouse → Delhivery pickup → In transit → Delivered to consignee

Key `payment_mode` values: `Prepaid` or `COD`

**Package status progression (forward):**
Manifested → Picked Up → In Transit → Out for Delivery → Delivered

### Reverse Flow (Reverse Pickup / RVP)

Customer address → Delhivery pickup → In transit → Delivered to client warehouse

Key `payment_mode` value: `Pickup`

**Package status progression (reverse):**
Pickup Scheduled → Picked Up → In Transit → Delivered to Warehouse

### Package Lifecycle Summary

| Status | Description |
|---|---|
| Manifested | Order has been created in the system |
| Pending | Awaiting pickup or delivery attempt |
| Open | Pickup initiated |
| Scheduled | Pickup/delivery scheduled |
| In Transit | Package is moving through the network |
| Out for Delivery | With field agent for delivery |
| Delivered | Successfully delivered |
| Returned | Cancelled prepaid/COD shipment |
| Cancelled | Cancelled reverse pickup |

---

## 9. GST & Compliance Details

GST information can be provided in two ways:

**Option A — One-time registration:** Share GST details with your Delhivery Account Manager via the link provided in the onboarding email.

**Option B — Per-API call:** Include the following fields in each Order Creation API call.

| Field | Mandatory in API | Description |
|---|---|---|
| `seller_gst_tin` | **Yes** | GST TIN number of the seller |
| `hsn_code` | **Yes** | HSN code(s) for the product(s) in the package |
| `client_gst_tin` | No | GST TIN of the contracting entity with Delhivery |
| `consignee_gst_tin` | No | GST TIN of the consignee (for B2B shipments) |
| `invoice_reference` | No | Unique invoice reference number |

**E-Waybill Requirement:**

As per government guidelines, if the **total shipment value exceeds ₹50,000**, an e-waybill (`ewbn`) must be provided at the time of order creation. This is a mandatory field for high-value shipments.

**GST-Compliant Shipping Label:**

Labels must include: HSN code, tax type, tax percentage, tax amount, company signature/stamp.

---

## 10. Special Shipment Scenarios

### Bangladesh Delivery

Pass the following in the Order Creation payload:
```json
{
  "country": "BD",
  "pin": "<valid_bangladesh_pin>"
}
```
If `country` is not passed, the system defaults to India.

### Multi-Piece Shipments (MPS)

- Each box in the order must have its own unique waybill (pre-generated via Bulk Waybill API).
- All waybills must be explicitly passed in the order creation payload.
- Auto-assignment of waybills is not available for MPS.

### Fragile Shipments

Add at the root level of the order creation payload:
```json
{
  "fragile_shipment": true
}
```
Do not include this key if the shipment is not fragile.

### B2B Shipments (Consignee is a Business)

- Pass `consignee_gst_tin` in the order creation payload.
- Use the B2B LTL APIs for freight-level (larger/heavier) shipments.

---

## 11. Rate Limits & Throttling

| API | Limit |
|---|---|
| Order Tracking (Pull) | 750 requests per 5 minutes per IP |
| Bulk Waybill | 10,000 waybills per request; 50,000 per 5 minutes per IP (exceeding throttles IP for 1 minute) |
| Other APIs | Standard fair-use; no published hard limit (avoid burst calls) |

---

## 12. Error Handling & HTTP Codes

Delhivery uses standard HTTP status codes:

| Code | Meaning |
|---|---|
| `200 OK` | Request successful |
| `400 Bad Request` | Invalid payload, missing mandatory fields, or constraint violation |
| `401 Unauthorized` | Invalid or missing API token |
| `403 Forbidden` | Token does not have permission for this resource |
| `404 Not Found` | Requested resource (waybill, warehouse, etc.) not found |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Server-side error; retry after a delay |

**Common Error Triggers:**

- Pickup location name mismatch (case-sensitive; must match exactly as registered)
- Client HQ name mismatch (case-sensitive)
- Special characters in payload (`&`, `#`, `%`, `;`, `\`)
- Duplicate Order ID when waybill is not passed
- Pin code not serviceable (NSZ)
- Missing mandatory fields (`pin`, `phone`, `address`, `seller_gst_tin`, `hsn_code`)
- Attempting to cancel an order not in an allowed cancellation status

---

## 13. Best Practices

### General Development

1. **Identify HTTP method first** — check whether each endpoint is GET or POST before calling.
2. **Always pass the Authorization header** — format: `Token <api-key>` (e.g., if token is `abc123`, use `Token abc123`).
3. **Complete all testing before going to production** — thoroughly test every flow in the staging environment.
4. **Do not share API tokens** — tokens are account-specific and must remain confidential.
5. **Handle special characters carefully** — avoid `&`, `#`, `%`, `;`, `\` in payload values, or JSON-encode the payload.
6. **Pass maximum fields** — optional fields often have account-level defaults; passing explicit values ensures predictable behavior.
7. **Use unique Order IDs** — when not providing a waybill, Order IDs must be globally unique to prevent conflicts.
8. **Check serviceability before booking** — always call the Pincode Serviceability API before order creation.
9. **Validate warehouse names** — pickup location names are case-sensitive and must exactly match the registered name.

### For B2B/LTL

1. Always authenticate via `/ums/login` before calling other B2B endpoints.
2. Check pincode serviceability before every B2B booking.
3. Use the staging environment (`ltl-clients-api-dev.delhivery.com`) for all testing.

### For Embedded Testing (Swagger)

1. All test URLs are pre-configured in the embedded Swagger.
2. Fields marked **Required** are mandatory — the API will reject calls missing them.
3. Enter all values and click **Try it** to inspect the response and error structure.
4. Use the documented error scenarios to build robust error handling in your integration.

---

## 14. Plugins & E-commerce Integrations

Delhivery provides ready-made plugins for major e-commerce platforms:

| Platform | Version |
|---|---|
| **Magento** | 2.0 and above |
| **OpenCart** | 3.0 and above |
| **WooCommerce / WordPress** | Latest |
| **Shopify** | Latest |

These plugins handle order creation, tracking, and label generation automatically without direct API integration.

**Developer Portal (Self-Service Testing):**

- Access at: `https://one.delhivery.com/developer-portal/documents`
- Test APIs interactively (fill input parameters, check responses, copy cURL) at: `https://ucp.delhivery.com/developer-portal/v1/execute`
- **API Token generation:** Navigate to Main Menu → Settings → API Setup. The token is shown only once — copy and store it securely.

**Postman Collection:**

Download the pre-built Postman collection for all Express APIs:  
`https://www.getpostman.com/collections/7bac4693bb88bae8f16b`

---

## 15. Support & Escalation Matrix

| Query Type | Contact |
|---|---|
| **API/Technical Integration** | lastmile-integration@delhivery.com |
| **Operational Issues** | client.support@delhivery.com |
| **Onboarding / Credentials** | de.onb@delhivery.com |
| **Warehouse Registration** | Vendordesk@delhivery.com |
| **B2B/Freight Queries** | Contact your BD/CS Manager |
| **General Client Service** | clientservice@delhivery.com |

---

*This documentation is compiled from Delhivery's official developer portal and API reference. For the most current endpoint specifications, always refer to the live documentation at [one.delhivery.com/developer-portal/documents](https://one.delhivery.com/developer-portal/documents).*
