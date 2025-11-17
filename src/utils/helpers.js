import { DEFAULT_KEY, DEFAULT_SALT, FLOW_PREFIXES } from './constants'

export const generateTransactionId = (flow) => {
  const timestamp = Date.now()
  return `txn_${flow}_${timestamp}`
}

export const getFlowPrefix = (flow) => {
  return FLOW_PREFIXES[flow] || 'ns'
}

export const getCredentials = (flow, useCustom, customKey, customSalt) => {
  if (useCustom && customKey && customSalt) {
    return { key: customKey, salt: customSalt }
  }
  return { key: DEFAULT_KEY, salt: DEFAULT_SALT }
}

export const validatePhone = (phone) => {
  const phoneDigits = phone.replace(/[^0-9]/g, '').substring(0, 10)
  return {
    isValid: phoneDigits.length === 10,
    value: phoneDigits,
    formattedPhone: phoneDigits,
    error: phoneDigits.length === 0 ? '' : phoneDigits.length !== 10 ? 'Phone number must be exactly 10 digits' : ''
  }
}

export const validateEmail = (email) => {
  if (!email) return { isValid: true, error: '' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return {
    isValid: emailRegex.test(email),
    error: emailRegex.test(email) ? '' : 'Please enter a valid email address'
  }
}

// Enhanced generateHash that returns full hash data object (similar to multi.html)
export const generateHashData = (flow, formData, paymentType = 'onetime') => {
  const credentials = getCredentials(flow, formData.useCustomKeys, formData.customKey, formData.customSalt)
  
  const txnid = formData.txnid || generateTransactionId(flow)
  const amount = formData.amount || ''
  const productinfo = formData.productinfo || ''
  const firstname = formData.firstname || ''
  const email = formData.email || ''
  
  let udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = ''
  let hashString = ''
  let hashFormula = ''
  let siDetailsJson = ''
  
  if (flow === 'crossborder' && paymentType === 'subscription') {
    // Cross Border Subscription hash
    udf1 = formData.subUdf1 || ''
    udf2 = formData.subUdf2 || ''
    udf3 = formData.subUdf3 || ''
    udf4 = formData.subUdf4 || ''
    udf5 = formData.subUdf5 || ''
    
    const siDetails = {
      billingAmount: amount,
      billingCurrency: 'INR',
      billingCycle: formData.billingCycle || 'MONTHLY',
      billingInterval: parseInt(formData.billingInterval || '1'),
      paymentStartDate: formData.paymentStartDate || ''
    }
    
    if (formData.paymentEndDate) {
      siDetails.paymentEndDate = formData.paymentEndDate
    }
    
    siDetailsJson = JSON.stringify(siDetails)
    
    const buyerTypeBusiness = formData.buyerType || ''
    if (buyerTypeBusiness !== '') {
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt + '|' + buyerTypeBusiness
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT|buyer_type_business)'
    } else {
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)'
    }
  } else if (flow === 'subscription') {
    // Non-Seamless Subscription hash
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    const siDetails = {
      billingAmount: amount,
      billingCurrency: 'INR',
      billingCycle: formData.billingCycle || 'MONTHLY',
      billingInterval: parseInt(formData.billingInterval || '1'),
      paymentStartDate: formData.paymentStartDate || ''
    }
    
    if (formData.paymentEndDate) {
      siDetails.paymentEndDate = formData.paymentEndDate
    }
    
    siDetailsJson = JSON.stringify(siDetails)
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)'
  } else if (flow === 'crossborder') {
    // Cross border one-time
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    const buyerTypeBusiness = formData.buyerType || ''
    if (buyerTypeBusiness !== '') {
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt + '|' + buyerTypeBusiness
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT|buyer_type_business)'
    } else {
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)'
    }
  } else if (flow === 'tpv') {
    // TPV One Time
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    const beneficiaryDetail = {
      beneficiaryAccountNumber: formData.beneficiaryAccount || '',
      ifscCode: formData.ifscCode || ''
    }
    
    const beneficiaryDetailJson = JSON.stringify(beneficiaryDetail)
    siDetailsJson = beneficiaryDetailJson
    
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + beneficiaryDetailJson + '|' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||beneficiarydetail|SALT)'
  } else if (flow === 'upiotm') {
    // UPI OTM (One Time Mandate)
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    const siDetails = {
      paymentStartDate: formData.paymentStartDate || '',
      paymentEndDate: formData.paymentEndDate || ''
    }
    
    siDetailsJson = JSON.stringify(siDetails)
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)'
  } else if (flow === 'preauth') {
    // PreAuth Card - Standard hash
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)'
  } else if (flow === 'checkoutplus') {
    // Checkout Plus - Standard hash
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)'
  } else if (flow === 'split') {
    // Split Payment - Modified hash with splitRequest
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    // Build splitRequest JSON (should be passed in formData.splitRequest)
    const splitRequestJson = formData.splitRequest || ''
    siDetailsJson = splitRequestJson
    
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt + '|' + splitRequestJson
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT|splitRequest)'
  } else if (flow === 'bankoffer') {
    // Bank Offers
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    const cartDetails = formData.cartDetails || null
    const phone = formData.phone || ''
    const offerKey = formData.offerKey || ''
    
    if (cartDetails) {
      // Extended hash formula when cart_details is present
      const userToken = ''
      const offerAutoApply = ''
      const extraCharges = ''
      
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + userToken + '|' + offerKey + '|' + offerAutoApply + '|' + cartDetails + '|' + extraCharges + '|' + phone + '|' + credentials.salt
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||user_token|offer_key|offer_auto_apply|cart_details|extra_charges|phone|SALT)'
    } else {
      hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt
      hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)'
    }
  } else {
    // Non-seamless one-time
    udf1 = formData.udf1 || ''
    udf2 = formData.udf2 || ''
    udf3 = formData.udf3 || ''
    udf4 = formData.udf4 || ''
    udf5 = formData.udf5 || ''
    
    hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt
    hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)'
  }
  
  // Generate hash using CryptoJS
  let hash = ''
  if (typeof window !== 'undefined' && window.CryptoJS) {
    try {
      hash = window.CryptoJS.SHA512(hashString).toString()
    } catch (error) {
      console.error('Error generating hash:', error)
    }
  } else {
    console.warn('CryptoJS not available')
  }
  
  return {
    hash: hash,
    hashString: hashString,
    hashFormula: hashFormula,
    siDetails: siDetailsJson,
    splitRequest: flow === 'split' ? siDetailsJson : '',
    udf1: udf1,
    udf2: udf2,
    udf3: udf3,
    udf4: udf4,
    udf5: udf5,
    credentials: credentials
  }
}

// Simple hash generation (backward compatible)
export const generateHash = (params, salt) => {
  // Build hash string based on PayU format for non-seamless flow
  const hashString = [
    params.key || '',
    params.txnid || '',
    params.amount || '',
    params.productinfo || '',
    params.firstname || '',
    params.email || '',
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    params.udf6 || '',
    params.udf7 || '',
    params.udf8 || '',
    params.udf9 || '',
    params.udf10 || ''
  ].join('|') + '|' + salt

  // Use CryptoJS if available
  if (typeof window !== 'undefined' && window.CryptoJS) {
    try {
      return window.CryptoJS.SHA512(hashString).toString()
    } catch (error) {
      console.error('Error generating hash:', error)
      return ''
    }
  }
  
  console.warn('CryptoJS not available - make sure the script is loaded in index.html')
  return ''
}
