const express = require('express');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 3000;
const configuredDeliveryPartner = String(process.env.DELIVERY_PARTNER || 'mock').trim().toLowerCase();
const deliveryWebhookSecret = String(process.env.DELIVERY_WEBHOOK_SECRET || '').trim();
const delhiveryApiBaseUrl = String(process.env.DELHIVERY_API_BASE_URL || 'https://track.delhivery.com').trim().replace(/\/$/, '');
const delhiveryTrackingBaseUrl = String(process.env.DELHIVERY_TRACKING_BASE_URL || 'https://www.delhivery.com/track-v2/package/').trim().replace(/\/$/, '');
const delhiveryApiToken = String(process.env.DELHIVERY_API_TOKEN || '').trim();
const delhiveryPickupName = String(process.env.DELHIVERY_PICKUP_NAME || '').trim();

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPassword = (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
const usersDbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(usersDbPath);

const seedProducts = [
  { id: 1, name: 'Apples', category: 'Fruits', price: 3.99, image: 'https://source.unsplash.com/600x600/?apple,fruit', barcode: '8906140202217' },
  { id: 2, name: 'Oranges', category: 'Fruits', price: 4.49, image: 'https://source.unsplash.com/600x600/?orange,fruit', barcode: '8906140202218' },
  { id: 3, name: 'Bananas', category: 'Fruits', price: 2.99, image: 'https://source.unsplash.com/600x600/?banana,fruit', barcode: '8906140202219' },
  { id: 13, name: 'Mirchi', category: 'Vegetables', price: 1.29, image: 'https://images.pexels.com/photos/2893635/pexels-photo-2893635.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', barcode: '890100000013' },
  { id: 4, name: 'Tomatoes', category: 'Vegetables', price: 2.49, image: 'https://source.unsplash.com/600x600/?tomato,vegetable', barcode: '890100000004' },
  { id: 5, name: 'Carrots', category: 'Vegetables', price: 1.99, image: 'https://source.unsplash.com/600x600/?carrot,vegetable', barcode: '890100000005' },
  { id: 6, name: 'Broccoli', category: 'Vegetables', price: 3.49, image: 'https://source.unsplash.com/600x600/?broccoli,vegetable', barcode: '890100000006' },
  { id: 7, name: 'Books', category: 'Reading', price: 14.99, image: 'https://source.unsplash.com/600x600/?books,library', barcode: '890100000007' },
  { id: 8, name: 'Notebooks', category: 'Stationery', price: 4.99, image: 'https://source.unsplash.com/600x600/?notebook,stationery', barcode: '890100000008' },
  { id: 9, name: 'Pens', category: 'Stationery', price: 1.49, image: 'https://source.unsplash.com/600x600/?pen,stationery', barcode: '890100000009' },
  { id: 10, name: 'Plates', category: 'Kitchen', price: 12.99, image: 'https://source.unsplash.com/600x600/?plates,kitchen', barcode: '890100000010' },
  { id: 11, name: 'Bowls', category: 'Kitchen', price: 8.99, image: 'https://source.unsplash.com/600x600/?bowl,kitchen', barcode: '890100000011' },
  { id: 12, name: 'Utensils Set', category: 'Kitchen', price: 15.99, image: 'https://source.unsplash.com/600x600/?utensils,kitchen', barcode: '890100000012' },
  { id: 14, name: 'Milk', category: 'Dairy', price: 3.29, image: 'https://source.unsplash.com/600x600/?milk,dairy' }
];

const seedDresses = [
  {
    id: 101,
    name: 'Classic Blue Shirt',
    type: 'Men',
    category: 'Men Clothing',
    price: 34.99,
    image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302201'
  },
  {
    id: 102,
    name: 'Slim Fit Blazer',
    type: 'Men',
    category: 'Men Clothing',
    price: 69.99,
    image: 'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302202'
  },
  {
    id: 103,
    name: 'Casual White Tee',
    type: 'Men',
    category: 'Men Clothing',
    price: 19.99,
    image: 'https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302203'
  },
  {
    id: 201,
    name: 'Floral Summer Dress',
    type: 'Women',
    category: 'Women Clothing',
    price: 44.99,
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302204'
  },
  {
    id: 202,
    name: 'Elegant Evening Gown',
    type: 'Women',
    category: 'Women Clothing',
    price: 89.99,
    image: 'https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302205'
  },
  {
    id: 203,
    name: 'Casual Denim Look',
    type: 'Women',
    category: 'Women Clothing',
    price: 39.99,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    barcode: '8906140302206'
  }
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return emailRegex.test(normalizeEmail(email));
}

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function buildProductBarcode(productId) {
  const numericId = Number(productId) || 0;
  return String(890100000000 + numericId);
}

function buildDressBarcode(dressId) {
  const numericId = Number(dressId) || 0;
  return String(890200000000 + numericId);
}

function nowIso() {
  return new Date().toISOString();
}

function generateTrackingId(orderId) {
  const cleanOrderId = String(orderId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = String(Date.now()).slice(-6);
  return `TRK${cleanOrderId.slice(-8)}${suffix}`;
}

function generatePartnerShipmentId(orderId) {
  const cleanOrderId = String(orderId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = String(Date.now()).slice(-4);
  return `SHP${cleanOrderId.slice(-8)}${suffix}`;
}

function getFirstNonEmptyString(values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function normalizeDeliveryStatus(rawStatus) {
  const text = String(rawStatus || '').trim().toUpperCase();
  if (!text) {
    return 'BOOKED';
  }

  if (text.includes('DELIVERED')) {
    return 'DELIVERED';
  }

  if (text.includes('OUT FOR DELIVERY') || text.includes('OFD')) {
    return 'OUT_FOR_DELIVERY';
  }

  if (text.includes('IN TRANSIT') || text.includes('TRANSIT') || text.includes('DISPATCH')) {
    return 'IN_TRANSIT';
  }

  if (text.includes('PICKED') || text.includes('PICKUP')) {
    return 'PICKED_UP';
  }

  if (text.includes('RTO')) {
    return 'RTO';
  }

  if (text.includes('CANCEL')) {
    return 'CANCELLED';
  }

  return 'BOOKED';
}

function extractCityFromAddress(address) {
  const text = String(address || '').trim();
  if (!text) {
    return 'Bengaluru';
  }

  const parts = text.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Bengaluru';
}

function buildDelhiveryShipmentPayload(orderPayload) {
  const orderId = String(orderPayload.orderId || `ORD${Date.now()}`);
  const customer = orderPayload.customer || {};
  const customerName = String(customer.name || 'Customer').trim() || 'Customer';
  const customerAddress = String(customer.address || 'Address not provided').trim() || 'Address not provided';
  const customerPostalCode = String(customer.postalCode || '').trim();
  const customerPhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
  const amount = Number(orderPayload.amount) || 0;
  const isCod = String(orderPayload.paymentMethod || '').toUpperCase() === 'COD';

  return {
    shipments: [
      {
        name: customerName,
        add: customerAddress,
        pin: customerPostalCode,
        city: extractCityFromAddress(customerAddress),
        state: 'Karnataka',
        country: 'India',
        phone: customerPhone || '9000000000',
        order: orderId,
        payment_mode: isCod ? 'COD' : 'Prepaid',
        total_amount: amount,
        cod_amount: isCod ? amount : 0,
        shipment_width: Number(process.env.DELHIVERY_SHIPMENT_WIDTH || 10),
        shipment_height: Number(process.env.DELHIVERY_SHIPMENT_HEIGHT || 10),
        weight: Number(process.env.DELHIVERY_SHIPMENT_WEIGHT || 0.5),
      }
    ],
    pickup_location: {
      name: delhiveryPickupName,
    },
  };
}

async function createDelhiveryShipment(orderPayload) {
  if (!delhiveryApiToken) {
    throw new Error('DELHIVERY_API_TOKEN is required for Delhivery integration');
  }

  if (!delhiveryPickupName) {
    throw new Error('DELHIVERY_PICKUP_NAME is required for Delhivery integration');
  }

  const orderId = String(orderPayload.orderId || `ORD${Date.now()}`);
  const payload = buildDelhiveryShipmentPayload(orderPayload);
  const requestBody = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

  const response = await fetch(`${delhiveryApiBaseUrl}/api/cmu/create.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Token ${delhiveryApiToken}`,
    },
    body: requestBody,
  });

  const responseText = await response.text();
  let parsedResponse = {};
  try {
    parsedResponse = JSON.parse(responseText || '{}');
  } catch (error) {
    parsedResponse = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Delhivery create shipment failed (${response.status}): ${responseText}`);
  }

  const packageData = Array.isArray(parsedResponse.packages) ? parsedResponse.packages[0] : {};
  const waybill = getFirstNonEmptyString([
    packageData?.waybill,
    packageData?.awb,
    packageData?.waybill_num,
    parsedResponse?.waybill,
  ]);

  const trackingId = waybill || generateTrackingId(orderId);
  const partnerShipmentId = getFirstNonEmptyString([
    packageData?.refnum,
    packageData?.reference_number,
    orderId,
  ]) || orderId;

  return {
    orderId,
    partner: 'delhivery',
    partnerShipmentId,
    trackingId,
    trackingUrl: `${delhiveryTrackingBaseUrl}/${encodeURIComponent(trackingId)}`,
    status: 'BOOKED',
    rawResponse: parsedResponse,
  };
}

async function fetchDelhiveryTrackingStatus(trackingId) {
  if (!delhiveryApiToken) {
    return null;
  }

  const response = await fetch(`${delhiveryApiBaseUrl}/api/v1/packages/json/?waybill=${encodeURIComponent(String(trackingId || '').trim())}`, {
    method: 'GET',
    headers: {
      Authorization: `Token ${delhiveryApiToken}`,
    },
  });

  const responseText = await response.text();
  let parsedResponse = {};
  try {
    parsedResponse = JSON.parse(responseText || '{}');
  } catch (error) {
    parsedResponse = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Delhivery tracking failed (${response.status})`);
  }

  const shipmentData = Array.isArray(parsedResponse?.ShipmentData) ? parsedResponse.ShipmentData[0] : {};
  const shipment = shipmentData?.Shipment || {};
  const statusObject = shipment?.Status || {};
  const statusText = getFirstNonEmptyString([
    statusObject?.Status,
    statusObject?.StatusType,
    shipment?.Instructions,
  ]);

  return {
    status: normalizeDeliveryStatus(statusText),
    rawResponse: parsedResponse,
  };
}

function createMockShipment(order) {
  const orderId = String(order.orderId || `ORD${Date.now()}`);
  const trackingId = generateTrackingId(orderId);
  const partnerShipmentId = generatePartnerShipmentId(orderId);
  const status = 'BOOKED';

  return {
    orderId,
    partner: 'mock',
    partnerShipmentId,
    trackingId,
    trackingUrl: `https://mock-delivery.local/track/${trackingId}`,
    status,
    rawResponse: {
      success: true,
      provider: 'mock',
      message: 'Shipment created in mock mode',
      bookingTime: nowIso(),
    },
  };
}

function createBackfillShipment(orderPayload = {}) {
  const orderId = String(orderPayload.orderId || '').trim();
  const partner = String(orderPayload.partner || 'mock').trim().toLowerCase() || 'mock';
  const providedTrackingId = String(orderPayload.trackingId || '').trim();
  const trackingId = providedTrackingId || generateTrackingId(orderId || `ORD${Date.now()}`);
  const status = normalizeDeliveryStatus(orderPayload.status || 'BOOKED');

  return {
    orderId,
    partner,
    partnerShipmentId: String(orderPayload.partnerShipmentId || generatePartnerShipmentId(orderId)).trim(),
    trackingId,
    trackingUrl: String(orderPayload.trackingUrl || `https://mock-delivery.local/track/${trackingId}`).trim(),
    status,
    rawResponse: {
      success: true,
      provider: partner,
      backfill: true,
      message: 'Shipment record backfilled for existing transaction/order ID',
      backfilledAt: nowIso(),
    },
  };
}

function buildMockTimeline(currentStatus) {
  const allStatuses = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const now = Date.now();
  const currentIndex = Math.max(allStatuses.indexOf(String(currentStatus || '').toUpperCase()), 0);

  return allStatuses.map((status, index) => ({
    status,
    completed: index <= currentIndex,
    timestamp: index <= currentIndex ? new Date(now - ((currentIndex - index) * 45 * 60 * 1000)).toISOString() : null,
  }));
}

async function upsertDeliveryShipment(shipment, orderPayload = {}) {
  const orderId = String(shipment.orderId || '').trim();
  const partner = String(shipment.partner || configuredDeliveryPartner || 'mock').trim().toLowerCase();
  const partnerShipmentId = String(shipment.partnerShipmentId || '').trim();
  const trackingId = String(shipment.trackingId || '').trim();
  const trackingUrl = String(shipment.trackingUrl || '').trim();
  const status = String(shipment.status || 'BOOKED').trim().toUpperCase();
  const paymentMethod = String(orderPayload.paymentMethod || '').trim().toUpperCase() || 'UNKNOWN';
  const amount = Number(orderPayload.amount) || 0;
  const customer = orderPayload.customer || {};
  const createdAt = String(shipment.createdAt || nowIso());
  const updatedAt = String(shipment.updatedAt || nowIso());
  const rawResponse = JSON.stringify(shipment.rawResponse || {});

  await run(
    `
      INSERT INTO delivery_shipments (
        order_id, partner, partner_shipment_id, tracking_id, tracking_url, status,
        payment_method, amount, customer_name, customer_email, customer_phone,
        customer_address, customer_postal_code, raw_response, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET
        partner = excluded.partner,
        partner_shipment_id = excluded.partner_shipment_id,
        tracking_id = excluded.tracking_id,
        tracking_url = excluded.tracking_url,
        status = excluded.status,
        payment_method = excluded.payment_method,
        amount = excluded.amount,
        customer_name = excluded.customer_name,
        customer_email = excluded.customer_email,
        customer_phone = excluded.customer_phone,
        customer_address = excluded.customer_address,
        customer_postal_code = excluded.customer_postal_code,
        raw_response = excluded.raw_response,
        updated_at = excluded.updated_at
    `,
    [
      orderId,
      partner,
      partnerShipmentId,
      trackingId,
      trackingUrl,
      status,
      paymentMethod,
      amount,
      String(customer.name || '').trim(),
      normalizeEmail(customer.email || ''),
      String(customer.phone || '').trim(),
      String(customer.address || '').trim(),
      String(customer.postalCode || '').trim(),
      rawResponse,
      createdAt,
      updatedAt,
    ]
  );
}

async function getDeliveryShipmentByOrderId(orderId) {
  return get(
    `
      SELECT
        order_id AS orderId,
        partner,
        partner_shipment_id AS partnerShipmentId,
        tracking_id AS trackingId,
        tracking_url AS trackingUrl,
        status,
        payment_method AS paymentMethod,
        amount,
        customer_name AS customerName,
        customer_email AS customerEmail,
        customer_phone AS customerPhone,
        customer_address AS customerAddress,
        customer_postal_code AS customerPostalCode,
        raw_response AS rawResponse,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM delivery_shipments
      WHERE order_id = ?
    `,
    [String(orderId || '').trim()]
  );
}

async function createShipmentWithPartner(orderPayload) {
  if (configuredDeliveryPartner === 'mock') {
    return createMockShipment(orderPayload);
  }

  if (configuredDeliveryPartner === 'delhivery') {
    return createDelhiveryShipment(orderPayload);
  }

  if (configuredDeliveryPartner === 'shiprocket' || configuredDeliveryPartner === 'porter') {
    throw new Error(`Delivery partner adapter not configured yet for ${configuredDeliveryPartner}. Set DELIVERY_PARTNER=mock for local testing.`);
  }

  throw new Error(`Unsupported delivery partner: ${configuredDeliveryPartner}`);
}

async function bookShipmentForOrder(orderPayload) {
  const shipment = await createShipmentWithPartner(orderPayload);
  await upsertDeliveryShipment(shipment, orderPayload);
  return shipment;
}

function verifyDeliveryWebhookSignature(body, signatureHeader) {
  if (!deliveryWebhookSecret) {
    return true;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', deliveryWebhookSecret)
    .update(JSON.stringify(body || {}))
    .digest('hex');

  return String(signatureHeader || '') === expectedSignature;
}

const adminTableQueries = {
  users: 'SELECT email, name FROM users ORDER BY email',
  products: 'SELECT id, name, category, price, barcode FROM products ORDER BY id',
  dresses: 'SELECT id, name, type, category, price, barcode FROM dresses ORDER BY id',
  delivery_shipments: `
    SELECT
      order_id AS orderId,
      partner,
      tracking_id AS trackingId,
      status,
      payment_method AS paymentMethod,
      amount,
      updated_at AS updatedAt
    FROM delivery_shipments
    ORDER BY updated_at DESC
  `,
};

async function getTableCount(tableName) {
  const row = await get(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(row?.count || 0);
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      barcode TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS dresses (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      barcode TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS delivery_shipments (
      order_id TEXT PRIMARY KEY,
      partner TEXT NOT NULL,
      partner_shipment_id TEXT NOT NULL,
      tracking_id TEXT NOT NULL,
      tracking_url TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      customer_postal_code TEXT,
      raw_response TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const productColumns = await all('PRAGMA table_info(products)');
  const hasBarcodeColumn = productColumns.some((column) => column.name === 'barcode');
  if (!hasBarcodeColumn) {
    await run('ALTER TABLE products ADD COLUMN barcode TEXT');
  }

  const dressColumns = await all('PRAGMA table_info(dresses)');
  const hasDressBarcodeColumn = dressColumns.some((column) => column.name === 'barcode');
  if (!hasDressBarcodeColumn) {
    await run('ALTER TABLE dresses ADD COLUMN barcode TEXT');
  }

  const row = await get('SELECT COUNT(*) AS count FROM users');
  if (row.count === 0) {
    const seedUsers = [
      { email: 'test@example.com', password: 'password123', name: 'Test User' },
      { email: 'john@shopping-app.com', password: 'password123', name: 'John Developer' },
      { email: 'user@example.com', password: 'password123', name: 'Demo User' }
    ];

    for (const user of seedUsers) {
      await run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [normalizeEmail(user.email), user.password, String(user.name).trim()]
      );
    }
  }

  for (const product of seedProducts) {
    const productBarcode = String(product.barcode || buildProductBarcode(product.id));
    await run(
      'INSERT OR IGNORE INTO products (id, name, category, price, image, barcode) VALUES (?, ?, ?, ?, ?, ?)',
      [product.id, product.name, product.category, product.price, product.image, productBarcode]
    );

    await run(
      'UPDATE products SET barcode = ? WHERE id = ? AND (barcode IS NULL OR barcode = "")',
      [productBarcode, product.id]
    );
  }

  for (const dress of seedDresses) {
    const dressBarcode = String(dress.barcode || buildDressBarcode(dress.id));
    await run(
      'INSERT OR IGNORE INTO dresses (id, name, type, category, price, image, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dress.id, dress.name, dress.type, dress.category, dress.price, dress.image, dressBarcode]
    );

    await run(
      'UPDATE dresses SET barcode = ? WHERE id = ? AND (barcode IS NULL OR barcode = "")',
      [dressBarcode, dress.id]
    );
  }
}

async function findUserByEmail(email) {
  return get('SELECT email, password, name FROM users WHERE email = ?', [normalizeEmail(email)]);
}

async function emailExists(email) {
  const row = await get('SELECT 1 AS found FROM users WHERE email = ?', [normalizeEmail(email)]);
  return Boolean(row);
}

async function createUser(email, password, name) {
  await run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [normalizeEmail(email), String(password), String(name).trim()]
  );
}

async function updatePassword(email, newPassword) {
  await run('UPDATE users SET password = ? WHERE email = ?', [String(newPassword), normalizeEmail(email)]);
}

function createPhonePeChecksum(base64Payload, saltKey, pathName, saltIndex) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(base64Payload + pathName + saltKey)
    .digest('hex') + '###' + saltIndex;
}

function createCheckoutChatReply(message, context = {}) {
  const text = String(message || '').toLowerCase();
  const hasUpi = Boolean(String(context.upiId || '').trim());
  const hasEmail = isValidEmail(context.email || '');
  const name = String(context.name || '').trim() || 'there';

  if (!text.trim()) {
    return 'Please type your question. I can help with UPI, email confirmation, and payment errors.';
  }

  if (text.includes('upi')) {
    if (hasUpi) {
      return `You already added a UPI ID. You can submit now, ${name}.`;
    }
    return 'UPI is optional. You can add a UPI ID like name@bank, or continue without it.';
  }

  if (text.includes('email') || text.includes('confirmation') || text.includes('receipt')) {
    if (hasEmail) {
      return `After submit, confirmation will be sent to ${normalizeEmail(context.email)}.`;
    }
    return 'Please enter a valid email in delivery details to receive confirmation updates.';
  }

  if (text.includes('fail') || text.includes('error') || text.includes('unable')) {
    return 'If submit fails, keep this page open, ensure backend is running (npm run api), then retry Submit and Pay.';
  }

  if (text.includes('without upi') || text.includes('no upi') || text.includes('optional')) {
    return 'Yes, checkout works without UPI. Email will be used for confirmation.';
  }

  if (text.includes('status') || text.includes('order')) {
    if (context.testMode) {
      return 'You are in test mode right now. Order and email status will appear after submit.';
    }
    return 'Order status appears on this page after submit and payment redirection.';
  }

  if (text.includes('hello') || text.includes('hi')) {
    return `Hi ${name}! Ask me about UPI, email confirmation, or payment troubleshooting.`;
  }

  return 'I can help with checkout steps, UPI setup, email confirmation, and payment troubleshooting.';
}

async function sendOrderConfirmationEmail(email, customerName, merchantTransactionId, amount) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return {
      email: '',
      message: 'No valid email provided for order confirmation.',
      sent: false,
      testMode: true,
    };
  }

  if (!transporter || !hasEmailCredentials || !isEmailServiceReady) {
    return {
      email: normalizedEmail,
      message: `Order submitted. Confirmation generated in TEST MODE for ${normalizedEmail}.`,
      sent: false,
      testMode: true,
    };
  }

  const mailOptions = {
    from: emailUser || 'shopping-app@example.com',
    to: normalizedEmail,
    subject: `Order Confirmation - ${merchantTransactionId}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #1677df;">Order Submitted</h2><p>Hello ${String(customerName || 'Customer')},</p><p>Your order has been submitted successfully.</p><p><strong>Transaction ID:</strong> ${merchantTransactionId}</p><p><strong>Amount:</strong> Rs ${Number(amount).toFixed(2)}</p><p>Thank you for shopping with us.</p></div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      email: normalizedEmail,
      message: `Order submitted. Confirmation email sent to ${normalizedEmail}.`,
      sent: true,
      testMode: false,
    };
  } catch (error) {
    console.log('❌ Order confirmation email error:', error.message);
    isEmailServiceReady = false;
    return {
      email: normalizedEmail,
      message: `Order submitted, but email could not be sent. Test confirmation generated for ${normalizedEmail}.`,
      sent: false,
      testMode: true,
    };
  }
}

// SMS Configuration (Twilio)
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

let twilioClient = null;
let isSmsServiceReady = false;

// Only initialize Twilio if all credentials are valid
if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && 
    !twilioAccountSid.includes('your_twilio') && 
    !twilioAuthToken.includes('your_twilio') &&
    !twilioPhoneNumber.includes('your_twilio')) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    isSmsServiceReady = true;
    console.log('✅ SMS service ready!');
  } catch (error) {
    console.log('⚠️  SMS service initialization failed:', error.message);
    isSmsServiceReady = false;
  }
} else {
  console.log('ℹ️  SMS service not configured (use TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env)');
}

// Check if email credentials are configured
const hasEmailCredentials = emailUser && 
                           emailPassword && 
                           !emailUser.includes('your-email') &&
                           !emailPassword.includes('your-16');

let transporter = null;
let isEmailServiceReady = false;

// Configure email service only if credentials are available
if (hasEmailCredentials) {
  if (emailPassword.length !== 16) {
    console.log('⚠️  EMAIL_PASSWORD should be a 16-character Gmail App Password');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email service error:', error.message);
      isEmailServiceReady = false;
    } else {
      console.log('✅ Email service ready!');
      isEmailServiceReady = true;
    }
  });
} else {
  console.log('ℹ️  Email service in TEST MODE');
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use('/product-images', express.static(path.join(__dirname, '..', 'public', 'product-images')));

// CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:4200';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-requested-with');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Shopping App backend is running',
    endpoints: ['/health', '/products', '/dresses', '/delivery/track/:orderId'],
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/admin/db/summary', async (req, res) => {
  try {
    const summary = await Promise.all(
      Object.keys(adminTableQueries).map(async (table) => ({
        table,
        count: await getTableCount(table),
      }))
    );

    res.json({
      database: path.basename(usersDbPath),
      summary,
      serverTime: nowIso(),
    });
  } catch (error) {
    console.log('❌ DB summary error:', error.message);
    res.status(500).json({ message: 'Unable to load database summary' });
  }
});

app.get('/admin/db/table/:tableName', async (req, res) => {
  const tableName = String(req.params.tableName || '').trim();
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const baseQuery = adminTableQueries[tableName];

  if (!baseQuery) {
    return res.status(400).json({
      message: 'Invalid table name',
      allowedTables: Object.keys(adminTableQueries),
    });
  }

  try {
    const rows = await all(`${baseQuery} LIMIT ?`, [limit]);
    res.json({
      table: tableName,
      limit,
      count: rows.length,
      rows,
    });
  } catch (error) {
    console.log('❌ DB table read error:', error.message);
    res.status(500).json({ message: 'Unable to load table data' });
  }
});

app.post('/chat-assistant', (req, res) => {
  const { message, context = {} } = req.body || {};

  const reply = createCheckoutChatReply(message, context);
  res.json({ reply });
});

app.post('/login', (req, res) => {
  console.log('🔐 /login endpoint called');
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  findUserByEmail(email).then((user) => {
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.password !== password) {
      console.log('❌ Incorrect password for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ Login successful:', email);

    res.cookie('token', 'node-session-123', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      message: 'Login successful',
      email: user.email,
      name: user.name,
      token: 'node-session-123'
    });
  }).catch((error) => {
    console.log('❌ Login database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  });
});

app.get('/me', (req, res) => {
  const token = req.cookies.token || '';
  res.json({ token });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Cookie cleared from Node.js' });
});

app.get('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({
    id: 1,
    name: 'John Developer',
    email: 'john@shopping-app.com'
  });
});

app.get('/dresses', async (req, res) => {
  try {
    const dresses = await all('SELECT id, name, type, category, price, image, barcode FROM dresses ORDER BY id');
    res.json(dresses);
  } catch (error) {
    console.log('❌ Dresses database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, category, price, image, barcode FROM products ORDER BY id', [], (error, resultRows) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(resultRows);
      });
    });

    const specificProductImages = {
      oranges: 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      plates: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20600%20600%27%3E%3Crect%20width%3D%27600%27%20height%3D%27600%27%20fill%3D%27%23edf2f7%27/%3E%3Cellipse%20cx%3D%27300%27%20cy%3D%27480%27%20rx%3D%27170%27%20ry%3D%2738%27%20fill%3D%27%23cdd5df%27/%3E%3Ccircle%20cx%3D%27300%27%20cy%3D%27270%27%20r%3D%27195%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23cfd7e3%27%20stroke-width%3D%2716%27/%3E%3Ccircle%20cx%3D%27300%27%20cy%3D%27270%27%20r%3D%27122%27%20fill%3D%27%23f8fbff%27%20stroke%3D%27%23dbe2ec%27%20stroke-width%3D%278%27/%3E%3Ccircle%20cx%3D%27214%27%20cy%3D%27158%27%20r%3D%2766%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23d9e0ea%27%20stroke-width%3D%278%27/%3E%3Ccircle%20cx%3D%27386%27%20cy%3D%27158%27%20r%3D%2766%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23d9e0ea%27%20stroke-width%3D%278%27/%3E%3C/svg%3E",
      'utensils set': 'https://images.pexels.com/photos/6996329/pexels-photo-6996329.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'
    };

    const normalizedRows = rows.map((row) => {
      const productName = String(row.name || '').trim().toLowerCase();
      if (specificProductImages[productName]) {
        return {
          ...row,
          image: specificProductImages[productName]
        };
      }

      const imageUrl = String(row.image || '').trim();
      if (imageUrl.startsWith('https://source.unsplash.com/')) {
        const keyword = encodeURIComponent(
          String(row.name || row.category || 'product')
            .toLowerCase()
            .replace(/\s+/g, '-')
        );
        const lock = Number(row.id) || 1;
        return {
          ...row,
          image: `https://loremflickr.com/600/600/${keyword}?lock=${lock}`
        };
      }

      return row;
    });

    res.json(normalizedRows);
  } catch (error) {
    console.log('❌ Products database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/products/barcode/:barcode', async (req, res) => {
  const barcode = String(req.params.barcode || '').trim();
  if (!/^\d{8,14}$/.test(barcode)) {
    return res.status(400).json({ message: 'Barcode must be 8 to 14 digits' });
  }

  try {
    const product = await get(
      'SELECT id, name, category, price, image, barcode FROM products WHERE barcode = ?',
      [barcode]
    );

    if (!product) {
      const dressMatch = await get(
        'SELECT id, name, type, category, price, image, barcode FROM dresses WHERE barcode = ?',
        [barcode]
      );

      if (!dressMatch) {
        const seedDressMatch = seedDresses.find((dress) => String(dress.barcode || '').trim() === barcode);
        if (!seedDressMatch) {
          return res.status(404).json({ message: 'No product found for this barcode' });
        }

        return res.json({
          id: seedDressMatch.id,
          name: seedDressMatch.name,
          category: seedDressMatch.category,
          price: seedDressMatch.price,
          image: seedDressMatch.image,
          barcode: seedDressMatch.barcode,
        });
      }

      return res.json({
        id: dressMatch.id,
        name: dressMatch.name,
        category: dressMatch.category,
        price: dressMatch.price,
        image: dressMatch.image,
        barcode: dressMatch.barcode,
      });
    }

    const specificProductImages = {
      oranges: 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      plates: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20600%20600%27%3E%3Crect%20width%3D%27600%27%20height%3D%27600%27%20fill%3D%27%23edf2f7%27/%3E%3Cellipse%20cx%3D%27300%27%20cy%3D%27480%27%20rx%3D%27170%27%20ry%3D%2738%27%20fill%3D%27%23cdd5df%27/%3E%3Ccircle%20cx%3D%27300%27%20cy%3D%27270%27%20r%3D%27195%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23cfd7e3%27%20stroke-width%3D%2716%27/%3E%3Ccircle%20cx%3D%27300%27%20cy%3D%27270%27%20r%3D%27122%27%20fill%3D%27%23f8fbff%27%20stroke%3D%27%23dbe2ec%27%20stroke-width%3D%278%27/%3E%3Ccircle%20cx%3D%27214%27%20cy%3D%27158%27%20r%3D%2766%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23d9e0ea%27%20stroke-width%3D%278%27/%3E%3Ccircle%20cx%3D%27386%27%20cy%3D%27158%27%20r%3D%2766%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%23d9e0ea%27%20stroke-width%3D%278%27/%3E%3C/svg%3E",
      'utensils set': 'https://images.pexels.com/photos/6996329/pexels-photo-6996329.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'
    };

    const productName = String(product.name || '').trim().toLowerCase();
    if (specificProductImages[productName]) {
      return res.json({
        ...product,
        image: specificProductImages[productName]
      });
    }

    const imageUrl = String(product.image || '').trim();
    if (imageUrl.startsWith('https://source.unsplash.com/')) {
      const keyword = encodeURIComponent(
        String(product.name || product.category || 'product')
          .toLowerCase()
          .replace(/\s+/g, '-')
      );
      const lock = Number(product.id) || 1;
      return res.json({
        ...product,
        image: `https://loremflickr.com/600/600/${keyword}?lock=${lock}`
      });
    }

    res.json(product);
  } catch (error) {
    console.log('❌ Barcode lookup error:', error.message);
    res.status(500).json({ message: 'Database error while searching barcode' });
  }
});

app.post('/products/barcode', async (req, res) => {
  const { id, barcode } = req.body || {};
  const productId = Number(id);
  const normalizedBarcode = String(barcode || '').trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'Valid product id is required' });
  }

  if (!/^\d{8,14}$/.test(normalizedBarcode)) {
    return res.status(400).json({ message: 'Barcode must be 8 to 14 digits' });
  }

  try {
    const updateResult = await run('UPDATE products SET barcode = ? WHERE id = ?', [normalizedBarcode, productId]);
    if (!updateResult.changes) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Barcode saved successfully', id: productId, barcode: normalizedBarcode });
  } catch (error) {
    console.log('❌ Barcode update error:', error.message);
    res.status(500).json({ message: 'Database error while saving barcode' });
  }
});

