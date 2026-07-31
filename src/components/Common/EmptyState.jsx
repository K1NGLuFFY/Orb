import React from 'react';
import { Link } from 'react-router-dom';
import { ArchiveX, SearchX, Inbox } from 'lucide-react';

const icons = {
  cart: Inbox,
  wishlist: ArchiveX,
  search: SearchX,
};

const EmptyState = ({ type = 'cart', title, description, actionText, actionLink }) => {
  const IconComponent = icons[type] || Inbox;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '6rem 2rem',
      background: 'var(--panel)',
      border: '1px dashed var(--hairline)',
      borderRadius: '6px',
      margin: '2rem auto',
      maxWidth: '500px'
    }}>
      <div style={{
        background: 'var(--panel-raised)',
        padding: '1.5rem',
        borderRadius: '50%',
        marginBottom: '1.5rem',
        color: 'var(--signal)'
      }}>
        <IconComponent size={48} strokeWidth={1.5} />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
        color: 'var(--text)'
      }}>
        {title}
      </h3>
      <p style={{
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        fontSize: '1rem',
        lineHeight: 1.5
      }}>
        {description}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn btn-primary">
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
