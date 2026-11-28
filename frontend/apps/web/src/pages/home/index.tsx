import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Drawer,
  Dropdown,
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
import { useAddToCart, useSystemAppearance } from '../../services/v2';
import { useReportModalStore } from '../../store/useReportModalStore';
import { useAuth } from '../../store/useAuth';
import type { BookPostItem } from '../../services/mock-data';

const CAMPUS_LOCATIONS = [
  'Sảnh A1 ULIS',
  'Sân C1',
  'Thư viện ULIS',
  'Toà B2',
  'Toà Sunwah',
  'Toà Pháp A3',
  'Cổng chính Phạm Văn Đồng',
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
  const [openMenu, setOpenMenu] = useState<'faculty' | 'type' | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownWrapRef = useRef<HTMLDivElement | null>(null);
  const bookGridRef = useRef<HTMLDivElement | null>(null);

  const { data: appearance } = useSystemAppearance();
  const addToCart = useAddToCart();
  const activeHeroBanners = (appearance?.heroBanners ?? []).filter((b) => b.active);

  // TASK-05: Auto-play loop carousel mỗi 3 giây cho ảnh trong tiêu đề
  useEffect(() => {
    if (activeHeroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % activeHeroBanners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeHeroBanners.length]);

  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (dropdownWrapRef.current && !dropdownWrapRef.current.contains(ev.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const campusLocationOptions =
    categories.filter((c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE').length > 0
      ? categories
          .filter((c) => c.parentAxis === 'CAMPUS_LOCATION' && c.status === 'ACTIVE')
          .map((c) => c.name)
      : CAMPUS_LOCATIONS;

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
    navigate(`/chat?postId=${book.id}&peerId=${book.seller.id}`);
  };

  const handleAddToCartClick = (e: React.MouseEvent, book: BookPostItem) => {
    e.stopPropagation();
    addToCart.mutate(
      { book, quantity: 1 },
      {
        onSuccess: () => {
          message.success(translate('v2:cart.addedSuccess'));
        },
      },
    );
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

  const activeFacultyObj = faculties.find((f) => f.code === facultyCode);
  const activeBookTypeObj = bookTypes.find((t) => t.code === bookTypeCode);

  return (
    <div className="ulis-home-container">
      {/* 1. BẢNG QUẢNG CÁO VỀ WEB (FULL-WIDTH LOOP IMAGE BANNER) */}
      <section
        className="ulis-promo-banner"
        style={{
          display: 'block',
          padding: 0,
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
          height: 300,
          background: 'var(--ulis-wheat)',
        }}
      >
        {activeHeroBanners.length > 0 ? (
          (() => {
            const currentSlide =
              activeHeroBanners[activeSlideIndex % activeHeroBanners.length] ??
              activeHeroBanners[0];
            return (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(61, 21, 52, 0.55) 0%, rgba(61, 21, 52, 0.08) 55%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                {currentSlide.badgeText && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 18,
                      padding: '5px 12px',
                      borderRadius: 4,
                      background: 'var(--ulis-french-blue)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {currentSlide.badgeText}
                  </span>
                )}
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    right: 20,
                    bottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#ffffff',
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.35)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentSlide.title}
                  </div>
                  <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                    {activeHeroBanners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        aria-label={`Slide ${idx + 1}`}
                        onClick={() => setActiveSlideIndex(idx)}
                        style={{
                          width: idx === activeSlideIndex % activeHeroBanners.length ? 22 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          background:
                            idx === activeSlideIndex % activeHeroBanners.length
                              ? '#ffffff'
                              : 'rgba(255, 255, 255, 0.5)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <img
            src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1400&q=80"
            alt="NextBook Banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </section>

      {/* 2. THANH TÌM KIẾM (TEXT PHỤ FUTURA) + 2 DROPDOWN: KHOA, NGÀNH & THỂ LOẠI SÁCH */}
      <section className="ulis-booknet-search-row">
        <div className="ulis-booknet-search-box">
          <input
            type="text"
            className="search-input-el"
            value={inputKeyword}
            onChange={(e) => handleKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                clearFocusedRow();
                setFilter({ keyword: inputKeyword.trim(), pageNumber: 1 });
              }
            }}
            placeholder={translate('home:searchBooknetPlaceholder')}
          />
          {inputKeyword && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => handleKeywordInput('')}
              aria-label={translate('button:reset')}
            >
              <MaterialIcon name="close" size={16} />
            </button>
          )}
          <button
            type="button"
            className="search-submit-btn"
            onClick={() => {
              clearFocusedRow();
              setFilter({ keyword: inputKeyword.trim(), pageNumber: 1 });
            }}
            aria-label={translate('button:search')}
          >
            <MaterialIcon name="search" size={20} />
          </button>
        </div>

        <div className="ulis-booknet-dropdowns" ref={dropdownWrapRef}>
          {/* Dropdown 1: Khoa, ngành */}
          <div className="ulis-custom-dropdown">
            <button
              type="button"
              className={`dropdown-trigger-btn ${openMenu === 'faculty' ? 'open' : ''}`}
              onClick={() => setOpenMenu(openMenu === 'faculty' ? null : 'faculty')}
            >
              <span>{activeFacultyObj ? activeFacultyObj.name : translate('home:dropdownFaculty')}</span>
              <MaterialIcon name="expand_more" size={18} />
            </button>

            {openMenu === 'faculty' && (
              <div className="dropdown-menu-panel">
                <button
                  type="button"
                  className={`dropdown-menu-item ${facultyCode === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    clearFocusedRow();
                    setFilter({ facultyCode: 'ALL', pageNumber: 1 });
                    setOpenMenu(null);
                  }}
                >
                  {translate('home:allFaculties')}
                </button>
                {faculties.map((f) => (
                  <button
                    key={f.code}
                    type="button"
                    className={`dropdown-menu-item ${facultyCode === f.code ? 'active' : ''}`}
                    onClick={() => {
                      clearFocusedRow();
                      setFilter({ facultyCode: f.code, pageNumber: 1 });
                      setOpenMenu(null);
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 2: Thể loại sách (Làm như mẫu Selling / Bidding / Exchange với nền Wheat #F6E0B6) */}
          <div className="ulis-custom-dropdown">
            <button
              type="button"
              className={`dropdown-trigger-btn ${openMenu === 'type' ? 'open' : ''}`}
              onClick={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
            >
              <span>
                {onlyGiveaway
                  ? translate('home:typeGiveaway')
                  : activeBookTypeObj
                    ? activeBookTypeObj.name
                    : translate('home:dropdownBookType')}
              </span>
              <MaterialIcon name="expand_more" size={18} />
            </button>

            {openMenu === 'type' && (
              <div className="dropdown-menu-panel">
                <button
                  type="button"
                  className={`dropdown-menu-item ${bookTypeCode === 'ALL' && !onlyGiveaway ? 'active' : ''}`}
                  onClick={() => {
                    clearFocusedRow();
                    setFilter({ bookTypeCode: 'ALL', onlyGiveaway: false, pageNumber: 1 });
                    setOpenMenu(null);
                  }}
                >
                  {translate('home:typeSelling')}
                </button>

                {bookTypes.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    className={`dropdown-menu-item ${bookTypeCode === t.code && !onlyGiveaway ? 'active' : ''}`}
                    onClick={() => {
                      clearFocusedRow();
                      setFilter({ bookTypeCode: t.code, onlyGiveaway: false, pageNumber: 1 });
                      setOpenMenu(null);
                    }}
                  >
                    {t.name}
                  </button>
                ))}

                <button
                  type="button"
                  className={`dropdown-menu-item ${onlyGiveaway ? 'active' : ''}`}
                  onClick={() => {
                    clearFocusedRow();
                    setFilter({ bookTypeCode: 'ALL', onlyGiveaway: true, pageNumber: 1 });
                    setOpenMenu(null);
                  }}
                >
                  {translate('home:typeGiveaway')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. TIÊU ĐỀ PHẦN SÁCH & BỘ SẮP XẾP */}
      <section ref={bookGridRef}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-primary)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              {translate('home:booksForYouTitle')}
            </h2>
          </div>

          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              borderRadius: 4,
              background: 'var(--ulis-wheat)',
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setFilter({ sortBy: 'newest', pageNumber: 1 })}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: sortBy === 'newest' ? 'var(--ulis-french-blue)' : 'transparent',
                color: sortBy === 'newest' ? '#ffffff' : 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {translate('home:sortNewest')}
            </button>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'cheapest',
                    label: 'Giá: Thấp đến Cao',
                    onClick: () => setFilter({ sortBy: 'cheapest', pageNumber: 1 }),
                  },
                  {
                    key: 'highest',
                    label: 'Giá: Cao đến Thấp',
                    onClick: () => setFilter({ sortBy: 'highest', pageNumber: 1 }),
                  },
                ],
                selectedKeys: sortBy === 'cheapest' || sortBy === 'highest' ? [sortBy] : [],
              }}
              trigger={['click']}
            >
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: 'none',
                  background:
                    sortBy === 'cheapest' || sortBy === 'highest'
                      ? 'var(--ulis-french-blue)'
                      : 'transparent',
                  color:
                    sortBy === 'cheapest' || sortBy === 'highest'
                      ? '#ffffff'
                      : 'var(--ulis-midnight-violet)',
                  fontFamily: 'var(--font-primary)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {sortBy === 'cheapest'
                  ? 'Giá: Thấp đến Cao'
                  : sortBy === 'highest'
                    ? 'Giá: Cao đến Thấp'
                    : 'Giá'}
                <MaterialIcon name="expand_more" size={16} />
              </button>
            </Dropdown>

            <button
              type="button"
              onClick={() => setFilter({ sortBy: 'mostViewed', pageNumber: 1 })}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: sortBy === 'mostViewed' ? 'var(--ulis-french-blue)' : 'transparent',
                color: sortBy === 'mostViewed' ? '#ffffff' : 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {translate('home:sortMostViewed')}
            </button>
          </div>
        </div>

        {/* 5. LƯỚI SÁCH 3 CỘT NGANG (BOOKNET HORIZONTAL CARDS) */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : pagedItems.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 4,
              padding: 48,
              textAlign: 'center',
            }}
          >
            <Empty description={translate('home:emptyResultTitle')} />
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                color: 'var(--ulis-midnight-muted)',
                marginTop: 8,
              }}
            >
              {translate('home:emptyResultDesc')}
            </p>
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
            <div className="ulis-booknet-grid">
              {pagedItems.map((book) => {
                const isAvailable = book.status === 'SELLING' && book.quantity > 0;
                return (
                  <article
                    key={book.id}
                    className="ulis-booknet-card"
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    {/* Left: Ảnh bìa sách */}
                    <div className="booknet-card-cover">
                      <img src={book.coverUrl} alt={book.title} loading="lazy" />
                      <span className="course-tag">{book.courseCode}</span>
                    </div>

                    {/* Right: Thông tin sách theo đúng thứ tự đánh giá trên ảnh */}
                    <div className="booknet-card-info">
                      <div>
                        {/* Hàng sao điểm uy tín (1-5) + Cảnh báo dưới 3 (TASK-02) */}
                        {(() => {
                          const rep = book.seller.reputationScore ?? 4;
                          const isLowRep = rep < 3;
                          return (
                            <div className="booknet-stars">
                              <span
                                className="stars-row"
                                style={{
                                  color: isLowRep ? '#c83e3b' : '#e6b85c',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {'★'.repeat(rep)}
                                {'☆'.repeat(Math.max(0, 5 - rep))}{' '}
                                <span
                                  style={{
                                    marginLeft: 4,
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    background: isLowRep ? '#f9dadd' : 'var(--ulis-seashell)',
                                    color: isLowRep ? '#9e2a2b' : 'var(--ulis-midnight-violet)',
                                    fontSize: 10.5,
                                  }}
                                >
                                  {isLowRep ? `⚠️ Uy tín ${rep}/5` : `Uy tín ${rep}/5`}
                                </span>
                              </span>
                              <Tooltip title={translate('home:reportTooltip')}>
                                <button
                                  type="button"
                                  onClick={(e) => handleReportClick(e, book)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--ulis-midnight-muted)',
                                    cursor: 'pointer',
                                    padding: 2,
                                  }}
                                >
                                  <MaterialIcon name="flag" size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          );
                        })()}

                        {/* Tên sách: Text chính (Adobe Caslon) */}
                        <h3 className="booknet-title" title={book.title}>
                          {book.title}
                        </h3>

                        {/* Người đăng: Text phụ (Futura), gạch chân */}
                        <div className="booknet-poster">{book.seller.fullName}</div>

                        {/* Giá sách: Text phụ (Futura) */}
                        <div className="booknet-price-row">
                          <span className="booknet-price">
                            {book.isGiveaway
                              ? translate('home:freeTag')
                              : formatCurrencyVnd(book.price)}
                          </span>
                          {book.originalPrice > 0 && !book.isGiveaway && (
                            <span className="booknet-old-price">
                              {formatCurrencyVnd(book.originalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Tình trạng: Còn -> Text chính (Adobe Caslon) */}
                        <div className="booknet-status-text">
                          {isAvailable
                            ? translate('home:cardStatusAvailable')
                            : translate('home:cardStatusSold')}
                        </div>
                      </div>

                      {/* Nút bấm: Mua ngay + Thêm Giỏ hàng (TASK-08) + Chat */}
                      <div className="booknet-actions">
                        <button
                          type="button"
                          className={`booknet-buy-btn ${book.isGiveaway ? 'secondary-wheat' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/books/${book.id}`);
                          }}
                        >
                          {book.isGiveaway
                            ? translate('button:receiveFree')
                            : translate('button:buyNow')}
                        </button>

                        {isAvailable && (
                          <Tooltip title={translate('v2:cart.addToCartBtn')}>
                            <button
                              type="button"
                              className="booknet-icon-btn"
                              onClick={(e) => handleAddToCartClick(e, book)}
                            >
                              <MaterialIcon name="add_shopping_cart" size={15} />
                            </button>
                          </Tooltip>
                        )}

                        <Tooltip title={translate('home:chatTooltip')}>
                          <button
                            type="button"
                            className="booknet-icon-btn"
                            onClick={(e) => handleChatClick(e, book)}
                          >
                            <MaterialIcon name="chat_bubble_outline" size={15} />
                          </button>
                        </Tooltip>
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
                borderRadius: 4,
                background: '#ffffff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
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

        {/* 6. GÓC SÁCH 0Đ SINH VIÊN (CALLOUT BANNER — WHEAT & POWDER BLUE) */}
        <div
          style={{
            marginTop: 32,
            padding: '26px 32px',
            borderRadius: 4,
            background: 'var(--ulis-wheat)',
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
                borderRadius: 4,
                background: 'var(--ulis-powder-blue)',
                color: 'var(--ulis-midnight-violet)',
                fontFamily: 'var(--font-primary)',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <MaterialIcon name="favorite" size={14} />
              <span>{translate('home:communityBadge')}</span>
            </span>
            <h3
              style={{
                margin: '0 0 8px',
                fontFamily: 'var(--font-primary)',
                fontSize: 21,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              {translate('home:communityTitle')}
            </h3>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-secondary)',
                fontSize: 13.5,
                color: 'var(--ulis-midnight-violet)',
                lineHeight: 1.6,
              }}
            >
              {translate('home:communityDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="ulis-primary-btn"
              onClick={() => setFilter({ onlyGiveaway: true, pageNumber: 1 })}
            >
              {translate('home:communityExploreBtn')}
            </button>
            <button
              type="button"
              className="ulis-secondary-btn-powder"
              onClick={() => navigate(isAuthenticated ? '/my-posts?create=1' : '/login')}
            >
              {translate('home:communityPostBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* 7. SLIDE-OVER FILTER DRAWER (dd/mm/yyyy date range validation) */}
      <Drawer
        title={translate('home:filterDrawerTitle')}
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setFilter({ drawerOpen: false })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 8,
              }}
            >
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
              borderRadius: 4,
              background: 'var(--ulis-wheat)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              {translate('home:onlyFreeLabel')}
            </span>
            <Switch
              checked={onlyGiveaway}
              onChange={(checked) => setFilter({ onlyGiveaway: checked })}
            />
          </div>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 8,
              }}
            >
              {translate('home:campusLocationLabel')}
            </div>
            <Select
              style={{ width: '100%' }}
              value={campusLocation}
              onChange={(val) => setFilter({ campusLocation: val })}
              options={[
                { value: 'ALL', label: translate('home:allFaculties') },
                ...campusLocationOptions.map((loc) => ({
                  value: loc,
                  label: loc,
                })),
              ]}
            />
          </div>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 8,
              }}
            >
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
              className="ulis-secondary-btn-powder"
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