app.post('/delivery/create-shipment', async (req, res) => {
  const { orderId, amount, customer = {}, items = [], paymentMethod = 'UNKNOWN' } = req.body || {};
  const normalizedOrderId = String(orderId || '').trim();

  if (!normalizedOrderId) {
    return res.status(400).json({ message: 'orderId is required' });
  }

  if (!Number(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'At least one item is required to create shipment' });
  }

  try {
    const shipment = await bookShipmentForOrder({
      orderId: normalizedOrderId,
      amount: Number(amount),
      customer,
      items,
      paymentMethod,
    });

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
    });
  } catch (error) {
    console.log('❌ Shipment booking error:', error.message);
    res.status(502).json({ message: 'Unable to create shipment', details: error.message });
  }
});

app.post('/delivery/backfill-shipment', async (req, res) => {
  const {
    orderId,
    amount = 0,
    paymentMethod = 'UPI',
    customer = {},
    trackingId = '',
    trackingUrl = '',
    partnerShipmentId = '',
    status = 'BOOKED',
    partner = 'mock',
  } = req.body || {};

  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) {
    return res.status(400).json({ message: 'orderId is required for backfill' });
  }

  try {
    const existing = await getDeliveryShipmentByOrderId(normalizedOrderId);
    if (existing) {
      return res.json({
        message: 'Shipment already exists for this order ID',
        orderId: normalizedOrderId,
        alreadyExisted: true,
      });
    }

    const shipment = createBackfillShipment({
      orderId: normalizedOrderId,
      partner,
      partnerShipmentId,
      trackingId,
      trackingUrl,
      status,
    });

    await upsertDeliveryShipment(shipment, {
      amount: Number(amount) || 0,
      paymentMethod,
      customer,
    });

    res.status(201).json({
      message: 'Shipment backfilled successfully',
      orderId: normalizedOrderId,
      alreadyExisted: false,
      shipment,
    });
  } catch (error) {
    console.log('❌ Backfill shipment error:', error.message);
    res.status(500).json({ message: 'Unable to backfill shipment', details: error.message });
  }
});

