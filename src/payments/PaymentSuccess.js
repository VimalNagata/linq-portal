import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './Payments.css';

const PaymentSuccess = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="payment-success-container">
      <div className="success-icon">
        <FaCheckCircle />
      </div>
      <h1>Payment Successful!</h1>
      <p>Thank you for upgrading your Lin.q account. Your subscription has been activated.</p>
      <div className="success-details">
        <p>You will receive a receipt in your email shortly.</p>
        <p>Your new plan benefits are now available in your account.</p>
      </div>
      <div className="success-actions">
        <Link to="/profile" className="primary-button">Go to My Account</Link>
        <Link to="/shorten" className="secondary-button">Shorten a URL</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;