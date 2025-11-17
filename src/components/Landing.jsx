import React from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
  const navigate = useNavigate()

  const flows = [
    { value: 'crossborder', label: 'Cross Border Payment', path: '/crossborder' },
    { value: 'nonseamless', label: 'Non-Seamless Checkout (PreBuilt)', path: '/nonseamless' },
    { value: 'subscription', label: 'Non-Seamless Subscription (Recurring)', path: '/subscription' },
    { value: 'tpv', label: 'TPV Payment (Third Party Verification)', path: '/tpv' },
    { value: 'upiotm', label: 'UPI OTM (One Time Mandate)', path: '/upiotm' },
    { value: 'preauth', label: 'PreAuth Card Flow', path: '/preauth' },
    { value: 'checkoutplus', label: 'Checkout Plus', path: '/checkoutplus' },
    { value: 'split', label: 'Split Payment (Amount/Percentage Based)', path: '/split' },
    { value: 'bankoffer', label: 'Bank Offers (Instant Discount/Cashback)', path: '/bankoffer' }
  ]

  const handleFlowSelect = (path) => {
    navigate(path)
  }

  return (
    <div className="landing-section">
      <h2>Select Payment Flow</h2>
      <p>Choose the payment integration flow you want to test</p>
      
      <div className="flow-selector">
        <label htmlFor="flowSelect">Payment Flow:</label>
        <select 
          id="flowSelect" 
          onChange={(e) => {
            const selectedFlow = flows.find(f => f.value === e.target.value)
            if (selectedFlow) {
              handleFlowSelect(selectedFlow.path)
            }
          }}
          defaultValue=""
        >
          <option value="">-- Select a flow --</option>
          {flows.map(flow => (
            <option key={flow.value} value={flow.value}>
              {flow.label}
            </option>
          ))}
        </select>
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {flows.map(flow => (
            <button
              key={flow.value}
              className="button"
              onClick={() => handleFlowSelect(flow.path)}
              style={{ margin: 0 }}
            >
              {flow.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Landing

