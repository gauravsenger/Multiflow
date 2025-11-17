# PayU UAT Payment Integration Hub - React Version

This is a React application with routing for the PayU Payment Integration Hub. Each payment flow has its own route.

## Routes

- `/` - Landing page with flow selection
- `/crossborder` - Cross Border Payment flow
- `/nonseamless` - Non-Seamless Checkout (PreBuilt) flow
- `/subscription` - Non-Seamless Subscription (Recurring) flow
- `/tpv` - TPV Payment (Third Party Verification) flow
- `/upiotm` - UPI OTM (One Time Mandate) flow
- `/preauth` - PreAuth Card Flow
- `/checkoutplus` - Checkout Plus flow
- `/split` - Split Payment (Amount/Percentage Based) flow
- `/bankoffer` - Bank Offers (Instant Discount/Cashback) flow

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
Multiflow/
├── src/
│   ├── components/
│   │   ├── flows/
│   │   │   ├── CrossBorder.jsx
│   │   │   ├── NonSeamless.jsx
│   │   │   ├── Subscription.jsx
│   │   │   ├── TPV.jsx
│   │   │   ├── UPIOTM.jsx
│   │   │   ├── PreAuth.jsx
│   │   │   ├── CheckoutPlus.jsx
│   │   │   ├── Split.jsx
│   │   │   └── BankOffer.jsx
│   │   ├── Header.jsx
│   │   ├── Landing.jsx
│   │   └── BackButton.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── multi.html (original HTML file)
```

## Progress

✅ **Completed:**
- React Router setup with all routes
- Landing page with flow selection
- NonSeamless flow component (fully functional)
- Utility functions for hash generation, validation, etc.
- Constants and helper functions

🔄 **In Progress:**
- Other flow components (CrossBorder, Subscription, TPV, etc.) are placeholders

## Next Steps

To complete the migration:

1. ✅ **NonSeamless** - Complete (fully functional React component)
2. Copy the HTML form structure from `multi.html` for remaining flows into their React components
3. Convert HTML event handlers to React event handlers (use the NonSeamless component as a reference)
4. Convert JavaScript functions to React hooks (useState, useEffect)
5. Add debug info and CURL generation features (currently not implemented in NonSeamless)
6. Add code generation modal feature

## Notes

- The original `multi.html` file is preserved for reference
- All CSS styles should be copied from `multi.html` to `src/index.css`
- The routing is set up using React Router v6
- Each flow component can be accessed directly via its URL route

