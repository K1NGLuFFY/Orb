import React from 'react';
import Navbar from '../../components/Common/Navbar';
import Footer from '../../components/Common/Footer';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div className="page-layout">
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px', minHeight: '80vh' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Privacy Policy</h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account or interact with the Service. This includes:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Profile Information:</strong> Your name, email address, and role.</li>
              <li><strong>Usage Data:</strong> Your order history, cart contents, and wishlist items.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>All such data is securely managed and persisted via our backend provider, Supabase.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>2. How We Use Cookies</h2>
            <p>
              Orbit uses cookies to improve your experience and keep you signed in. 
              Specifically, we use <strong>session cookies</strong> strictly necessary for authentication and authorization. 
              We also store a simple preference flag to remember if you have acknowledged our cookie consent banner.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              We do not currently use third-party tracking or advertising cookies. Choosing "Necessary Only" or "Accept All" in our <Link to="/" style={{ color: 'var(--primary)' }}>cookie consent banner</Link> both result in strictly functional cookie usage at this time.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>3. Third-Party Services</h2>
            <p>To provide our features, we integrate with several third-party services that may process or receive some of your data as part of core app functionality:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Supabase:</strong> Provides database, authentication, and backend functions.</li>
              <li><strong>Paystack:</strong> Processes our (simulated) transactions.</li>
              <li><strong>TMDB, Jikan, Google Books:</strong> Used to fetch external media metadata and images. (These services do not receive your personal data, only anonymous API queries).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>4. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information. You can use the built-in "Deactivate Account" feature in your dashboard settings to soft-delete your profile, immediately revoking access and hiding your profile from public view.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@orbit-demo.example.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>privacy@orbit-demo.example.com</a> (Placeholder).
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
