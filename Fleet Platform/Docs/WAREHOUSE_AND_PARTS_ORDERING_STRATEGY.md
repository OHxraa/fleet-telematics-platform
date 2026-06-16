# Warehouse & Parts Ordering Integration Strategy

**Purpose:** Enable customers to manage spare parts inventory, receive predictive maintenance alerts, and order directly from suppliers (BPW, etc.) through your platform

**Revenue Opportunity:** Commission on parts sales (5-15%) or margin markup (10-25%)

---

## 1. High-Level Architecture

```
Your Platform (Predictive Maintenance)
        │
        ├─→ Detects: "Vehicle ABC needs brake pads in 3 weeks"
        │
        ├─→ Checks: Customer's current inventory
        │
        ├─→ Alerts: Procurement team if stock is low
        │
        ├─→ Suggests: "Order from BPW (we've negotiated rates)"
        │
        ├─→ Customer clicks: "Order Now"
        │
        └─→ System: 
            ├─ Creates order in BPW's system (API)
            ├─ Updates customer's inventory tracking
            ├─ Tracks delivery status
            ├─ Notifies manager when delivered
            └─ You take 5-15% commission
```

---

## 2. System Components

### A. Warehouse Management System (WMS)

**What it tracks:**
- Current parts inventory (quantity on hand)
- Minimum stock thresholds
- Reorder points
- Supplier pricing
- Part locations (bin/shelf)
- Stock usage history
- Expiry dates (tires, fluids)

**Database Schema:**

```sql
-- Warehouse & Inventory Management

CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  warehouse_name VARCHAR,
  location_code VARCHAR,  -- e.g., "SHED-A-01"
  capacity INT,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE spare_parts_catalog (
  id UUID PRIMARY KEY,
  part_name VARCHAR NOT NULL,
  part_number VARCHAR UNIQUE NOT NULL,
  sku VARCHAR,
  category ENUM('brakes', 'tires', 'lights', 'fluids', 'suspension', 'other'),
  vehicle_compatibility VARCHAR[],  -- e.g., ['DAF XF', 'Volvo FH']
  supplier_id UUID REFERENCES suppliers(id),
  supplier_part_code VARCHAR,
  unit_price DECIMAL,
  supplier_name VARCHAR,
  lead_time_days INT,  -- How many days to deliver
  created_at TIMESTAMP
);

CREATE TABLE warehouse_inventory (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  warehouse_location_id UUID REFERENCES warehouse_locations(id),
  part_id UUID REFERENCES spare_parts_catalog(id),
  quantity_on_hand INT DEFAULT 0,
  minimum_stock_level INT,  -- Alert when drops below this
  reorder_quantity INT,      -- Order this many when low
  reorder_point INT,         -- Trigger order when reaches this
  last_counted DATE,
  last_updated TIMESTAMP,
  CONSTRAINT unique_inventory UNIQUE (customer_id, warehouse_location_id, part_id)
);

CREATE TABLE warehouse_transactions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  inventory_id UUID REFERENCES warehouse_inventory(id),
  transaction_type ENUM('in', 'out', 'adjustment', 'count'),
  quantity INT,
  reference_id VARCHAR,  -- Order ID, repair ticket, maintenance record
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE warehouse_stock_alerts (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  inventory_id UUID REFERENCES warehouse_inventory(id),
  alert_type ENUM('low_stock', 'out_of_stock', 'overstock', 'expiry_warning'),
  alert_status ENUM('active', 'acknowledged', 'resolved'),
  threshold_value INT,
  current_value INT,
  created_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id)
);
```

### B. Supplier Integration Layer

**Supported Suppliers:**

```javascript
// supplier-adapters.js

const suppliers = {
  bpw: {
    name: 'BPW',
    api_endpoint: 'https://api.bpw-ecom.com/v1',
    auth_type: 'oauth2',
    supported_operations: [
      'search_parts',
      'get_pricing',
      'get_stock',
      'create_order',
      'track_order',
      'get_invoice'
    ],
    commission_rate: 0.10,  // 10% commission
    catalog_sync_frequency: 'daily'
  },
  
  meritor: {
    name: 'Meritor',
    api_endpoint: 'https://api.meritor-parts.com/v2',
    auth_type: 'api_key',
    supported_operations: [
      'search_parts',
      'get_pricing',
      'get_stock',
      'create_order'
    ],
    commission_rate: 0.08,
    catalog_sync_frequency: 'daily'
  },

  hendrickson: {
    name: 'Hendrickson',
    api_endpoint: 'https://partner-api.hendrickson.com',
    auth_type: 'api_key',
    supported_operations: [
      'search_parts',
      'get_pricing',
      'get_stock'
    ],
    commission_rate: 0.12,
    catalog_sync_frequency: 'weekly'
  }
};
```