app.get('/delivery/track/:orderId', async (req, res) => {
  const orderId = String(req.params.orderId || '').trim();
  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required' });
  }

  try {
    const shipment = await getDeliveryShipmentByOrderId(orderId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found for this order' });
    }

    if (shipment.partner === 'delhivery' && shipment.trackingId) {
      try {
        const liveTracking = await fetchDelhiveryTrackingStatus(shipment.trackingId);
        if (liveTracking?.status) {
          await run(
            'UPDATE delivery_shipments SET status = ?, raw_response = ?, updated_at = ? WHERE order_id = ?',
            [liveTracking.status, JSON.stringify(liveTracking.rawResponse || {}), nowIso(), orderId]
          );
          shipment.status = liveTracking.status;
          shipment.rawResponse = JSON.stringify(liveTracking.rawResponse || {});
          shipment.updatedAt = nowIso();
        }
      } catch (error) {
        console.log('⚠️ Delhivery live tracking fetch failed:', error.message);
      }
    }

    let parsedRawResponse = {};
    try {
      parsedRawResponse = JSON.parse(String(shipment.rawResponse || '{}'));
    } catch (error) {
      parsedRawResponse = {};
    }

    res.json({
      ...shipment,
      rawResponse: parsedRawResponse,
      timeline: shipment.partner === 'mock' ? buildMockTimeline(shipment.status) : [],
    });
  } catch (error) {
    console.log('❌ Shipment tracking error:', error.message);
    res.status(500).json({ message: 'Unable to track shipment right now' });
  }
});

