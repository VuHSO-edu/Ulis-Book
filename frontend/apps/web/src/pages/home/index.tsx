import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Drawer,
  Empty,
  Input,
  InputNumber,
  MaterialIcon,
  Pagination,
  Select,
  Spin,
  Switch,
  Tooltip,
  message,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatAndValidateDateInput, formatCurrencyVnd } from '@ulis/utils';
import { useBookFilterStore, type SortMode } from '../../store/useBookFilterStore';
import { useBookCategories, useSearchBooks } from '../../services/books';
import { useReportModalStore } from '../../store/useReportModalStore';
import { useAuth } from '../../store/useAuth';
import type { BookPostItem } from '../../services/mock-data';

const CAMPUS_LOCATIONS = [
  'Toà A1 ULIS',
  'Sân C1',
  'Thư viện ULIS',
  'Toà B2',
  'Cổng chính Phạm Văn Đồng',
  'Toà Sunwah',
  'Toà Pháp A3',
];

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const openReportModal = useReportModalStore((s) => s.openReportModal);

  const keyword = useBookFilterStore((s) => s.keyword);
  const facultyCode = useBookFilterStore((s) => s.facultyCode);
  const bookTypeCode = useBookFilterStore((s) => s.bookTypeCode);
  const onlyGiveaway = useBookFilterStore((s) => s.onlyGiveaway);
  const minPrice = useBookFilterStore((s) => s.minPrice);
  const maxPrice = useBookFilterStore((s) => s.maxPrice);
  const campusLocation = useBookFilterStore((s) => s.campusLocation);
  const fromDate = useBookFilterStore((s) => s.fromDate);
  const toDate = useBookFilterStore((s) => s.toDate);
  const sortBy = useBookFilterStore((s) => s.sortBy);
  const pageNumber = useBookFilterStore((s) => s.pageNumber);
  const pageSize = useBookFilterStore((s) => s.pageSize);
  const drawerOpen = useBookFilterStore((s) => s.drawerOpen);
  const setFilter = useBookFilterStore((s) => s.setFilter);
  const resetFilters = useBookFilterStore((s) => s.resetFilters);
  const clearFocusedRow = useBookFilterStore((s) => s.clearFocusedRow);

  const [inputKeyword, setInputKeyword] = useState(keyword);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  // Global Rules §4: Debounce 500ms + useBookFilterStore.getState() trong setTimeout + reset về trang 1
  const handleKeywordInput = (val: string) => {
    setInputKeyword(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const latestState = useBookFilterStore.getState();
      latestState.clearFocusedRow();
      latestState.setFilter({ keyword: val.trim(), pageNumber: 1 });
    }, 500);
  };

  const { data: categories = [] } = useBookCategories();
  const faculties = categories.filter((c) => c.parentAxis === 'FACULTY');
  const bookTypes = categories.filter((c) => c.parentAxis === 'BOOK_TYPE');

  const { data: searchResult, isLoading } = useSearchBooks({
    keyword,
    facultyCode,
    bookTypeCode,
    onlyGiveaway,
    minPrice,
    maxPrice,
    campusLocation,
    sortBy,
    pageNumber,
    pageSize,
  });

  const allItems = searchResult?.items ?? [];
  const totalCount = searchResult?.total ?? allItems.length;
  const pagedItems = allItems.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  const handleReportClick = (e: React.MouseEvent, book: BookPostItem) => {
    e.stopPropagation();
    openReportModal({
      sourceType: 'POST',
      targetId: book.id,
      targetTitle: book.title,
      targetSubtitle: `${book.courseCode} · ${book.facultyName}`,
    });
  };

  const handleChatClick = (e: React.MouseEvent, book: BookPostItem) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/chat?postId=${book.id}`);
  };

  const handleDateChange = (field: 'fromDate' | 'toDate', rawValue: string) => {
    const { formatted, isValid } = formatAndValidateDateInput(rawValue);
    setFilter({ [field]: formatted });
    if (formatted.length === 10 && !isValid) {
      message.error(
        translate('common:validation.dateInvalid', {
          field: translate('home:dateRangeLabel'),
        }),
      );
    }
  };

  const handleApplyDrawerFilters = () => {
    if (fromDate.length === 10 && toDate.length === 10) {
      const f = formatAndValidateDateInput(fromDate);
      const t = formatAndValidateDateInput(toDate);
      if (!f.isValid || !t.isValid) {
        message.error(
          translate('common:validation.dateInvalid', {
            field: translate('home:dateRangeLabel'),
          }),
        );
        return;
      }
      if (f.timestamp && t.timestamp && f.timestamp > t.timestamp) {
        message.error(translate('common:validation.dateRangeInvalid'));
        return;
      }
    }
    clearFocusedRow();
    setFilter({ drawerOpen: false, pageNumber: 1 });
  };

  return (
    <div>
      {/* 1. HERO SECTION & SEARCH COMMAND BAR — Minimalist & Flat */}
      <section className="ulis-home-hero">
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 auto 12px',
              maxWidth: 760,
              fontSize: 'clamp(26px, 3.4vw, 38px)',
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#131b2e',
            }}
          >
            {translate('home:heroTitlePrefix')}{' '}
            <span style={{ color: '#004ac6' }}>{translate('home:heroTitleHighlight')}</span>
          </h1>

          <p
            style={{
              margin: '0 auto',
              maxWidth: 600,
              fontSize: 14,
              color: '#596377',
              lineHeight: 1.65,
            }}
          >
            {translate('home:heroSubtitle')}
          </p>

          {/* Capsule Floating Search Command Bar */}
          <div className="ulis-capsule-search">
            <div className="capsule-segment">
              <span className="segment-label">{translate('home:searchLabel')}</span>
              <Input
                variant="borderless"
                value={inputKeyword}
                onChange={(e) => handleKeywordInput(e.target.value)}
                placeholder={translate('home:searchPlaceholder')}
                prefix={<MaterialIcon name="search" size={18} style={{ color: '#004ac6' }} />}
                allowClear
                style={{ padding: 0 }}
              />
            </div>

            <div className="capsule-segment">
              <span className="segment-label">{translate('home:facultyLabel')}</span>
              <Select
                variant="borderless"
                popupMatchSelectWidth={false}
                value={facultyCode}
                onChange={(val) => {
                  clearFocusedRow();
                  setFilter({ facultyCode: val, pageNumber: 1 });
                }}
                style={{ width: '100%' }}
                options={[
                  { value: 'ALL', label: translate('home:allFaculties') },
                  ...faculties.map((f) => ({
                    value: f.code,
                    label: f.name,
                  })),
                ]}
              />
            </div>

            <div className="capsule-segment">
              <span className="segment-label">{translate('home:categoryLabel')}</span>
              <Select
                variant="borderless"
                popupMatchSelectWidth={false}
                value={bookTypeCode}
                onChange={(val) => {
                  clearFocusedRow();
                  setFilter({ bookTypeCode: val, pageNumber: 1 });
                }}
                style={{ width: '100%' }}
                options={[
                  { value: 'ALL', label: translate('home:allCategories') },
                  ...bookTypes.map((t) => ({
                    value: t.code,
                    label: t.name,
                  })),
                ]}
              />
            </div>

            <button
              type="button"
              className="ulis-sell-cta-btn"
              onClick={() => {
                clearFocusedRow();
                setFilter({ keyword: inputKeyword.trim(), pageNumber: 1 });
              }}
              style={{ height: 44, padding: '0 22px' }}
            >
              <MaterialIcon name="travel_explore" size={18} />
              <span>{translate('button:search')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. STICKY FACULTY HORIZONTAL FILTER BAR */}
      <section className="ulis-faculty-bar">
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div className="ulis-faculty-pills">
            <button
              type="button"
              onClick={() => setFilter({ facultyCode: 'ALL', onlyGiveaway: false, pageNumber: 1 })}
              className={`faculty-pill ${facultyCode === 'ALL' && !onlyGiveaway ? 'active' : ''}`}
            >
              <MaterialIcon name="grid_view" size={16} />
              <span>{translate('home:tabAll')}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter({ onlyGiveaway: !onlyGiveaway, pageNumber: 1 })}
              className={`faculty-pill giveaway-pill ${onlyGiveaway ? 'active' : ''}`}
            >
              <MaterialIcon name="volunteer_activism" size={16} />
              <span>{translate('home:tabFreeCorner')}</span>
            </button>

            {faculties.map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() =>
                  setFilter({
                    facultyCode: facultyCode === f.code ? 'ALL' : f.code,
                    pageNumber: 1,
                  })
                }
                className={`faculty-pill ${facultyCode === f.code ? 'active' : ''}`}
              >
                <MaterialIcon name="translate" size={15} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setFilter({ drawerOpen: true })}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 10,
                border: '1px solid #c3c6d7',
                background: '#ffffff',
                color: '#131b2e',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MaterialIcon name="tune" size={17} style={{ color: '#004ac6' }} />
              <span>{translate('home:filterButton')}</span>
            </button>

            {(keyword ||
              facultyCode !== 'ALL' ||
              bookTypeCode !== 'ALL' ||
              onlyGiveaway ||
              campusLocation !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setInputKeyword('');
                  resetFilters();
                }}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid #ffdad6',
                  background: '#fff5f5',
                  color: '#ba1a1a',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {translate('button:reset')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. BOOK LISTINGS GRID (10 items/page default theo Global Rules §4) */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 40px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#004ac6',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {translate('home:sectionBadge')}
            </div>
            <h2 style={{ margin: '2px 0 4px', fontSize: 22, fontWeight: 800, color: '#131b2e' }}>
              {translate('home:sectionTitle')}
            </h2>
            <div style={{ fontSize: 13, color: '#596377' }}>
              {translate('home:sectionSubtitle')} ·{' '}
              <strong>{translate('common:totalRecords', { total: totalCount })}</strong>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              borderRadius: 10,
              background: '#e5e9f5',
              gap: 4,
            }}
          >
            {(
              [
                { key: 'newest', label: translate('home:sortNewest') },
                { key: 'cheapest', label: translate('home:sortCheapest') },
                { key: 'mostViewed', label: translate('home:sortMostViewed') },
              ] as Array<{ key: SortMode; label: string }>
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter({ sortBy: s.key, pageNumber: 1 })}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: 'none',
                  background: sortBy === s.key ? '#ffffff' : 'transparent',
                  color: sortBy === s.key ? '#004ac6' : '#596377',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : pagedItems.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 48,
              textAlign: 'center',
              border: '1px solid #e2e7ff',
            }}
          >
            <Empty description={translate('home:emptyResultTitle')} />
            <p style={{ color: '#596377', marginTop: 8 }}>{translate('home:emptyResultDesc')}</p>
            <Button
              type="primary"
              className="ulis-primary-btn"
              onClick={() => {
                setInputKeyword('');
                resetFilters();
              }}
            >
              {translate('button:reset')}
            </Button>
          </div>
        ) : (
          <>
            <div className="ulis-book-grid">
              {pagedItems.map((book) => {
                const discountPercent =
                  book.originalPrice > 0 && book.price > 0
                    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
                    : 0;
                return (
                  <article
                    key={book.id}
                    className={`ulis-book-card ${book.isGiveaway ? 'giveaway-card' : ''}`}
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    <div className="card-cover">
                      <img src={book.coverUrl} alt={book.title} loading="lazy" />

                      {/* Top Badges */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        {book.isGiveaway ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#004ac6',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <MaterialIcon name="volunteer_activism" size={14} />
                            <span>{translate('home:freeTag')}</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.95)',
                              color: '#004ac6',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            ● {book.conditionBadge}
                          </span>
                        )}

                        <Tooltip title={translate('home:reportTooltip')}>
                          <button
                            type="button"
                            onClick={(e) => handleReportClick(e, book)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(255,255,255,0.9)',
                              color: '#596377',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <MaterialIcon name="flag" size={15} />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Bottom Location Pill */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(19, 27, 46, 0.78)',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <MaterialIcon name="location_on" size={13} style={{ color: '#6cf8bb' }} />
                          <span>{book.campusLocation}</span>
                        </span>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 5,
                            background: '#004ac6',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {book.courseCode}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                          fontSize: 11,
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: '#eef2ff',
                            color: '#004ac6',
                            fontWeight: 700,
                          }}
                        >
                          {book.facultyName}
                        </span>
                        <span style={{ color: '#737686' }}>{book.createdAt}</span>
                      </div>

                      <h3
                        style={{
                          margin: '0 0 10px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#131b2e',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                      >
                        {book.title}
                      </h3>

                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: 10,
                          borderTop: '1px solid #f0f2f8',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span
                              style={{
                                fontSize: 17,
                                fontWeight: 700,
                                color: '#004ac6',
                              }}
                            >
                              {book.isGiveaway
                                ? translate('home:freePrice')
                                : formatCurrencyVnd(book.price)}
                            </span>
                            {book.originalPrice > 0 && (
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: '#8c95a6',
                                  textDecoration: 'line-through',
                                }}
                              >
                                {formatCurrencyVnd(book.originalPrice)}
                              </span>
                            )}
                          </div>

                          {discountPercent > 0 && !book.isGiveaway && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: '#eef2ff',
                                color: '#004ac6',
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              -{discountPercent}%
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: book.seller.avatarBg,
                                color: '#131b2e',
                                fontSize: 10.5,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {book.seller.avatarInitials}
                            </span>
                            <div style={{ lineHeight: 1.2 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#131b2e',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <span>{book.seller.fullName}</span>
                                <MaterialIcon
                                  name="verified"
                                  size={13}
                                  style={{ color: '#004ac6' }}
                                />
                              </div>
                              <div style={{ fontSize: 10.5, color: '#737686' }}>
                                {book.seller.cohort}
                              </div>
                            </div>
                          </div>

                          <Tooltip title={translate('home:chatTooltip')}>
                            <button
                              type="button"
                              onClick={(e) => handleChatClick(e, book)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: 'none',
                                background: '#eef2ff',
                                color: '#004ac6',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <MaterialIcon name="chat" size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Footer (Mặc định 10 bản ghi/trang theo Global Rules §4) */}
            <div
              style={{
                marginTop: 28,
                padding: '14px 18px',
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid #e2e7ff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#131b2e' }}>
                {translate('common:totalRecords', { total: totalCount })}
              </span>
              <Pagination
                current={pageNumber}
                pageSize={pageSize}
                total={totalCount}
                showSizeChanger={false}
                onChange={(page) => setFilter({ pageNumber: page })}
              />
            </div>
          </>
        )}

        {/* 4. COMMUNITY GIVING 0Đ CALLOUT BANNER — Flat & Uniform Palette */}
        <div
          style={{
            marginTop: 36,
            padding: '28px 32px',
            borderRadius: 12,
            background: '#ffffff',
            border: '1px solid #dbe1ff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#eef2ff',
                color: '#004ac6',
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <MaterialIcon name="favorite" size={14} />
              <span>{translate('home:communityBadge')}</span>
            </span>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#131b2e' }}>
              {translate('home:communityTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: '#596377', lineHeight: 1.6 }}>
              {translate('home:communityDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setFilter({ onlyGiveaway: true, pageNumber: 1 })}
              style={{
                height: 40,
                padding: '0 18px',
                borderRadius: 8,
                border: '1px solid #004ac6',
                background: '#004ac6',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {translate('home:communityExploreBtn')}
            </button>
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? '/my-posts?create=1' : '/login')}
              style={{
                height: 40,
                padding: '0 18px',
                borderRadius: 8,
                border: '1px solid #dbe1ff',
                background: '#eef2ff',
                color: '#004ac6',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {translate('home:communityPostBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* 5. SLIDE-OVER FILTER DRAWER (Stitch Screen 2 Drawer + dd/mm/yyyy date range validation) */}
      <Drawer
        title={translate('home:filterDrawerTitle')}
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setFilter({ drawerOpen: false })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
              {translate('home:priceRangeLabel')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={5000}
                value={minPrice}
                onChange={(v) => setFilter({ minPrice: typeof v === 'number' ? v : undefined })}
                placeholder={translate('home:minPrice')}
              />
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={5000}
                value={maxPrice}
                onChange={(v) => setFilter({ maxPrice: typeof v === 'number' ? v : undefined })}
                placeholder={translate('home:maxPrice')}
              />
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: '#fff8eb',
              border: '1px solid #fcd34d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#784b00' }}>
              {translate('home:onlyFreeLabel')}
            </span>
            <Switch
              checked={onlyGiveaway}
              onChange={(checked) => setFilter({ onlyGiveaway: checked })}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
              {translate('home:campusLocationLabel')}
            </div>
            <Select
              style={{ width: '100%' }}
              value={campusLocation}
              onChange={(val) => setFilter({ campusLocation: val })}
              options={[
                { value: 'ALL', label: translate('home:allFaculties') },
                ...CAMPUS_LOCATIONS.map((loc) => ({
                  value: loc,
                  label: loc,
                })),
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
              {translate('home:dateRangeLabel')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input
                value={fromDate}
                onChange={(e) => handleDateChange('fromDate', e.target.value)}
                placeholder={translate('home:fromDatePlaceholder')}
                maxLength={10}
              />
              <Input
                value={toDate}
                onChange={(e) => handleDateChange('toDate', e.target.value)}
                placeholder={translate('home:toDatePlaceholder')}
                maxLength={10}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Button
              block
              onClick={() => {
                setInputKeyword('');
                resetFilters();
              }}
            >
              {translate('button:reset')}
            </Button>
            <Button
              type="primary"
              block
              className="ulis-primary-btn"
              onClick={handleApplyDrawerFilters}
            >
              {translate('home:applyFilter')}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
