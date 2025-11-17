import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import CrossBorder from './components/flows/CrossBorder'
import NonSeamless from './components/flows/NonSeamless'
import Subscription from './components/flows/Subscription'
import TPV from './components/flows/TPV'
import UPIOTM from './components/flows/UPIOTM'
import PreAuth from './components/flows/PreAuth'
import CheckoutPlus from './components/flows/CheckoutPlus'
import Split from './components/flows/Split'
import BankOffer from './components/flows/BankOffer'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <div className="container">
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/crossborder" element={<CrossBorder />} />
          <Route path="/nonseamless" element={<NonSeamless />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/tpv" element={<TPV />} />
          <Route path="/upiotm" element={<UPIOTM />} />
          <Route path="/preauth" element={<PreAuth />} />
          <Route path="/checkoutplus" element={<CheckoutPlus />} />
          <Route path="/split" element={<Split />} />
          <Route path="/bankoffer" element={<BankOffer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