app.post('/delivery/webhook', async (req, res) => {
  const signature = req.headers['x-delivery-signature'];
  if (!verifyDeliveryWebhookSignature(req.body, signature)) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  const { orderId, status, trackingId, trackingUrl, partnerShipmentId, partner } = req.body || {};
  const normalizedOrderId = String(orderId || '').trim();
  const normalizedStatus = String(status || '').trim().toUpperCase();

  if (!normalizedOrderId || !normalizedStatus) {
    return res.status(400).json({ message: 'orderId and status are required' });
  }

  try {
    const existingShipment = await getDeliveryShipmentByOrderId(normalizedOrderId);
    if (!existingShipment) {
      return res.status(404).json({ message: 'Shipment not found for this order' });
    }

    await run(
      `
        UPDATE delivery_shipments
        SET
          status = ?,
          tracking_id = COALESCE(NULLIF(?, ''), tracking_id),
          tracking_url = COALESCE(NULLIF(?, ''), tracking_url),
          partner_shipment_id = COALESCE(NULLIF(?, ''), partner_shipment_id),
          partner = COALESCE(NULLIF(?, ''), partner),
          raw_response = ?,
          updated_at = ?
        WHERE order_id = ?
      `,
      [
        normalizedStatus,
        String(trackingId || '').trim(),
        String(trackingUrl || '').trim(),
        String(partnerShipmentId || '').trim(),
        String(partner || '').trim().toLowerCase(),
        JSON.stringify(req.body || {}),
        nowIso(),
        normalizedOrderId,
      ]
    );

    res.json({ message: 'Shipment status updated', orderId: normalizedOrderId, status: normalizedStatus });
  } catch (error) {
    console.log('❌ Delivery webhook update error:', error.message);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
});

app.post('/phonepe/initiate', async (req, res) => {
  const {
    amount,
    customer = {},
    items = [],
    frontendUrl,
  } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount is required for payment' });
  }

  const merchantId = process.env.PHONEPE_MERCHANT_ID || '';
  const saltKey = process.env.PHONEPE_SALT_KEY || '';
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const apiBaseUrl = process.env.PHONEPE_API_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  const redirectBaseUrl = frontendUrl || 'http://localhost:4200';
  const fallbackPhonePeNumber = '9113808074';
  const fallbackUpiId = `${fallbackPhonePeNumber}@ybl`;
  const payeeUpiId = String(customer.upiId || fallbackUpiId).trim() || fallbackUpiId;

  const merchantTransactionId = `TXN${Date.now()}`;
  const upiParams = new URLSearchParams({
    pa: payeeUpiId,
    pn: 'Shopping App',
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: `Order ${merchantTransactionId}`
  });
  const upiIntentUrl = `upi://pay?${upiParams.toString()}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiIntentUrl)}`;

  const payload = {
    merchantId,
    merchantTransactionId,
    merchantUserId: normalizeEmail(customer.email) || 'guest-user',
    amount: Math.round(Number(amount) * 100),
    redirectUrl: `${redirectBaseUrl}/checkout?status=success&transactionId=${merchantTransactionId}`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${redirectBaseUrl}/api/phonepe/callback`,
    mobileNumber: customer.phone || '',
    paymentInstrument: {
      type: 'PAY_PAGE'
    },
    metaInfo: {
      customerName: customer.name || '',
      itemCount: items.length,
      upiId: payeeUpiId,
      payeePhone: fallbackPhonePeNumber,
      contactEmail: customer.email || ''
    }
  };

  const emailStatus = await sendOrderConfirmationEmail(
    customer.email,
    customer.name,
    merchantTransactionId,
    Number(amount)
  );

  let shipment = null;
  let shipmentError = '';
  try {
    shipment = await bookShipmentForOrder({
      orderId: merchantTransactionId,
      amount: Number(amount),
      customer: {
        name: String(customer.name || '').trim(),
        email: normalizeEmail(customer.email || ''),
        phone: String(customer.phone || '').trim(),
        address: String(customer.address || '').trim(),
        postalCode: String(customer.postalCode || '').trim(),
      },
      items,
      paymentMethod: 'UPI',
    });
  } catch (error) {
    shipmentError = error.message;
    console.log('❌ UPI shipment booking failed:', error.message);
  }

  if (!merchantId || !saltKey) {
    return res.json({
      message: 'PhonePe test mode: merchant credentials not configured',
      emailMessage: emailStatus.message,
      email: emailStatus.email,
      upiId: payeeUpiId,
      upiIntentUrl,
      qrCodeUrl,
      testMode: true,
      merchantTransactionId,
      paymentUrl: `${redirectBaseUrl}/checkout?status=test-mode&transactionId=${merchantTransactionId}`,
      shipment,
      shipmentError,
      payload,
    });
  }

  try {
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = createPhonePeChecksum(base64Payload, saltKey, '/pg/v1/pay', saltIndex);

    const response = await fetch(`${apiBaseUrl}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const responseBody = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: 'PhonePe payment initiation failed',
        details: responseBody,
      });
    }

    const paymentUrl = responseBody?.data?.instrumentResponse?.redirectInfo?.url || '';

    res.json({
      message: 'PhonePe payment initiated',
      emailMessage: emailStatus.message,
      email: emailStatus.email,
      upiId: payeeUpiId,
      upiIntentUrl,
      qrCodeUrl,
      merchantTransactionId,
      paymentUrl,
      shipment,
      shipmentError,
      rawResponse: responseBody,
    });
  } catch (error) {
    console.log('❌ PhonePe initiation error:', error.message);
    res.status(500).json({ message: 'PhonePe gateway unavailable' });
  }
});

