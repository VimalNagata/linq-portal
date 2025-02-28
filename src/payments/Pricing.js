import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Payments.css';
import { FaCheck, FaCheckCircle } from 'react-icons/fa';

// Define pricing tiers - this would typically come from your database or API
const pricingTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Up to 50 shortened URLs',
      'Basic analytics',
      'Standard support',
    ],
    buttonText: 'Current Plan',
    stripePriceId: '', // No price ID for free plan
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Up to 500 shortened URLs',
      'Advanced analytics',
      'Custom short URLs',
      'Priority support',
    ],
    buttonText: 'Upgrade Now',
    stripePriceId: 'price_1234567890', // Replace with your actual Stripe Price ID
    popular: true,
  },
  {
    id: 'business',
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
    buttonText: 'Upgrade Now',
    stripePriceId: 'price_0987654321', // Replace with your actual Stripe Price ID
    popular: false,
  }
];

const Pricing = () => {
  const { currentUser, userSubscription } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [currentPlan, setCurrentPlan] = useState(null);
  
  useEffect(() => {
    // Set initial selected plan based on user's subscription
    if (userSubscription?.plan) {
      setSelectedPlan(userSubscription.plan);
      setCurrentPlan(userSubscription.plan);
    } else if (currentUser?.plan) {
      setSelectedPlan(currentUser.plan);
      setCurrentPlan(currentUser.plan);
    } else {
      setSelectedPlan('free');
      setCurrentPlan('free');
    }
  }, [userSubscription, currentUser]);
  
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };
  
  const handleUpgrade = (plan) => {
    // If user is not logged in, redirect to sign in
    if (!currentUser) {
      navigate('/signin?redirect=pricing');
      return;
    }
    
    // If it's the current plan, no action needed
    if (plan.id === currentPlan) {
      return;
    }
    
    // If it's a free plan, confirm downgrade
    if (plan.price === 0 && currentPlan !== 'free') {
      if (window.confirm('Are you sure you want to downgrade to the Free plan? You will lose access to premium features.')) {
        // TODO: Implement direct downgrade to free without payment
        navigate(`/checkout?plan=${plan.id}`);
      }
      return;
    }
    
    // Otherwise navigate to checkout with the selected plan
    navigate(`/checkout?plan=${plan.id}`);
  };
  
  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your URL shortening needs</p>
      </div>
      
      <div className="pricing-tiers">
        {pricingTiers.map((tier) => (
          <div 
            key={tier.id}
            className={`pricing-tier ${tier.popular ? 'popular' : ''} ${selectedPlan === tier.id ? 'selected' : ''}`}
            onClick={() => handlePlanSelect(tier.id)}
          >
            {tier.popular && <div className="popular-tag">Most Popular</div>}
            <h2>{tier.name}</h2>
            <div className="price">
              {tier.price === 0 ? (
                <span>Free</span>
              ) : (
                <>
                  <span className="currency">$</span>
                  <span className="amount">{tier.price}</span>
                  <span className="interval">/{tier.interval}</span>
                </>
              )}
            </div>
            
            <ul className="features">
              {tier.features.map((feature, index) => (
                <li key={index}>
                  <FaCheck className="check-icon" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              className={`plan-button ${tier.price === 0 ? 'free-plan' : 'paid-plan'}`}
              onClick={() => handleUpgrade(tier)}
              disabled={currentPlan === tier.id}
            >
              {currentPlan === tier.id ? (
                <span className="current-plan-text">
                  <FaCheckCircle className="current-plan-icon" /> Current Plan
                </span>
              ) : tier.buttonText}
            </button>
          </div>
        ))}
      </div>
      
      <div className="pricing-footer">
        <p>All plans include our base features: URL shortening, basic analytics, and secure links.</p>
        <p>Need a custom plan? <a href="mailto:support@linq.red">Contact our sales team</a></p>
      </div>
    </div>
  );
};

export default Pricing;