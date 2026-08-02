import React from 'react';
import Navbar from '../../components/Common/Navbar';
import Footer from '../../components/Common/Footer';

const TermsOfServicePage = () => {
  return (
    <div className="page-layout">
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px', minHeight: '80vh' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Terms of Service</h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Orbit ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. 
              <strong> Note: Orbit is currently a demonstration and portfolio project. These terms reflect intended behavior for a production application but hold no commercial legal binding.</strong>
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>2. User Accounts and Responsibilities</h2>
            <p>Users on Orbit may be assigned different roles, each with specific privileges:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Buyers:</strong> Can browse, add items to their cart, and simulate purchases.</li>
              <li><strong>Sellers:</strong> Can list items for sale and manage their inventory. Seller accounts require administrative approval.</li>
              <li><strong>Staff / Admins:</strong> Responsible for moderating content, approving sellers, and maintaining platform integrity.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>3. Purchases and Payments</h2>
            <p>
              The Service integrates with Paystack for payment processing. <strong>Please note that Orbit is operating in test mode.</strong> No real transactions will occur, and you should only use test card numbers when interacting with the checkout system. We are not liable for any real funds used accidentally.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>4. Prohibited Conduct</h2>
            <p>While using the Service, you agree not to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Create accounts using automated means or under false pretenses.</li>
              <li>Interfere with or disrupt the security, integrity, or performance of the Service.</li>
              <li>Upload or list fraudulent, illegal, or heavily miscategorized items.</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>5. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" and "as available". We make no warranties, expressed or implied, regarding the reliability, availability, or accuracy of the Service. In no event shall Orbit or its creators be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any significant changes by posting a notice on our website or sending an email. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