app.post('/phonepe/callback', (req, res) => {
  res.json({ message: 'PhonePe callback received', ok: true });
});

app.post('/order/cod', async (req, res) => {
  const {
    amount,
    customer = {},
    items = [],
  } = req.body || {};

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount is required for COD order' });
  }

  const customerName = String(customer.name || '').trim();
  const customerEmail = normalizeEmail(customer.email || '');
  const customerPhone = String(customer.phone || '').trim();
  const customerAddress = String(customer.address || '').trim();
  const customerPostalCode = String(customer.postalCode || '').trim();

  if (!customerName || !customerEmail || !customerPhone || !customerAddress || !customerPostalCode) {
    return res.status(400).json({ message: 'Customer delivery details are required for COD order' });
  }

  if (!isValidEmail(customerEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (!/^\d{6}$/.test(customerPostalCode)) {
    return res.status(400).json({ message: 'Please enter a valid 6-digit postal code' });
  }

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'At least one item is required to place COD order' });
  }

  const orderId = `COD${Date.now()}`;
  const emailStatus = await sendOrderConfirmationEmail(
    customerEmail,
    customerName,
    orderId,
    Number(amount)
  );

  let shipment = null;
  let shipmentError = '';
  try {
    shipment = await bookShipmentForOrder({
      orderId,
      amount: Number(amount),
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress,
        postalCode: customerPostalCode,
      },
      items,
      paymentMethod: 'COD',
    });
  } catch (error) {
    shipmentError = error.message;
    console.log('❌ COD shipment booking failed:', error.message);
  }

  res.status(201).json({
    message: `Cash on Delivery order placed successfully. Order ID: ${orderId}`,
    emailMessage: emailStatus.message,
    email: emailStatus.email,
    orderId,
    paymentMethod: 'COD',
    shipment,
    shipmentError,
  });
});