### C. Parts Order Management System

```sql
CREATE TABLE parts_orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  order_number VARCHAR UNIQUE,  -- Your order number
  supplier_order_id VARCHAR,    -- Supplier's order number
  supplier_id UUID REFERENCES suppliers(id),
  order_status ENUM('draft', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled'),
  order_date TIMESTAMP,
  expected_delivery DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL,
  supplier_amount DECIMAL,  -- What supplier charges
  platform_commission DECIMAL,  -- Your cut (10-15%)
  payment_status ENUM('pending', 'paid', 'failed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE parts_order_items (
  id UUID PRIMARY KEY,
  parts_order_id UUID REFERENCES parts_orders(id),
  part_id UUID REFERENCES spare_parts_catalog(id),
  quantity INT,
  unit_price DECIMAL,
  line_total DECIMAL,
  warehouse_location_id UUID REFERENCES warehouse_locations(id),  -- Where it goes
  created_at TIMESTAMP
);

CREATE TABLE parts_order_tracking (
  id UUID PRIMARY KEY,
  parts_order_id UUID REFERENCES parts_orders(id),
  tracking_status VARCHAR,  -- 'order_confirmed', 'picked', 'shipped', 'in_transit', 'delivered'
  tracking_number VARCHAR,
  carrier VARCHAR,
  updated_at TIMESTAMP,
  event_timestamp TIMESTAMP
);
```

### D. Maintenance-to-Inventory Link

```sql
-- Link maintenance predictions to parts ordering
CREATE TABLE maintenance_parts_recommendations (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  maintenance_type VARCHAR,  -- 'brake_pads', 'tire_replacement', etc.
  recommended_part_id UUID REFERENCES spare_parts_catalog(id),
  urgency ENUM('critical', 'high', 'medium', 'low'),
  estimated_need_date DATE,
  quantity_needed INT,
  estimated_cost DECIMAL,
  created_at TIMESTAMP,
  order_created BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES parts_orders(id)
);
```

---

## 3. BPW API Integration (Detailed)

### Authentication Flow

