# Phase 1 Build Strategy & Deliverables

**Timeline:** 3-4 weeks of development  
**Scope:** MVP for 1-5 customers  
**Platform:** AWS or GCP (you'll decide after reviewing comparison doc)  
**Cost:** $400-1,500/month depending on platform choice

---

## Phase 1 Scope: What You'll Have

### ✅ Working Features (Phase 1 MVP)

#### For Transport Managers
- **Fleet Dashboard**
  - Real-time vehicle locations (map view)
  - Vehicle status (online/offline/idle)
  - Driver assignments
  - Trip history

- **Telematics Data**
  - Speed monitoring (with speeding alerts)
  - Fuel consumption tracking
  - Idle time reporting
  - Harsh braking/acceleration detection
  - Integration with 3 telematics providers (Sennder, TomTom, Geotab)

- **Tachograph Monitoring**
  - Driver hours display
  - Working time vs rest time
  - Infringement alerts (exceeding limits)
  - Driving pattern analysis

- **Training & Compliance**
  - CPC course bookings
  - Course completion tracking
  - Certificate storage
  - Renewal reminders

- **Driver Management**
  - License status (UK DVLA integration ready)
  - Points tracking
  - Fitness to drive checks
  - Driver contact info

#### For You (Internal Analytics)
- **Cross-customer insights**
  - Fleet performance metrics
  - Predictive maintenance base layer (ready for Phase 3)
  - Customer usage analytics

### ⚠️ NOT Included in Phase 1
- ❌ Multi-tenancy (single customer at a time for now)
- ❌ Predictive maintenance AI models (Phase 3)
- ❌ Mobile app (Phase 2)
- ❌ Advanced reporting (Phase 2)
- ❌ Custom integrations (Phase 2)

---

## Technology Stack (Finalized)

```
Frontend:
├── React 18.x + TypeScript
├── Tailwind CSS (styling)
├── React Query (data fetching)
├── Mapbox GL (maps)
├── Chart.js (dashboards)
└── Axios (API calls)

Backend:
├── Node.js 18.x
├── Express.js (API framework)
├── PostgreSQL 14+
├── Redis (caching)
├── JWT (authentication)
├── Bcrypt (password hashing)
├── Nodemailer (email alerts)
└── Socket.io (real-time updates)

Telematics Integrations:
├── Sennder API client
├── TomTom API client
├── Geotab API client
└── Data normalization layer

DevOps:
├── Docker (containerization)
├── Docker Compose (local development)
├── GitHub Actions (CI/CD)
└── AWS/GCP deployment templates

Security:
├── Helmet (HTTP headers)
├── CORS (cross-origin)
├── Rate limiting (express-rate-limit)
├── Input validation (joi)
├── Secrets management (dotenv)
└── SQL injection prevention (parameterized queries)
```

---

## Project Structure (What You'll Get)

```
fleet-telematics-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/          # Database, env, constants
│   │   ├── controllers/      # API endpoint logic
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Database schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   │   ├── telematics/   # Sennder, TomTom, Geotab adapters
│   │   │   ├── tachograph/   # Tachograph processing
│   │   │   ├── driver/       # Driver management
│   │   │   └── compliance/   # Compliance checking
│   │   ├── utils/            # Helpers, validators
│   │   └── index.js          # Entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API calls
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # State management
│   │   ├── styles/           # Tailwind config
│   │   └── App.jsx           # Root component
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── migrations/           # SQL migration files
│   ├── seeds/                # Test data
│   └── schema.sql            # Full schema
│
├── docker-compose.yml        # Local dev environment
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── SETUP_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY_GUIDE.md
│   └── TELEMATICS_INTEGRATION.md
│
└── README.md
```

---

## Detailed API Endpoints (Phase 1)

### Authentication
```
POST   /api/auth/register          # Create new user
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh-token     # Refresh JWT
POST   /api/auth/2fa/setup         # Enable 2FA
```

### Fleet Management
```
GET    /api/vehicles               # List all vehicles
GET    /api/vehicles/:id           # Vehicle details
POST   /api/vehicles               # Create vehicle
PUT    /api/vehicles/:id           # Update vehicle
DELETE /api/vehicles/:id           # Delete vehicle

GET    /api/vehicles/:id/location  # Real-time location
GET    /api/vehicles/:id/status    # Vehicle status
GET    /api/vehicles/:id/trips     # Trip history
```

### Telematics
```
GET    /api/telematics/vehicles/:id/current     # Live data
GET    /api/telematics/vehicles/:id/history     # Historical data
GET    /api/telematics/vehicles/:id/metrics     # Speed, fuel, etc
GET    /api/telematics/alerts                   # Active alerts
POST   /api/telematics/alerts/:id/acknowledge   # Mark alert as read
```

### Tachograph
```
GET    /api/tachograph/drivers/:id/hours        # Current working hours
GET    /api/tachograph/drivers/:id/logs         # Tachograph logs
GET    /api/tachograph/infringements            # HVAC violations
GET    /api/tachograph/compliance               # Compliance status
```

### Driver Management
```
GET    /api/drivers                # List drivers
GET    /api/drivers/:id            # Driver details
POST   /api/drivers                # Create driver
PUT    /api/drivers/:id            # Update driver
GET    /api/drivers/:id/license    # License info
GET    /api/drivers/:id/cpc        # CPC training record
```

### Training & CPC
```
GET    /api/cpc/courses            # Available courses
POST   /api/cpc/bookings           # Book course
GET    /api/cpc/bookings           # My bookings
POST   /api/cpc/bookings/:id/complete  # Mark complete
GET    /api/certificates           # My certificates
```

### Analytics (Internal)
```
GET    /api/analytics/fleet        # Fleet overview
GET    /api/analytics/drivers      # Driver performance
GET    /api/analytics/compliance   # Compliance metrics
GET    /api/analytics/maintenance  # Maintenance alerts
```

---

## Database Schema (Core Tables)

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role ENUM('admin', 'manager', 'driver', 'analyst'),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  registration_number VARCHAR UNIQUE NOT NULL,
  make VARCHAR,
  model VARCHAR,
  year INT,
  vin VARCHAR UNIQUE,
  telematics_provider ENUM('sennder', 'tomtom', 'geotab'),
  telematics_id VARCHAR,  -- ID from provider
  status ENUM('active', 'inactive', 'maintenance'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time Telematics
CREATE TABLE telematics_data (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  timestamp TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed INT,
  fuel_consumption DECIMAL,
  engine_rpm INT,
  temperature DECIMAL,
  idle_time INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tachograph Records
CREATE TABLE tachograph_records (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  date DATE,
  driving_time INT,  -- minutes
  working_time INT,
  rest_time INT,
  total_time INT,
  violations TEXT[],  -- Array of infringement codes
  created_at TIMESTAMP
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  license_number VARCHAR UNIQUE,
  dvla_check_date DATE,
  fitness_to_drive BOOLEAN DEFAULT TRUE,
  points_on_license INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training & CPC
CREATE TABLE cpc_courses (
  id UUID PRIMARY KEY,
  course_name VARCHAR,
  provider VARCHAR,
  duration_hours INT,
  cost DECIMAL,
  available_dates DATE[],
  created_at TIMESTAMP
);

CREATE TABLE cpc_bookings (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  course_id UUID REFERENCES cpc_courses(id),
  booking_date DATE,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled'),
  certificate_url VARCHAR,
  completed_date DATE,
  created_at TIMESTAMP
);

-- Alerts & Incidents
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  alert_type VARCHAR,  -- 'speeding', 'harsh_brake', 'tachograph_violation'
  severity ENUM('low', 'medium', 'high', 'critical'),
  message TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Implementation (Phase 1)

### Authentication
```javascript
// JWT token with 24-hour expiry
const token = jwt.sign(
  { 
    userId: user.id, 
    role: user.role 
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 2FA setup
app.post('/api/auth/2fa/setup', (req, res) => {
  // Generate 2FA secret using speakeasy
  // Display QR code
  // User scans with authenticator app
  // Verify 6-digit code on next login
});
```

### Data Encryption
```javascript
// Encrypt sensitive data before storing
const crypto = require('crypto');
const encryptionKey = process.env.ENCRYPTION_KEY;

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Store encrypted license numbers, DPA contact info, etc.
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Input Validation
```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  driverName: Joi.string().alphanum().required()
});

app.post('/api/drivers', (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error });
  // Process validated data
});
```

### HTTPS/TLS
```
- All traffic encrypted with TLS 1.3
- Auto-renewing SSL certificates (Let's Encrypt)
- HSTS headers (force HTTPS)
- No mixed content
```

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Deployment Architecture (Phase 1)

### AWS Architecture
```
                    ┌─────────────────┐
                    │   CloudFront    │ (CDN)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ALB (Load      │
                    │  Balancer)      │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼────┐      ┌─────▼────┐      ┌─────▼────┐
    │ EC2 #1   │      │ EC2 #2   │      │ EC2 #3   │
    │(Backend) │      │(Backend) │      │(Backend) │
    └─────┬────┘      └─────┬────┘      └─────┬────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  RDS PostgreSQL │
                    │  (Multi-AZ)     │
                    └─────────────────┘

External Services:
├── Sennder/Verizon API  → Pull telematics data
├── TomTom API           → Pull telematics data
├── Geotab API           → Pull telematics data
└── DVLA API (when ready)
```

### GCP Architecture
```
                    ┌─────────────────┐
                    │   Cloud CDN     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloud Load     │
                    │  Balancer       │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────────────────────────────────┐
    │   Cloud Run                            │
    │   (Auto-scaling containers)            │
    │   Min: 1 | Max: 10 instances          │
    └─────┬──────────────────────────────────┘
          │
    ┌─────▼────────────┐
    │  Cloud SQL       │
    │  PostgreSQL      │
    └──────────────────┘
```

---

## What I'll Deliver (Complete Checklist)

### Code
- [ ] Complete backend (Node.js + Express)
  - Authentication system
  - All API endpoints
  - Database models
  - Telematics integrations (3 providers)
  - Tachograph processor
  - Alert system
  - Email notifications

- [ ] Complete frontend (React)
  - Login page
  - Dashboard
  - Vehicles list & details
  - Real-time map
  - Telematics charts
  - Tachograph view
  - Driver management
  - CPC booking system
  - Alerts & notifications

- [ ] Database
  - PostgreSQL schema (all tables)
  - Migration scripts
  - Sample data seeding
  - Backup scripts

- [ ] DevOps
  - Dockerfile for backend & frontend
  - docker-compose.yml for local dev
  - GitHub Actions CI/CD pipeline
  - AWS CloudFormation templates (or GCP Terraform)
  - Environment configuration templates

- [ ] Security
  - JWT authentication implementation
  - Password hashing (bcrypt)
  - 2FA setup (TOTP)
  - Encryption (AES-256)
  - Rate limiting
  - Input validation
  - CORS/CSRF protection
  - Secrets management

### Documentation
- [ ] **README.md** - Project overview, how to clone & run
- [ ] **SETUP_GUIDE.md** - Local development setup (5-10 min)
- [ ] **API_DOCUMENTATION.md** - All endpoints with examples
- [ ] **DATABASE_SCHEMA.md** - Schema diagram, table descriptions
- [ ] **DEPLOYMENT_GUIDE.md** - Step-by-step AWS/GCP deployment
- [ ] **SECURITY_GUIDE.md** - Security measures implemented + hardening
- [ ] **TELEMATICS_INTEGRATION.md** - How to add new providers
- [ ] **TROUBLESHOOTING.md** - Common issues & fixes
- [ ] **ARCHITECTURE.md** - System design diagrams

### Testing
- [ ] Unit tests (critical functions)
- [ ] Integration tests (API endpoints)
- [ ] Security tests (SQL injection, XSS, etc)
- [ ] Load testing template
- [ ] Test data seeding

---

## Step-by-Step Deployment (Phase 1)

### Week 1: Setup & Learning
```
Day 1: Review this document + hosting comparison
Day 2-3: Create AWS/GCP account, explore console
Day 4-5: Download code, run locally with Docker Compose
Day 5-7: Understand the architecture, ask questions
```

### Week 2: First Deployment
```
Day 8-9: Set up cloud databases (RDS/Cloud SQL)
Day 10-11: Configure networking (VPC, security groups)
Day 12-13: Deploy backend container
Day 14: Deploy frontend, test end-to-end
```

### Week 3: Security Hardening
```
Day 15-16: SSL/TLS certificates, HTTPS setup
Day 17: Security testing (penetration checklist)
Day 18: Set up monitoring & alerting
Day 19: Create backup & recovery procedures
Day 20: Load testing
Day 21: Go live!
```

### Week 4+: Operations
```
Monitor logs, fix bugs, integrate with customer's telematics provider
Start collecting data for Phase 2 (multi-tenancy)
```

---

## Security Testing Checklist (Phase 1)

Before going live, we'll test:

```
Authentication:
  ✓ Can't login with wrong password
  ✓ JWT tokens expire properly
  ✓ Can't access other users' data
  ✓ 2FA blocks without correct code
  ✓ Password reset works securely

Data Protection:
  ✓ Sensitive data encrypted in database
  ✓ HTTPS enforced (no plain HTTP)
  ✓ Logs don't contain passwords/keys
  ✓ Database backups are encrypted
  ✓ API keys rotated regularly

API Security:
  ✓ Rate limiting works
  ✓ SQL injection attempts blocked
  ✓ XSS payloads filtered
  ✓ CORS only allows authorized origins
  ✓ CSRF tokens validated

Infrastructure:
  ✓ Firewall rules correct
  ✓ Database not publicly accessible
  ✓ Only necessary ports open
  ✓ Secrets stored in Secrets Manager
  ✓ No hardcoded credentials
```

---

## Telematics Provider Integration Details

### Sennder/Verizon Connect
```
API Endpoint: https://api.verizonconnect.com/...
Authentication: OAuth 2.0 or API Key
Data Types: Real-time GPS, speed, fuel, harsh events
Rate Limit: 100 requests/minute
Pull Frequency: Every 30 seconds (real-time)
Cost: Varies by vehicle

Data Normalized:
{
  vehicle_id: "...",
  timestamp: "2026-06-16T10:30:00Z",
  latitude: 51.5074,
  longitude: -0.1278,
  speed: 45,
  heading: 180,
  fuel_level: 65,
  harsh_braking: true,
  harsh_acceleration: false
}
```

### TomTom Telematics
```
API Endpoint: https://telemetry.tomtom.com/...
Authentication: API Key
Data Types: Position, speed, fuel consumption
Rate Limit: Depends on plan
Pull Frequency: Every 60 seconds
Cost: Per request or subscription

Data Normalized: (Same schema as above)
```

### Geotab
```
API Endpoint: https://my.geotab.com/api/v1/Get
Authentication: Username/Password or API Token
Data Types: Position, speed, sensors, diagnostics
Rate Limit: 10 requests/second
Pull Frequency: Every 30 seconds
Cost: Included with Geotab subscription

Data Normalized: (Same schema as above)
```

---

## Phase 1 → Phase 2 Migration Path

Phase 1 is designed so Phase 2 (multi-tenancy) is easy:

```
Phase 1 Code:
├── backend/src/models/Vehicle.js
│   └── findAll() → SELECT * FROM vehicles
│
Phase 2 Code (minimal changes):
├── backend/src/models/Vehicle.js
│   └── findAll(tenantId) → SELECT * FROM vehicles WHERE tenant_id = $1
│
Database:
├── Phase 1: Just add tenant_id column
├── Phase 2: Enable row-level security policies
└── No schema rewrite needed!
```

---

## FAQ Before We Start

**Q: Can I use this for multiple customers immediately?**  
A: Phase 1 is single-tenant. Multi-tenancy comes in Phase 2 (3-4 weeks later). But code is written so transition is seamless.

**Q: What if I need a feature Phase 1 doesn't have?**  
A: That's fine - we can add it before Phase 2. This timeline is flexible.

**Q: Can I customize the dashboard?**  
A: Absolutely. Code is fully commented. You can modify any UI/functionality.

**Q: What if a telematics provider changes their API?**  
A: Adapters are isolated. Updating one provider doesn't touch others.

**Q: Will my data be secure?**  
A: Yes. We implement enterprise-grade security (encryption, authentication, monitoring).

**Q: Can I run this on my own servers instead?**  
A: Technically yes, but cloud hosting (AWS/GCP) is recommended for uptime, scaling, and cost.

**Q: How much will it cost me to run?**  
A: $400-1,500/month for MVP (1-5 customers). Scales to $1,200-3,000/month for 50 customers.

**Q: Can I see an example of the code before you build?**  
A: Yes - I can show you a sample API endpoint or React component now if you want.

---

## What Happens Next

1. **You review:**
   - Hosting comparison doc (30 min read)
   - This Phase 1 strategy (20 min read)
   - Pricing calculators (optional, 15 min)

2. **You decide:**
   - AWS or GCP? (I can recommend)
   - Timeline: Start this week or next week?
   - Any Phase 1 features you want to add/remove?

3. **I start building:**
   - Create GitHub repo with boilerplate
   - Share code structure for your feedback
   - Build backend APIs
   - Build frontend dashboards
   - Set up CI/CD pipeline
   - Create deployment guides
   - Test everything locally
   - Deploy to your chosen platform
   - Security hardening
   - You test with real data

4. **You go live:**
   - Onboard first customer
   - Collect feedback
   - Start Phase 2 planning

---

**Ready?** Let me know:
1. Which platform (AWS or GCP)?
2. Any questions about Phase 1?
3. When to start building?

I can start as soon as you give me the green light! 🚀