app.post('/payment/card', async (req, res) => {
  const {
    amount,
    customer = {},
    card = {},
    items = [],
  } = req.body || {};

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount is required for card payment' });
  }

  const customerName = String(customer.name || '').trim();
  const customerEmail = normalizeEmail(customer.email || '');
  const customerPhone = String(customer.phone || '').trim();
  const customerAddress = String(customer.address || '').trim();
  const customerPostalCode = String(customer.postalCode || '').trim();

  if (!customerName || !customerEmail || !customerPhone || !customerAddress || !customerPostalCode) {
    return res.status(400).json({ message: 'Customer delivery details are required for card payment' });
  }

  if (!isValidEmail(customerEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (!/^\d{6}$/.test(customerPostalCode)) {
    return res.status(400).json({ message: 'Please enter a valid 6-digit postal code' });
  }

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'At least one item is required to place an order' });
  }

  const cardLast4 = String(card.last4 || '').replace(/\D/g, '').slice(-4);
  const cardHolderName = String(card.holderName || '').trim();
  const cardExpiry = String(card.expiry || '').trim();

  if (!cardLast4 || !cardHolderName || !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardExpiry)) {
    return res.status(400).json({ message: 'Please provide valid card details' });
  }

  const transactionId = `CARD${Date.now()}`;
  const emailStatus = await sendOrderConfirmationEmail(
    customerEmail,
    customerName,
    transactionId,
    Number(amount)
  );

  let shipment = null;
  let shipmentError = '';
  try {
    shipment = await bookShipmentForOrder({
      orderId: transactionId,
      amount: Number(amount),
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress,
        postalCode: customerPostalCode,
      },
      items,
      paymentMethod: 'CARD',
    });
  } catch (error) {
    shipmentError = error.message;
    console.log('❌ Card shipment booking failed:', error.message);
  }

  res.status(201).json({
    message: `Card payment successful. Transaction ID: ${transactionId}. Card ending ${cardLast4}.`,
    emailMessage: emailStatus.message,
    email: emailStatus.email,
    transactionId,
    paymentMethod: 'CARD',
    shipment,
    shipmentError,
  });
});

