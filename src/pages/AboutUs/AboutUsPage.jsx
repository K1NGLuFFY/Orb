import React from 'react';
import Navbar from '../../components/Common/Navbar';
import Footer from '../../components/Common/Footer';

const AboutUsPage = () => {
  return (
    <div className="page-layout">
      <Navbar />
      <div className="container" style={{ padding: '100px 1.5rem', maxWidth: '800px', minHeight: '80vh', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text)', marginBottom: '2rem' }}>About Orbit</h1>
        
        <div style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Orbit is a specialized marketplace designed for collectors of physical media. Whether you're hunting for rare anime box sets, out-of-print manga, classic literature, graphic novels, or timeless cinema releases, Orbit provides a unified platform to discover and purchase what you love.
          </p>
          
          <p style={{ marginBottom: '1.5rem' }}>
            The physical media landscape is highly fragmented, requiring collectors to scour dozens of disparate sites and forums. Orbit aims to solve this by creating a centralized, beautifully designed hub where buyers and sellers can connect over their shared passion for physical media.
          </p>
          
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-light)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginTop: 0 }}>Note on this Project</h3>
            <p style={{ margin: 0, fontSize: '1rem' }}>
              Orbit is currently a portfolio and demonstration project. While it features a complete user authentication system, real-time database, and a fully functional UI, it is not a commercial enterprise. The data, including user profiles and product listings, are simulated for demonstration purposes.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUsPage;