```javascript
// bpw-adapter.js

const axios = require('axios');

class BPWAdapter {
  constructor(customerId) {
    this.customerId = customerId;
    this.baseUrl = 'https://api.bpw-ecom.com/v1';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    // Get customer's BPW credentials from secure storage
    const bpwCredentials = await getCustomerBPWCredentials(this.customerId);
    
    const response = await axios.post(`${this.baseUrl}/oauth/token`, {
      client_id: bpwCredentials.client_id,
      client_secret: bpwCredentials.client_secret,
      grant_type: 'client_credentials'
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return this.accessToken;
  }

  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }
  }

  // Search parts catalog
  async searchParts(query) {
    await this.ensureAuthenticated();
    
    const response = await axios.get(`${this.baseUrl}/parts/search`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return response.data.parts.map(part => ({
      supplier_part_id: part.id,
      part_number: part.part_number,
      description: part.description,
      price: part.price_eur,
      stock_quantity: part.stock_level,
      lead_time_days: part.delivery_days,
      compatible_vehicles: part.vehicle_models
    }));
  }

  // Get real-time stock
  async getStockStatus(partId) {
    await this.ensureAuthenticated();

    const response = await axios.get(`${this.baseUrl}/parts/${partId}/stock`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return {
      part_id: partId,
      quantity_available: response.data.quantity,
      warehouse_locations: response.data.warehouses,
      expected_restock_date: response.data.next_delivery
    };
  }

  // Create order
  async createOrder(orderItems) {
    await this.ensureAuthenticated();

    const orderPayload = {
      customer_reference: `CUST-${this.customerId}-${Date.now()}`,
      delivery_address: {
        // Customer's warehouse address
      },
      items: orderItems.map(item => ({
        part_id: item.supplier_part_id,
        quantity: item.quantity
      })),
      preferred_delivery_date: orderItems[0].preferred_delivery_date
    };

    const response = await axios.post(`${this.baseUrl}/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return {
      supplier_order_id: response.data.order_id,
      status: response.data.status,
      total_amount: response.data.total_price_eur,
      expected_delivery: response.data.estimated_delivery_date,
      tracking_link: response.data.tracking_link
    };
  }

  // Track order
  async trackOrder(supplierId) {
    await this.ensureAuthenticated();

    const response = await axios.get(`${this.baseUrl}/orders/${supplierId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return {
      status: response.data.status,
      current_location: response.data.location,
      estimated_delivery: response.data.eta,
      tracking_events: response.data.tracking_history
    };
  }

  // Get invoice
  async getInvoice(supplierId) {
    await this.ensureAuthenticated();

    const response = await axios.get(`${this.baseUrl}/orders/${supplierId}/invoice`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return response.data;
  }
}

module.exports = BPWAdapter;
```

---

## 4. Complete Workflow: From Maintenance Alert to Order

```
Step 1: Predictive Maintenance Alert
┌────────────────────────────────────┐
│ AI predicts: Brake pads failing    │
│ in 3 weeks (Vehicle ABC)            │
└────────────┬────────────────────────┘
             │
Step 2: Check Customer's Inventory
┌────────────▼────────────────────────┐
│ Query: Do we have brake pads?        │
│ Current stock: 2 units               │
│ Minimum level: 5 units               │
│ ALERT: Stock is low!                 │
└────────────┬────────────────────────┘
             │
Step 3: Create Alert for Procurement Team
┌────────────▼────────────────────────┐
│ Send notification:                   │
│ "Brake pads low - need 8 more"      │
│ "Est. cost: €450"                   │
│ "Lead time: 5 days from BPW"        │
└────────────┬────────────────────────┘
             │
Step 4: Manager Clicks "Order from BPW"
┌────────────▼────────────────────────┐
│ Call BPW API: createOrder()          │
│ Request: 8 units of Brake Pad XYZ   │
│ Delivery to: Warehouse A             │
│ Return: Supplier Order ID #45821    │
└────────────┬────────────────────────┘
             │
Step 5: Create Order Record in Your System
┌────────────▼────────────────────────┐
│ Save parts_orders record:            │
│ - Order ID: ORD-2026-001             │
│ - Supplier ID: BPW-45821             │
│ - Status: submitted                  │
│ - Amount: €450                       │
│ - Your commission: €45 (10%)         │
└────────────┬────────────────────────┘
             │
Step 6: Track Order
┌────────────▼────────────────────────┐
│ Poll BPW API every 6 hours           │
│ Status: "shipped" → Send alert       │
│ Status: "delivered" → Auto-update    │
│         warehouse inventory          │
└────────────┬────────────────────────┘
             │
Step 7: Update Inventory When Delivered
┌────────────▼────────────────────────┐
│ warehouse_inventory.quantity += 8    │
│ Create transaction record            │
│ Clear "low stock" alert              │
│ Manager notified: "Brake pads       │
│ arrived and added to inventory"      │
└────────────┬────────────────────────┘
             │
Step 8: You Get Paid
┌────────────▼────────────────────────┐
│ Invoice paid by customer             │
│ You collect €45 commission           │
│ Track in analytics/reporting         │
└────────────────────────────────────┘
```

---

## 5. API Endpoints for Warehouse Management

### Inventory Management

```javascript
// GET all inventory for customer
GET /api/warehouse/inventory
Response: [
  {
    part_id: "...",
    part_name: "Brake Pad Set XYZ",
    quantity_on_hand: 2,
    minimum_level: 5,
    warehouse_location: "SHED-A-01",
    last_updated: "2026-06-16T10:30:00Z",
    low_stock_alert: true
  }
]

// GET specific part details
GET /api/warehouse/inventory/:partId
Response: {
  part_id: "...",
  part_name: "Brake Pad Set XYZ",
  quantity_on_hand: 2,
  minimum_level: 5,
  reorder_point: 3,
  reorder_quantity: 8,
  supplier: "BPW",
  supplier_price: €56.25,
  lead_time_days: 5,
  stock_history: [...],
  compatible_vehicles: ["DAF XF", "Volvo FH"]
}

// UPDATE inventory manually (stock count)
POST /api/warehouse/inventory/:partId/adjust
Body: {
  adjustment_quantity: 5,
  reason: "stock_count",
  notes: "Physical inventory count"
}

// GET all parts suppliers
GET /api/warehouse/suppliers
Response: [
  {
    supplier_id: "...",
    name: "BPW",
    api_status: "connected",
    commission_rate: 0.10,
    last_sync: "2026-06-16T08:00:00Z"
  }
]
```

### Parts Ordering

```javascript
// SEARCH for parts
GET /api/parts/search?q=brake%20pads
Response: [
  {
    part_id: "...",
    supplier: "BPW",
    part_number: "04.310.01.01.0",
    name: "Brake Pad Set (Composite)",
    price: €56.25,
    stock_status: "in_stock",
    lead_time: 5,
    compatible_vehicles: ["DAF XF", "Volvo FH"]
  },
  {
    part_id: "...",
    supplier: "Meritor",
    part_number: "Q+ PLUS",
    name: "Brake Pad Set (Premium)",
    price: €65.00,
    stock_status: "low_stock",
    lead_time: 7
  }
]

// CREATE order
POST /api/parts/orders
Body: {
  supplier_id: "bpw",
  items: [
    {
      part_id: "...",
      quantity: 8,
      warehouse_location_id: "..."
    }
  ],
  delivery_address_id: "...",
  preferred_delivery_date: "2026-07-05"
}
Response: {
  order_id: "ORD-2026-001",
  supplier_order_id: "BPW-45821",
  status: "submitted",
  total_amount: €450,
  your_commission: €45,
  expected_delivery: "2026-06-21"
}

// GET order status
GET /api/parts/orders/:orderId
Response: {
  order_id: "ORD-2026-001",
  supplier: "BPW",
  status: "shipped",
  items: [...],
  total_amount: €450,
  tracking_number: "DHL123456",
  estimated_delivery: "2026-06-21",
  tracking_events: [
    { status: "order_placed", timestamp: "2026-06-16T14:22:00Z" },
    { status: "picked", timestamp: "2026-06-17T09:15:00Z" },
    { status: "shipped", timestamp: "2026-06-18T16:45:00Z" }
  ]
}

// GET order history
GET /api/parts/orders?status=delivered&limit=20
Response: [...]

// CANCEL order
DELETE /api/parts/orders/:orderId
Response: {
  order_id: "ORD-2026-001",
  status: "cancelled",
  refund_amount: €450,
  message: "Order cancelled successfully"
}
```

### Stock Alerts & Notifications

```javascript
// GET all active alerts
GET /api/warehouse/alerts?status=active
Response: [
  {
    alert_id: "...",
    alert_type: "low_stock",
    part_name: "Brake Pad Set XYZ",
    current_quantity: 2,
    minimum_level: 5,
    shortage: 3,
    message: "Brake pads running low - consider ordering",
    created_at: "2026-06-16T10:30:00Z",
    action_needed: true,
    suggested_order: {
      quantity: 8,
      estimated_cost: €450,
      estimated_delivery_days: 5
    }
  }
]

// ACKNOWLEDGE alert
POST /api/warehouse/alerts/:alertId/acknowledge
Body: {
  acknowledged_by: "user_id",
  action_taken: "ordered",  // or "will_order_later", "not_needed"
  notes: "Order submitted to BPW"
}

// GET alerts history
GET /api/warehouse/alerts?status=resolved&limit=30
```

---

## 6. Stock Alert Rules & Automation

### Automatic Alert Generation

```javascript
// Alert logic in warehouse service

async function checkStockLevels(customerId) {
  const inventory = await getCustomerInventory(customerId);

  for (const item of inventory) {
    // Check 1: Low stock
    if (item.quantity_on_hand < item.minimum_stock_level) {
      await createAlert({
        customer_id: customerId,
        alert_type: 'low_stock',
        part_id: item.part_id,
        current_quantity: item.quantity_on_hand,
        threshold: item.minimum_stock_level,
        severity: item.quantity_on_hand === 0 ? 'critical' : 'high',
        suggested_reorder_quantity: item.reorder_quantity
      });

      // Auto-notify procurement team
      await notifyProcurement({
        customer_id: customerId,
        part_name: item.part_name,
        part_number: item.part_number,
        current_stock: item.quantity_on_hand,
        shortfall: item.minimum_stock_level - item.quantity_on_hand,
        action_link: `/warehouse/parts/${item.part_id}/quick-order`
      });
    }

    // Check 2: Overstock (if purchasing more than needed)
    if (item.quantity_on_hand > item.minimum_stock_level * 3) {
      await createAlert({
        customer_id: customerId,
        alert_type: 'overstock',
        part_id: item.part_id,
        severity: 'low',
        message: `${item.part_name} is overstocked. Consider reducing reorder quantity.`
      });
    }

    // Check 3: Expiry warning (for tires, fluids)
    if (item.expiry_date && daysUntilExpiry(item.expiry_date) < 90) {
      await createAlert({
        customer_id: customerId,
        alert_type: 'expiry_warning',
        part_id: item.part_id,
        days_until_expiry: daysUntilExpiry(item.expiry_date),
        severity: 'medium'
      });
    }
  }
}

// Run every 6 hours
schedule.every('6 hours').run(() => {
  const allCustomers = getAllCustomers();
  allCustomers.forEach(customer => checkStockLevels(customer.id));
});
```

---

## 7. Dashboard Views (What Customers See)

### Procurement Manager Dashboard

```
┌─────────────────────────────────────────────────────────┐
│                    WAREHOUSE STATUS                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🚨 CRITICAL ALERTS (3)                                 │
│  ├─ Brake Pads XYZ: OUT OF STOCK (was 0 units)         │
│  │   → Quick Order from BPW [ORDER NOW]                │
│  ├─ Tires 225/75R17.5: Low (2 vs min 8)                │
│  │   → Suggest order 10 units - €2,450 [ORDER NOW]     │
│  └─ Engine Oil: Expiry in 45 days                       │
│                                                          │
│  📊 INVENTORY OVERVIEW                                  │
│  ├─ Total Parts in Stock: €45,230 value                 │
│  ├─ Parts Out of Stock: 5                               │
│  ├─ Low Stock Items: 12                                 │
│  └─ Parts Expiring Soon: 3                              │
│                                                          │
│  📦 RECENT ORDERS                                       │
│  ├─ ORD-2026-045 (BPW): Delivered 2026-06-15           │
│  │   └─ Brake Pads x8: €450 (Your cost: €405)          │
│  ├─ ORD-2026-044 (Meritor): Shipped 2026-06-14        │
│  │   └─ Suspension Parts x2: €1,200 (Your cost: €1,080)│
│  └─ ORD-2026-043 (Hendrickson): In Transit             │
│      └─ Tires x20: €8,500 (Arrives 2026-06-20)        │
│                                                          │
│  💰 COMMISSION EARNED (This Month)                     │
│  ├─ Parts Orders Total: €28,450                         │
│  └─ Your Commission (10% avg): €2,845                  │
│                                                          │
│  🏭 WAREHOUSE LOCATIONS                                 │
│  ├─ Shed A: €18,500 value (78% full)                   │
│  ├─ Shed B: €12,200 value (54% full)                   │
│  └─ Shed C: €14,530 value (89% full) ⚠️ NEARLY FULL   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Maintenance Technician View (During Repair)

```
┌─────────────────────────────────────────────────────────┐
│          VEHICLE ABC - BRAKE MAINTENANCE                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PARTS NEEDED:                                          │
│  ☑ Brake Pad Set XYZ (Qty: 4)                          │
│      Stock Available: 0 units ❌                         │
│      Alternative in stock: Brake Pad Set ABC (3) ✓      │
│      Can use: [Yes] [No]                                │
│                                                          │
│  ☑ Brake Disc (Qty: 4)                                  │
│      Stock Available: 7 units ✓                         │
│      [Reserve for this job]                             │
│                                                          │
│  ☑ Brake Fluid (1L)                                     │
│      Stock Available: 12 units ✓                        │
│      [Reserve 1 unit]                                   │
│                                                          │
│  QUICK ORDER MISSING ITEMS:                            │
│  └─ Need Brake Pad Set XYZ? [ORDER FROM BPW]          │
│     Estimated Cost: €56 | Delivery: 5 days             │
│     Note: Can't complete job until parts arrive        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Revenue Model: How You Make Money

### Commission Structure

```
Scenario 1: Customer Orders Through Your Platform
┌────────────────────────────────────────────────────┐
│ BPW List Price: €100 (100 units @ €1,000 total)   │
│ Your negotiated rate: €85/unit (€8,500 total)    │
│ Commission to you: €500 (€1,000 - €8,500 savings) │
│ OR: 10% of total sales                             │
└────────────────────────────────────────────────────┘

Scenario 2: Monthly Volume Commission (Tiered)
┌────────────────────────────────────────────────────┐
│ If sales < €5,000/month: 5% commission            │
│ If sales €5,000-€25,000: 8% commission            │
│ If sales €25,000-€100,000: 10% commission         │
│ If sales > €100,000: 12% commission               │
└────────────────────────────────────────────────────┘

Scenario 3: Volume Rebates (Win-Win)
┌────────────────────────────────────────────────────┐
│ Negotiate with BPW:                                │
│ - €500k/year sales → 15% rebate                   │
│ - Share rebate with customers (10%) + keep (5%)   │
│ - Customers get better pricing, you profit        │
└────────────────────────────────────────────────────┘
```

### Pricing Strategy Example

```
CUSTOMER SEES:
BPW Brake Pads: €56.25

YOUR SYSTEM SHOWS:
├─ Your Cost (to BPW): €56.25
├─ Your Margin: €5.63 (10%)
└─ Customer Pays: €56.25
    (Margin is transparent or hidden based on strategy)

YOUR PROFIT SOURCES:
1. Commission from BPW: 10% = €5.63 per unit
2. Optional markup: Additional 5-10% if desired
3. Volume discounts: Negotiate with BPW to give better rates as you grow
```

---

## 9. Integrating Warehouse System into Phase 1 → Phase 2

### Phase 1 (MVP): Basic Inventory
- ✅ Manual inventory input
- ✅ Low stock alerts
- ✅ BPW search/basic ordering
- ✅ Track single orders
- ⏳ Advanced features later

### Phase 1.5 (Add-on, 2-3 weeks after Phase 1 live)
- ✅ Full BPW API integration
- ✅ Automatic inventory updates
- ✅ Multi-supplier support (Meritor, Hendrickson)
- ✅ Advanced stock tracking
- ✅ Maintenance-to-Parts linking
- ✅ Analytics/commission tracking

### Phase 2 (Multi-tenancy)
- ✅ Each customer has own warehouse
- ✅ Multi-location inventory
- ✅ Per-customer supplier agreements
- ✅ Bulk order management

### Phase 3 (Advanced)
- ✅ Warehouse optimization AI
- ✅ Predictive ordering (AI suggests best time to order)
- ✅ Supplier negotiations (you broker better rates)
- ✅ Integration with fleet management (automatic deductions from inventory when parts installed)

---

## 10. Step-by-Step Implementation Timeline

### Phase 1.5A: Weeks 1-2 (BPW Integration Setup)
```
Week 1:
□ Get BPW API credentials for testing
□ Build BPW adapter class (as shown above)
□ Test search_parts, get_stock endpoints
□ Build parts_orders table & API endpoints

Week 2:
□ Build order creation flow
□ Test end-to-end order (sandbox)
□ Build order tracking
□ Set up webhook for order status updates
```

### Phase 1.5B: Weeks 3-4 (Warehouse Management)
```
Week 3:
□ Build warehouse management API endpoints
□ Build inventory dashboard component
□ Implement low stock alert logic
□ Build alert acknowledgment system

Week 4:
□ Build stock adjustment interface
□ Implement inventory history
□ Add manual count/adjustment features
□ Testing & bug fixes
```

### Phase 1.5C: Weeks 5-6 (Alerts & Notifications)
```
Week 5:
□ Build email alerts for low stock
□ Build in-app notifications
□ Alert routing (to procurement, manager, etc.)
□ Notification preferences (who gets what)

Week 6:
□ Integration testing with maintenance alerts
□ Testing with real BPW sandbox
□ Security review
□ Deploy to production
```

---

## 11. BPW Negotiation Points (For You)

When you contact BPW to set up integration:

```
1. Commission Structure
   - Ask for: 10-15% commission on all sales
   - Or: Wholesale pricing (you mark up customer)
   - Or: Hybrid (lower commission + some markup allowed)

2. API Rate Limits
   - Confirm no limits on searches
   - Confirm real-time stock status available
   - Confirm order creation via API

3. Returns & Refunds
   - How to handle customer returns
   - Can refunds go back to platform wallet?

4. Pricing Updates
   - How often prices sync
   - Who handles price disputes

5. Volume Incentives
   - Tiered commission based on volume
   - Annual rebates if you hit targets

6. Co-marketing
   - Use BPW logo on your platform
   - Get featured in their partner program
   - Joint marketing opportunities
```

---

## 12. Security & Compliance

### Payment Processing

```javascript
// IMPORTANT: Never handle card payments directly
// Use stripe/payment processor to collect payment from customer

// Customer flow:
Customer → Stripe Checkout → Payment Processor
                              ↓
                         Your Account
                              ↓
                         BPW (via API)
                              ↓
                         Parts shipped

// You never touch customer payment info
```

### Data Security for Warehouse

```
Encryption:
├─ Supplier credentials: Encrypted in Secrets Manager
├─ Order data: TLS 1.3 in transit
├─ Inventory data: Can store as-is (not sensitive)
└─ Invoice PDFs: Encrypted at rest in S3

Access Control:
├─ Only procurement team sees supplier pricing
├─ Only warehouse team can adjust inventory
├─ Audit trail for all changes
└─ Two-person approval for high-value orders (optional)
```

---

## 13. Complete Database Migration Script

```sql
-- Add warehouse tables to your existing Phase 1 database

-- 1. Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  api_type VARCHAR,  -- 'bpw', 'meritor', 'hendrickson'
  api_endpoint VARCHAR,
  commission_rate DECIMAL(5,3) DEFAULT 0.10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Warehouse Locations
CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  warehouse_name VARCHAR NOT NULL,
  location_code VARCHAR NOT NULL,
  address TEXT,
  capacity_items INT,
  current_usage INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, location_code)
);

-- 3. Spare Parts Catalog
CREATE TABLE spare_parts_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name VARCHAR NOT NULL,
  part_number VARCHAR NOT NULL,
  sku VARCHAR,
  category VARCHAR,
  vehicle_compatibility TEXT[],
  supplier_id UUID REFERENCES suppliers(id),
  supplier_part_code VARCHAR,
  unit_price DECIMAL(10,2),
  lead_time_days INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(part_number, supplier_id)
);

-- 4. Warehouse Inventory
CREATE TABLE warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  warehouse_location_id UUID REFERENCES warehouse_locations(id),
  part_id UUID REFERENCES spare_parts_catalog(id),
  quantity_on_hand INT DEFAULT 0,
  minimum_stock_level INT DEFAULT 5,
  reorder_quantity INT DEFAULT 10,
  reorder_point INT DEFAULT 3,
  expiry_date DATE,
  last_counted TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, warehouse_location_id, part_id)
);

-- 5. Warehouse Transactions (Audit Trail)
CREATE TABLE warehouse_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES warehouse_inventory(id),
  transaction_type VARCHAR,  -- 'in', 'out', 'adjustment', 'count'
  quantity INT,
  reference_id VARCHAR,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Stock Alerts
CREATE TABLE warehouse_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES warehouse_inventory(id),
  alert_type VARCHAR,  -- 'low_stock', 'out_of_stock', 'overstock', 'expiry'
  alert_status VARCHAR DEFAULT 'active',  -- 'active', 'acknowledged', 'resolved'
  severity VARCHAR,  -- 'low', 'medium', 'high', 'critical'
  current_value INT,
  threshold_value INT,
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  INDEX(customer_id, alert_status)
);

-- 7. Parts Orders
CREATE TABLE parts_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_order_id VARCHAR,
  order_status VARCHAR DEFAULT 'draft',  -- 'draft','submitted','confirmed','shipped','delivered','cancelled'
  order_date TIMESTAMP DEFAULT NOW(),
  expected_delivery DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(12,2),
  supplier_amount DECIMAL(12,2),
  platform_commission DECIMAL(12,2),
  payment_status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX(customer_id, order_status)
);

-- 8. Parts Order Items
CREATE TABLE parts_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parts_order_id UUID REFERENCES parts_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts_catalog(id),
  quantity INT,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(12,2),
  warehouse_location_id UUID REFERENCES warehouse_locations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Parts Order Tracking
CREATE TABLE parts_order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parts_order_id UUID REFERENCES parts_orders(id) ON DELETE CASCADE,
  tracking_status VARCHAR,
  tracking_number VARCHAR,
  carrier VARCHAR,
  event_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Maintenance-to-Parts Link
CREATE TABLE maintenance_parts_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR,
  recommended_part_id UUID REFERENCES spare_parts_catalog(id),
  urgency VARCHAR,
  estimated_need_date DATE,
  quantity_needed INT,
  estimated_cost DECIMAL(10,2),
  order_created BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES parts_orders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_warehouse_inventory_customer ON warehouse_inventory(customer_id);
CREATE INDEX idx_warehouse_alerts_active ON warehouse_stock_alerts(customer_id, alert_status);
CREATE INDEX idx_parts_orders_customer_status ON parts_orders(customer_id, order_status);
```

---

## 14. Implementation Checklist for Phase 1.5

### Backend
- [ ] BPW adapter class (search, stock, order, track)
- [ ] Meritor adapter class (future)
- [ ] Hendrickson adapter class (future)
- [ ] All warehouse API endpoints
- [ ] Stock level checking logic
- [ ] Alert generation system
- [ ] Order creation & tracking system
- [ ] Webhook receiver for BPW order updates
- [ ] Commission tracking
- [ ] Inventory transaction logging

### Frontend
- [ ] Warehouse dashboard component
- [ ] Stock alert viewer
- [ ] Low stock notification banner
- [ ] Quick order modal/page
- [ ] Order search & filtering
- [ ] Order tracking view
- [ ] Inventory management interface
- [ ] Stock adjustment form

### Database
- [ ] All tables as shown above
- [ ] Indexes for performance
- [ ] Migration scripts
- [ ] Seed data (sample suppliers, parts)

### Integration
- [ ] BPW API testing (sandbox)
- [ ] Order creation end-to-end test
- [ ] Order tracking webhooks
- [ ] Alert notifications (email/in-app)

### Security
- [ ] Encrypt supplier credentials
- [ ] Rate limiting on order endpoints
- [ ] Payment processing via Stripe/Adyen
- [ ] Audit logging for all inventory changes
- [ ] Two-person approval for high-value orders (optional)

---

## 15. Sample Monthly Revenue Projection

```
Scenario: 10 customers with average 5 fleets each (50 total vehicles)

Average spend per customer per month: €3,000 (parts ordering)
Your commission: 10% average

Monthly Revenue Calculation:
├─ 10 customers × €3,000 = €30,000 total parts orders
├─ Your commission @ 10% = €3,000/month
└─ Annual additional revenue = €36,000

Scenario: 50 customers by end of Year 2
├─ 50 customers × €4,000 = €200,000 total parts orders
├─ Your commission @ 10% = €20,000/month
└─ Annual revenue from parts = €240,000

This is PASSIVE revenue - you don't manage the parts, just take commission!
```

---

## Next Steps

1. **Contact BPW** about API integration
   - Request: API credentials, documentation, pricing terms
   - Discuss: Commission structure, volume targets

2. **Start Phase 1** as planned

3. **Week after Phase 1 goes live:** Begin Phase 1.5 development
   - First implement BPW adapter
   - Then inventory management
   - Then alerts & notifications
   - Deploy in 4-6 weeks

4. **Launch Phase 1.5** to first customer
   - Collect feedback
   - Optimize ordering flow
   - Add more suppliers

---

**This warehouse integration is a game-changer because:**
- ✅ Improves customer retention (sticky product)
- ✅ Creates recurring revenue (parts commissions)
- ✅ Differentiates from competitors
- ✅ Reduces vehicle downtime (parts always available)
- ✅ Complements predictive maintenance perfectly
- ✅ Minimal additional development cost (leverages existing systems)
- ✅ Scales without marginal cost (API-driven)

Ready to build this into Phase 1.5? I can add the warehouse schema, API endpoints, and BPW adapter to your codebase right after Phase 1 goes live!
