# Motor 2 Flow Logic Summary

This document outlines the logic behind the Motor Insurance (Motor 2) flow in the PataBima application, covering all categories and the dynamic pricing engine.

## 1. Core Architecture

The Motor 2 flow is a **state-driven, multi-step process** managed by the `MotorInsuranceContext`. It uses a **Service-Oriented Architecture** where the frontend handles UI/UX and the backend (Django) handles complex pricing logic and integrations.

- **State Management:** `MotorInsuranceContext` (Reducers for complex state updates).
- **API Layer:** `DjangoAPIService` (Centralized singleton).
- **Caching:** Two-tier (Memory + AsyncStorage) for categories, pricing, and underwriters.

## 2. Product Categories & Pricing Models

The system supports 60+ products across 6 main categories. The pricing model determines the form fields and calculation logic.

| Category       | Examples             | Pricing Model                            | Key Inputs                |
| :------------- | :------------------- | :--------------------------------------- | :------------------------ |
| **Private**    | Private Car          | **Fixed** (TP/TOR) or **Bracket** (Comp) | Registration, Sum Insured |
| **Commercial** | Trucks, Pickups      | **Tonnage Scale**                        | Tonnage, Class of Use     |
| **PSV**        | Matatus, Buses       | **Capacity Based**                       | Passenger Capacity (PLL)  |
| **Motorcycle** | Boda Boda, Private   | **Engine Capacity**                      | CC, Usage                 |
| **TukTuk**     | Private/Public       | **Fixed/Capacity**                       | Usage type                |
| **Special**    | Ambulances, Tractors | **Fixed/Custom**                         | Vehicle Type              |

## 3. Step-by-Step Flow Logic

### Step 1: Category & Subcategory Selection

- **Logic:** User selects a main category (e.g., Private). System fetches subcategories (e.g., Third Party, Comprehensive) from the backend/cache.
- **Outcome:** Sets the `pricing_model` and `coverage_type` in the context, which dictates the subsequent form fields.

### Step 2: Vehicle Details (Dynamic Form)

- **Logic:** The form renders fields dynamically based on the selected product.
  - _Third Party/TOR:_ Minimal fields (Registration, Start Date).
  - _Comprehensive:_ Extended fields (Sum Insured, Year of Make, Make/Model).
  - _Commercial/PSV:_ Specific fields (Tonnage, Passenger Capacity).
- **Validation:** Real-time validation (e.g., Kenyan number plate format, Sum Insured ranges).

### Step 3: Real-time Pricing & Comparison

- **Trigger:** Occurs automatically when valid data is entered (debounced).
- **Backend Logic:**
  1.  Receives vehicle data.
  2.  Queries `UnderwriterProduct` and `PricingTable`.
  3.  Calculates `base_premium` based on the model (Fixed, Bracket, Tonnage).
  4.  Returns a list of underwriters with their base premiums.
- **Frontend Logic:**
  1.  Receives `base_premium`.
  2.  **Applies Mandatory Levies:**
      - ITL (0.25%)
      - PCF (0.25%)
      - Stamp Duty (KSh 40 fixed)
  3.  Calculates `total_premium`.
  4.  Sorts underwriters by price (lowest first).

### Step 4: Underwriter Selection

- **Logic:** User selects a specific underwriter from the comparison list.
- **State Update:** The full underwriter object (including specific pricing breakdown) is saved to the context.

### Step 5: KYC & Documents

- **Logic:**
  - **KYC:** ID/Passport upload. Uses AWS Textract for OCR to auto-fill client details.
  - **Documents:** Logbook/Receipt upload.
  - **DMVIC Integration:** (If enabled) Verifies vehicle details against the industry database.

### Step 6: Client Details & Payment

- **Logic:** User confirms personal details (auto-filled from KYC where possible).
- **Payment:** Initiates M-PESA STK Push or other payment methods via the backend.
- **Policy Generation:** Upon successful payment, the quote is converted to a policy, and a PDF is generated.

## 4. Key Technical Features

- **Debounced Calculations:** Prevents API spamming during typing (400ms delay).
- **Form Data Isolation:** Switching subcategories (e.g., TP to Comp) preserves data in isolated state pockets to prevent conflicts.
- **Offline Resilience:** Categories and Underwriter lists are cached to allow the flow to start even with poor connectivity.
