/**
 * PayPalButtons Component
 *
 * Reusable PayPal checkout buttons with order creation and capture flow.
 * Handles payment lifecycle from order creation to completion.
 */

'use client';

import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import type { CreateOrderData, CreateOrderActions, OnApproveData, OnApproveActions } from '@paypal/paypal-js';

interface PayPalButtonsProps {
  amount: string;
  currency?: string;
  description?: string;
  onSuccess?: (orderId: string, details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

/**
 * PayPalButtons component
 *
 * Usage:
 * ```tsx
 * <PayPalButtons
 *   amount="395.00"
 *   currency="USD"
 *   description="Solo Plan - Annual"
 *   onSuccess={(orderId, details) => {
 *     console.log('Payment successful:', orderId);
 *   }}
 *   onError={(error) => {
 *     console.error('Payment error:', error);
 *   }}
 * />
 * ```
 */
export function PayPalCheckoutButtons({
  amount,
  currency = 'USD',
  description = 'AgencyOS Subscription',
  onSuccess,
  onError,
  onCancel
}: PayPalButtonsProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [processing, setProcessing] = useState(false);

  /**
   * Create order on PayPal
   */
  const createOrder = async (data: CreateOrderData, actions: CreateOrderActions) => {
    try {
      // Call backend API to create order
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await response.json();
      return orderData.id;
    } catch (error) {
      console.error('Error creating order:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  };

  /**
   * Handle order approval and capture payment
   */
  const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
    setProcessing(true);
    try {
      // Call backend API to capture payment
      const response = await fetch('/api/checkout/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: data.orderID
        })
      });

      if (!response.ok) {
        throw new Error('Failed to capture payment');
      }

      const captureData = await response.json();

      // Call success callback
      if (onSuccess) {
        onSuccess(data.orderID, captureData);
      }

      return captureData;
    } catch (error) {
      console.error('Error capturing payment:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle payment error
   */
  const handleError = (error: any) => {
    console.error('PayPal error:', error);
    if (onError) {
      onError(error);
    }
  };

  /**
   * Handle payment cancellation
   */
  const handleCancel = () => {
    console.log('Payment cancelled by user');
    if (onCancel) {
      onCancel();
    }
  };

  // Show loading state while PayPal SDK loads
  if (isPending) {
    return (
      <div className="paypal-buttons-loading">
        <div className="spinner">Loading PayPal...</div>
      </div>
    );
  }

  return (
    <div className="paypal-buttons-container">
      {processing && (
        <div className="processing-overlay">
          <div className="spinner">Processing payment...</div>
        </div>
      )}
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handleError}
        onCancel={handleCancel}
        disabled={processing}
      />
    </div>
  );
}

export default PayPalCheckoutButtons;