app.post('/check-email', (req, res) => {
  console.log('🔍 /check-email endpoint called');
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  emailExists(email).then((isRegistered) => {
    console.log(`Email ${email} registered:`, isRegistered);

    res.json({
      email: email,
      isRegistered: isRegistered,
      message: isRegistered ? 'Email found' : 'Email not registered'
    });
  }).catch((error) => {
    console.log('❌ Check-email database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  });
});

app.post('/signup', (req, res) => {
  console.log('📝 /signup endpoint called');
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (!String(name).trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const emailLower = normalizeEmail(email);
  emailExists(emailLower).then((exists) => {
    if (exists) {
      console.log('❌ Email already registered:', email);
      return res.status(409).json({ message: 'Email already registered' });
    }

    return createUser(emailLower, password, name).then(() => {
      console.log('✅ User registered:', email);

      res.cookie('token', 'node-session-123', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(201).json({
        message: 'Signup successful',
        email: emailLower,
        name: name,
        token: 'node-session-123'
      });
    });
  }).catch((error) => {
    console.log('❌ Signup database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  });
});

function sendPasswordResetEmail(email, frontendUrl, res) {
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const baseUrl = frontendUrl || 'http://localhost:4200';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: emailUser || 'shopping-app@example.com',
    to: email,
    subject: 'Password Reset Request - Shopping App',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #667eea;">Password Reset Request</h2><p>Hello,</p><p>Click the link below to reset your password:</p><p style="margin: 20px 0;"><a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block;">Reset Password</a></p><p style="color: #666; font-size: 12px;">Link: ${resetLink}</p></div>`
  };

  if (!transporter || !hasEmailCredentials || !isEmailServiceReady) {
    console.log('📧 Password reset link (TEST MODE):', resetLink);
    return res.json({ 
      message: 'Password reset link generated (TEST MODE)',
      email: email,
      resetLink: resetLink,
      testMode: true
    });
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Email error:', error.message);
      isEmailServiceReady = false;
      console.log('📧 Falling back to TEST MODE for password reset link');
      return res.json({ 
        message: 'Password reset link generated (TEST MODE)',
        email: email,
        resetLink: resetLink,
        testMode: true,
        warning: 'Email service unavailable. Check Gmail credentials.'
      });
    }
    console.log('✅ Email sent successfully');
    res.json({ 
      message: 'Email sent successfully',
      email: email 
    });
  });
}

app.post('/forgot-password', (req, res) => {
  console.log('📧 /forgot-password endpoint called');
  const { email, phone, method, frontendUrl } = req.body;
  const contactMethod = method || 'email'; // Default to email

  if (contactMethod === 'sms' && !phone) {
    console.log('❌ No phone provided for SMS');
    return res.status(400).json({ message: 'Phone number is required for SMS' });
  }

  if (contactMethod === 'email' && !email) {
    console.log('❌ No email provided');
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if email is registered (for email method)
  if (contactMethod === 'email' && email) {
    return emailExists(email).then((isRegistered) => {
      if (!isRegistered) {
        console.log('❌ Email not registered:', email);
        return res.status(404).json({
          message: 'Email not registered',
          isRegistered: false,
          suggestion: 'Please sign up first'
        });
      }
      console.log('✅ Email registered:', email);
      // Continue with sending password reset email
      sendPasswordResetEmail(email, frontendUrl, res);
    }).catch((error) => {
      console.log('❌ Forgot-password database error:', error.message);
      return res.status(500).json({ message: 'Database error' });
    });
  }

  // For SMS method
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const baseUrl = frontendUrl || 'http://localhost:4200';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email || phone)}`;

  if (contactMethod === 'sms') {
    console.log('📱 Sending SMS to:', phone);
    
    if (!isSmsServiceReady || !twilioClient) {
      console.log('📱 SMS TEST MODE - Reset link:', resetLink);
      return res.json({
        message: 'Password reset link generated (SMS TEST MODE)',
        phone: phone,
        resetLink: resetLink,
        testMode: true
      });
    }

    const smsMessage = `Your password reset link: ${resetLink}`;
    twilioClient.messages.create({
      body: smsMessage,
      from: twilioPhoneNumber,
      to: phone
    }).then(() => {
      console.log('✅ SMS sent successfully');
      res.json({
        message: 'Password reset link sent via SMS',
        phone: phone
      });
    }).catch((error) => {
      console.log('❌ SMS error:', error.message);
      console.log('📱 Falling back to SMS TEST MODE');
      return res.json({
        message: 'Password reset link generated (SMS TEST MODE)',
        phone: phone,
        resetLink: resetLink,
        testMode: true,
        warning: 'SMS service unavailable. Check Twilio credentials.'
      });
    });
  } else {
    // Email method - call helper function
    console.log('✓ Email received:', email);
    console.log('📧 Using frontend URL for reset link:', baseUrl);
    sendPasswordResetEmail(email, frontendUrl, res);
  }
});

app.post('/reset-password', (req, res) => {
  console.log('🔑 /reset-password endpoint called');
  const { token, email, newPassword } = req.body;
  
  if (!token || !email || !newPassword) {
    console.log('❌ Missing fields:', { token: !!token, email: !!email, newPassword: !!newPassword });
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  if (newPassword.length < 8) {
    console.log('❌ Password too short');
    return res.status(400).json({ message: 'Password too short' });
  }

  updatePassword(email, newPassword).then(async () => {
    const updatedUser = await findUserByEmail(email);
    if (!updatedUser) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({ message: 'Email not registered' });
    }

    console.log('✅ Password reset success for:', email);
    res.json({ 
      message: 'Password reset successfully!',
      email: email,
      testMode: true
    });
  }).catch((error) => {
    console.log('❌ Reset-password database error:', error.message);
    res.status(500).json({ message: 'Database error' });
  });
});

// 404 catch-all
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ message: 'Cannot ' + req.method + ' ' + req.path });
});

initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Node API running at http://192.168.1.9:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  });
