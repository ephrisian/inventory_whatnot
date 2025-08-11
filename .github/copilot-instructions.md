# Copilot Instructions for Collector Sales & Inventory Management Tool

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive collector sales and inventory management system built with Next.js, TypeScript, and SQLite. The system is designed for local-first operation with future cloud integration capabilities.

## Key Architecture Guidelines

### Technology Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM (local-first, can migrate to PostgreSQL)
- **File Storage**: Local filesystem for images
- **Styling**: Tailwind CSS with shadcn/ui components

### Core Modules
1. **Inventory Manager**: Track items with cost, quantity, images, categories, and status
2. **Sales Tracker**: Record sales with platform fees, shipping, materials costs
3. **Vendor Orders**: Manage restocks and vendor relationships
4. **Pack Builder**: Build packs from boxes with cost calculations
5. **Customer Interest**: Track customer requests and follow-ups
6. **eBay Scanner**: Browse seller inventories with filtering
7. **Admin Portal**: Manage API keys and external integrations

### Database Schema Guidelines
- Use Prisma schema with proper relationships
- Include audit fields (createdAt, updatedAt) on all models
- Use enums for status fields and categories
- Implement soft deletes where appropriate

### API Design
- RESTful API routes under `/api/`
- Consistent error handling and validation
- Use middleware for authentication where needed
- Return standardized response formats

### UI/UX Guidelines
- Clean, responsive design using Tailwind CSS
- Use shadcn/ui components for consistency
- Implement proper loading states and error handling
- Mobile-friendly responsive layouts
- Dark/light mode support

### Code Quality
- Use TypeScript strictly with proper typing
- Implement proper error boundaries
- Use React Server Components where appropriate
- Follow Next.js best practices for performance
- Include proper JSDoc comments for complex functions

### Security Considerations
- Validate all inputs on both client and server
- Implement proper file upload security
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints

### Future Integration Readiness
- Design APIs to be easily extended for TCGPlayer, eBay, Whatnot integrations
- Use configuration-driven approach for platform-specific logic
- Implement webhook handling patterns
- Design for horizontal scaling

### Export/Import Features
- CSV import/export functionality
- Image URL handling for external platforms
- Bulk operations support
- Data validation on imports

When generating code, prioritize:
1. Type safety and proper TypeScript usage
2. Performance and optimal database queries
3. User experience and intuitive interfaces
4. Scalability and maintainability
5. Local-first operation with cloud readiness
