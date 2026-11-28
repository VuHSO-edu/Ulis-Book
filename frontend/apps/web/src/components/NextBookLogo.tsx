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
      <img
        src="/logo-nextbooks.png"
        alt={translate('common:appName')}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />
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
