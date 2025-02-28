// PaymentsService.js

class PaymentsService {
  constructor() {
    this.baseUrl = 'https://linq.red/api';
  }

  /**
   * Get the current user's subscription details
   * @returns {Promise<Object>} The subscription details
   */
  async getCurrentSubscription() {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.baseUrl}/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }
  
  /**
   * Create a payment intent on the server
   * @param {string} planId - The ID of the plan being purchased
   * @param {string} priceId - The Stripe Price ID for the plan
   * @returns {Promise<Object>} The payment intent details including client secret
   */
  async createPaymentIntent(planId, priceId) {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.baseUrl}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          priceId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  /**
   * Update a user's subscription after successful payment
   * @param {string} planId - The ID of the plan purchased
   * @param {string} paymentIntentId - The ID of the completed payment intent
   * @returns {Promise<Object>} The updated subscription details
   */
  async updateSubscription(planId, paymentIntentId) {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.baseUrl}/update-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          paymentIntentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel the current subscription
   * @returns {Promise<Object>} The cancellation result
   */
  async cancelSubscription() {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.baseUrl}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}

export const Payments = new PaymentsService();