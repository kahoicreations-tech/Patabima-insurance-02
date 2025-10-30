---
mode: agent
title: "Motor Insurance Implementation Quick Start"
type: "execution_guide"
priority: "immediate"
---

# Motor Insurance Implementation - Quick Start Guide

## 🚀 Ready to Execute - Follow These Prompts in Order

### **Step 1: Backend Foundation (Start Here)**
```bash
# Use this prompt first
📁 01-database-setup.prompt.md
```
**What it does**: Sets up PostgreSQL database with all 60+ motor insurance products, mandatory levies, and pricing tables.
**Time**: 3-4 days
**Start immediately**: No dependencies

---

### **Step 2: API Development** 
```bash
# Use this prompt after database is complete
📁 02-api-endpoints.prompt.md  
```
**What it does**: Creates universal pricing calculation APIs, underwriter comparison, and quote management endpoints.
**Time**: 4-5 days
**Dependency**: Database must be complete

---

### **Step 3: Frontend Services** 
```bash
# Use this prompt when APIs are ready
📁 03-frontend-services.prompt.md
```
**What it does**: Creates React Native services, context, and real-time calculation hooks.
**Time**: 3-4 days  
**Dependency**: API endpoints functional

---

### **Step 4: UI Components**
```bash
# Use this prompt after frontend services
📁 04-ui-components.prompt.md
```
**What it does**: Builds all motor insurance UI components with dynamic forms and real-time pricing.
**Time**: 5-6 days
**Dependency**: Frontend services complete

---

### **Step 5: Navigation Integration**
```bash
# Use this prompt after UI components  
📁 05-navigation-integration.prompt.md
```
**What it does**: Integrates components into app navigation with complete screen flow.
**Time**: 3-4 days
**Dependency**: UI components ready

---

### **Step 6: Payment & Policy Integration**
```bash
# Use this prompt for final integration
📁 06-payment-policy-integration.prompt.md
```
**What it does**: Adds M-PESA/DPO Pay integration, automated policy generation, and AWS document management.
**Time**: 4-5 days
**Dependency**: Complete frontend flow

---

## 📋 **How to Use These Prompts**

### For Each Prompt:
1. **Open the prompt file** 
2. **Copy the entire content** into your AI assistant
3. **Follow the detailed requirements** and success criteria
4. **Complete all deliverables** before moving to next prompt
5. **Verify integration points** work correctly

### AI Assistant Instructions:
```
When using these prompts, please:
- Follow the exact requirements and specifications
- Implement all success criteria before marking complete
- Use the PataBima project structure and conventions
- Test integration points between phases
- Maintain code quality and documentation standards
```

## 🎯 **Critical Success Factors**

### Must Implement:
- ✅ **All 60+ motor insurance products** with correct categorization
- ✅ **Mandatory levies** (ITL 0.25%, PCF 0.25%, Stamp Duty KSh 40) on ALL products
- ✅ **Commercial tonnage pricing** for all 8 weight brackets
- ✅ **PSV PLL options** (KSh 500 and KSh 250 per person)
- ✅ **Real-time premium calculations** with <500ms response time
- ✅ **Multi-underwriter comparison** functionality
- ✅ **Complete quote-to-policy workflow**

### Quality Standards:
- 🏆 React Native best practices
- 🏆 Django REST API conventions
- 🏆 TypeScript type safety
- 🏆 Comprehensive error handling
- 🏆 Mobile-first responsive design
- 🏆 Performance optimization

## 📈 **Progress Tracking**

### Week 1: Backend Foundation
- [ ] Database schema complete with all tables
- [ ] Sample data loaded for all categories  
- [ ] Pricing engine functional
- [ ] Core API endpoints working

### Week 2: Frontend Core
- [ ] Frontend services implemented
- [ ] Context and state management working
- [ ] Real-time calculations functional

### Week 3: User Interface  
- [ ] All UI components built
- [ ] Dynamic forms working for all product types
- [ ] Navigation flow complete

### Week 4: Integration
- [ ] Payment processing functional
- [ ] Policy generation working
- [ ] Complete end-to-end workflow

## 🔥 **Start Now!**

**Begin with `01-database-setup.prompt.md` immediately.**

This comprehensive prompt system will guide you through building a production-ready motor insurance system that handles:
- 60+ insurance products across 6 categories
- Dynamic pricing with real-time calculations  
- Mandatory regulatory compliance
- Complete mobile app experience
- Payment processing and policy generation

Each prompt is self-contained with detailed requirements, success criteria, and integration points. Follow them sequentially for best results!