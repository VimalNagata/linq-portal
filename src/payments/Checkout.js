import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { useAuth } from '../auth/AuthContext';
import './Payments.css';

// Load Stripe.js
// Using a test Stripe publishable key if environment variable is not available
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(stripeKey);

// Pricing data - this would ideally come from your database or API
const pricingTiers = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 50 shortened URLs',
      'Basic analytics',
      'Standard support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Up to 500 shortened URLs',
      'Advanced analytics',
      'Custom short URLs',
      'Priority support',
    ],
    stripePriceId: 'price_1234567890',
  },
  business: {
    name: 'Business',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited shortened URLs',
      'Custom domain',
      'Team collaboration',
      'Premium analytics',
      'Dedicated support',
      'API access',
    ],
    stripePriceId: 'price_0987654321',
  }
};

// Card element options
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Inter", Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

// CheckoutForm component
const CheckoutForm = ({ planId, plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser, token, updateSubscription } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create a payment intent or setup intent on the server
    const createPaymentIntent = async () => {
      try {
        // Make sure we have a token
        if (!token) {
          setError('Authentication required');
          return;
        }
        
        const response = await fetch('https://linq.red/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId,
            priceId: plan.stripePriceId,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    if (currentUser && plan.price > 0) {
      createPaymentIntent();
    }
  }, [currentUser, planId, plan, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setLoading(true);
    setError(null);

    // Get a reference to the CardElement
    const cardElement = elements.getElement(CardElement);

    // Use stripe.confirmCardPayment or stripe.confirmCardSetup based on your subscription model
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          email: currentUser.email,
        },
      },
    });

    if (error) {
      console.error('[Payment Error]', error);
      setError(error.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful, update user's plan on your server
      try {
        const updateResponse = await fetch('https://linq.red/api/update-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId,
            paymentIntentId: paymentIntent.id,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update subscription');
        }
        
        const subscriptionData = await updateResponse.json();
        
        // Update local subscription state
        updateSubscription(subscriptionData);

        // Navigate to success page
        navigate('/payment-success');
      } catch (err) {
        console.error('Error updating subscription:', err);
        setError('Payment processed but failed to update subscription. Please contact support.');
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="order-row">
          <span>{plan.name} Plan</span>
          <span>${plan.price}/{plan.interval}</span>
        </div>
        <div className="order-row order-total">
          <span>Total</span>
          <span>${plan.price}/{plan.interval}</span>
        </div>
      </div>

      <h3>Payment Information</h3>
      <p>Your plan will automatically renew each {plan.interval}.</p>

      <div className="card-element-container">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="payment-error">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        className="payment-button"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : `Pay $${plan.price}`}
      </button>
    </form>
  );
};

// Main Checkout Component
const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [planId, setPlanId] = useState(null);
  
  useEffect(() => {
    // Parse the plan ID from the URL query params
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    
    // Validate that the plan exists
    if (!plan || !pricingTiers[plan]) {
      navigate('/pricing');
      return;
    }
    
    // Set the plan
    setPlanId(plan);
    
    // If user is not logged in, redirect to sign in
    if (!currentUser) {
      navigate('/signin?redirect=checkout');
    }
  }, [location, navigate, currentUser]);
  
  // If no plan is selected yet, show loading
  if (!planId) {
    return <div className="loading-container">Loading checkout...</div>;
  }
  
  const plan = pricingTiers[planId];
  
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Complete Your Purchase</h1>
        <p>You're upgrading to the {plan.name} plan</p>
      </div>
      
      <Elements stripe={stripePromise}>
        <CheckoutForm planId={planId} plan={plan} />
      </Elements>
    </div>
  );
};

export default Checkout;