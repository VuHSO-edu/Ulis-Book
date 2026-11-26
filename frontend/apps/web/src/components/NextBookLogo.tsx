import { Link } from 'react-router-dom';
import { translate } from '@ulis/locale';

interface NextBookLogoProps {
  onClick?: () => void;
  showDomainBadge?: boolean;
  size?: number;
}

/**
 * Bộ nhận diện Logo mới của NextBook + Domain badge (TASK-12).
 */
export default function NextBookLogo({
  onClick,
  showDomainBadge = false,
  size = 36,
}: NextBookLogoProps) {
  return (
    <Link
      to="/"
      className="ulis-brand"
      onClick={onClick}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
    >
      <span
        className="brand-icon"
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: 'var(--ulis-french-blue)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 16C12 13.7909 13.7909 12 16 12H28C30.2091 12 32 13.7909 32 16V50C32 48.3431 30.6569 47 29 47H15C13.3431 47 12 45.6569 12 44V16Z"
            fill="#FFF4EB"
          />
          <path
            d="M52 16C52 13.7909 50.2091 12 48 12H36C33.7909 12 32 13.7909 32 16V50C32 48.3431 33.3431 47 35 47H49C50.6569 47 52 45.6569 52 44V16Z"
            fill="#F6E0B6"
          />
          <path d="M40 12H46V28L43 25.5L40 28V12Z" fill="#C83E3B" />
          <circle cx="22" cy="26" r="3.2" fill="#3E4B8E" />
          <path d="M17 34H27" stroke="#3E4B8E" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          className="brand-title"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--ulis-midnight-violet)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{translate('common:appName')}</span>
          <span className="brand-badge">V2.0</span>
        </span>
        {showDomainBadge && (
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--ulis-french-blue)',
            }}
          >
            {translate('v2:brandDomain')}
          </span>
        )}
      </span>
    </Link>
  );
}
