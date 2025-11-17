# Quick Start Guide

## Prerequisites

- **Node.js** (version 16 or higher recommended)
- **npm** (comes with Node.js) or **yarn**

## Step-by-Step Instructions

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- React and React DOM
- React Router DOM
- Vite (build tool)
- CryptoJS (for hash generation)

### 2. Start the Development Server

```bash
npm run dev
```

The server will:
- Start on `http://localhost:3000`
- Automatically open in your browser (if configured)
- Hot-reload when you make changes

### 3. Access the Application

Once the server starts, you can access:

- **Landing Page**: `http://localhost:3000/`
- **Non-Seamless Flow**: `http://localhost:3000/nonseamless`
- **Cross Border**: `http://localhost:3000/crossborder`
- **Subscription**: `http://localhost:3000/subscription`
- **TPV**: `http://localhost:3000/tpv`
- **UPI OTM**: `http://localhost:3000/upiotm`
- **PreAuth**: `http://localhost:3000/preauth`
- **Checkout Plus**: `http://localhost:3000/checkoutplus`
- **Split Payment**: `http://localhost:3000/split`
- **Bank Offers**: `http://localhost:3000/bankoffer`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can:
1. Change the port in `vite.config.js`
2. Or kill the process using port 3000:
   ```bash
   # On Mac/Linux
   lsof -ti:3000 | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Module Not Found Errors

If you see module not found errors:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CryptoJS Not Loading

Make sure the CryptoJS script is loaded in `index.html`. It should already be there:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
```

## Testing the Non-Seamless Flow

1. Navigate to `http://localhost:3000/nonseamless`
2. Fill in the form:
   - Amount: `100.00`
   - Product Info: `Test Product`
   - First Name: `John`
   - Email: `test@example.com`
   - Phone: `9876543210`
3. Click "Pay Now" to submit to PayU test environment

## Production Build

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` folder. You can preview it with:

```bash
npm run preview
```

