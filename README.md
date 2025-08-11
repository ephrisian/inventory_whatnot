# 🧾 Collector Sales & Inventory Management Tool

A comprehensive local-first inventory management system designed specifically for collectors and resellers. Built with Next.js, TypeScript, and SQLite for professional inventory tracking, sales management, and business analytics.

## ✨ Features

### 📦 Core Modules

- **Inventory Manager**: Track items with cost, quantity, images, categories, and status
- **Sales Tracker**: Record sales with platform fees, shipping, and materials costs
- **Vendor Orders**: Manage restocks and vendor relationships  
- **Pack Builder**: Build packs from boxes with automated cost calculations
- **Customer Interest**: Track customer requests and follow-ups
- **eBay Scanner**: Browse seller inventories with filtering capabilities
- **Admin Portal**: Manage API keys and external integrations

### 🎯 Key Capabilities

- **Profit Calculations**: Automated break-even and net profit calculations
- **Multi-Platform Support**: Whatnot, eBay, PayPal integration ready
- **Export/Import**: CSV functionality for external platforms
- **Real-time Alerts**: Low stock notifications and customer interest tracking
- **Professional Dashboard**: Business analytics and quick actions
- **Local-First**: SQLite database for complete local control

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with RESTful design
- **Database**: SQLite with Prisma ORM (easily upgradeable to PostgreSQL)
- **UI Components**: Custom components with Radix UI primitives
- **File Storage**: Local filesystem with cloud upgrade path
- **Type Safety**: Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**:
```bash
cd inventory_whatnot
npm install
```

2. **Setup database**:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. **Start development server**:
```bash
npm run dev
```

4. **Open application**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Usage Guide

### Getting Started

1. **Dashboard**: View business overview and quick stats
2. **Add Inventory**: Start by adding items through the Inventory page
3. **Record Sales**: Track sales with automatic profit calculations
4. **Configure APIs**: Use the Admin portal to setup external integrations

### Core Workflows

#### Adding Inventory Items
- Navigate to Inventory → Add Item
- Fill in item details (name, cost, quantity, category)
- System auto-generates SKU if not provided
- Upload images for external platform exports

#### Recording Sales
- Go to Sales → New Sale
- Select item, platform, and sale details
- System calculates fees and net profit automatically
- Updates inventory quantities

#### Building Packs
- Create boxes with cost and pack count
- Build individual packs with materials/shipping costs
- Auto-calculated suggested pricing (cost ÷ 0.88 rounded up)
- Export pack pricing for Whatnot

#### Vendor Management
- Add vendors and track orders
- Set order status (Ordered → In Transit → Arrived)
- Auto-increment inventory when orders arrive

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# API Keys (configure in Admin panel)
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
TCGPLAYER_API_KEY=your_tcgplayer_key
WHATNOT_API_KEY=your_whatnot_key

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
```

### API Configuration

Use the Admin portal to configure:
- **eBay API**: For seller inventory scanning
- **TCGPlayer API**: For trading card pricing
- **Whatnot API**: For inventory export and sales sync

## 📊 Database Schema

The system uses a comprehensive database schema with the following key models:

- **Items**: Core inventory with categories, fandoms, and status tracking
- **Sales**: Complete sales records with profit calculations
- **Vendors & Orders**: Supplier management and restock tracking
- **Boxes & Packs**: Pack building and cost management
- **Customer Interest**: Request tracking and follow-up management
- **eBay Scanner**: Seller inventory analysis and filtering

## 🌐 API Endpoints

### Inventory
- `GET /api/inventory` - List items with pagination and filtering
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Remove item

### Sales
- `GET /api/sales` - List sales with analytics
- `POST /api/sales` - Record new sale

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics and alerts

### Admin
- `GET /api/admin/config` - Get API configurations
- `POST /api/admin/config` - Update API settings

## 🔮 Future Enhancements

### Planned Integrations
- **TCGPlayer API**: Real-time pricing for trading cards
- **eBay API**: Direct listing management and sales sync  
- **Whatnot Webhooks**: Auto-decrement stock on sales
- **Discord Webhooks**: Customer interest notifications

### Advanced Features
- **Multi-location Inventory**: Track items across storage locations
- **Barcode Scanning**: Mobile app for quick inventory updates
- **Advanced Analytics**: Profit trends, category performance
- **Team Management**: Multi-user access with role permissions

## 📈 Business Benefits

- **Profit Optimization**: Accurate break-even and pricing calculations
- **Inventory Control**: Real-time stock levels and automated alerts
- **Customer Service**: Track interest and follow up on requests
- **Vendor Relations**: Streamlined restock and order management
- **Platform Ready**: Export-ready for Whatnot, eBay, and other platforms
- **Local Control**: Complete data ownership and offline capability

## 🛡️ Security & Privacy

- **Local-First**: All data stored locally by default
- **API Security**: Environment-based API key management
- **Input Validation**: Comprehensive validation using Zod
- **Error Handling**: Graceful error handling and user feedback

## 📄 License

This project is private and proprietary. All rights reserved.

## 🤝 Support

For technical support or feature requests, please contact the development team.

---

**Built for collectors, by collectors** 🎮🃏🎨
