import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Empty,
  MaterialIcon,
  Spin,
  Tag,
  Tooltip,
  message,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatCurrencyVnd } from '@ulis/utils';
import { useCartItems, useRemoveFromCart } from '../../services/v2';
import type { CartRecordItem } from '../../services/mock-data';

interface SellerGroup {
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  sellerFaculty: string;
  sellerReputation: number;
  items: CartRecordItem[];
  totalAmount: number;
}

/**
 * Trang Giỏ hàng gom nhóm theo Người bán (TASK-08) + Cảnh báo điểm uy tín < 3 (TASK-02).
 */
export default function CartPage() {
  const navigate = useNavigate();
  const { data: cartItems = [], isLoading } = useCartItems();
  const removeCartItem = useRemoveFromCart();

  const sellerGroups = useMemo<SellerGroup[]>(() => {
    const map = new Map<number, SellerGroup>();
    for (const item of cartItems) {
      const seller = item.book.seller;
      const sid = seller.id;
      const rep = seller.reputationScore ?? 3;
      const lineAmount = item.book.isGiveaway ? 0 : item.book.price * item.quantity;
      const existing = map.get(sid);
      if (existing) {
        existing.items.push(item);
        existing.totalAmount += lineAmount;
      } else {
        map.set(sid, {
          sellerId: sid,
          sellerName: seller.fullName,
          sellerEmail: seller.email,
          sellerFaculty: seller.faculty,
          sellerReputation: rep,
          items: [item],
          totalAmount: lineAmount,
        });
      }
    }
    return Array.from(map.values());
  }, [cartItems]);

  const handleRemove = (bookPostId: number) => {
    removeCartItem.mutate(bookPostId, {
      onSuccess: () => {
        message.success(translate('v2:cart.removedSuccess'));
      },
    });
  };

  const handleCheckoutWithSeller = (group: SellerGroup) => {
    const firstBookId = group.items[0]?.book.id ?? 101;
    const bookIdsParam = group.items.map((i) => i.book.id).join(',');
    navigate(
      `/chat?postId=${firstBookId}&peerId=${group.sellerId}&invoiceBooks=${encodeURIComponent(bookIdsParam)}`,
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 48px' }}>
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span onClick={() => navigate('/')} style={{ cursor: 'pointer', fontWeight: 600 }}>
                  {translate('nav:breadcrumbHome')}
                </span>
              ),
            },
            {
              title: (
                <strong style={{ color: 'var(--ulis-french-blue)' }}>
                  {translate('v2:cart.navTitle')}
                </strong>
              ),
            },
          ]}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>
            {translate('v2:cart.pageTitle')}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--ulis-midnight-muted)' }}>
            {translate('v2:cart.pageSubtitle')}
          </div>
        </div>

        <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', fontWeight: 700 }}>
          {translate('v2:cart.itemCount', { count: cartItems.length })}
        </Tag>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : sellerGroups.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 4,
            padding: 48,
            textAlign: 'center',
          }}
        >
          <Empty description={translate('v2:cart.emptyCart')} />
          <div style={{ marginTop: 16 }}>
            <Button type="primary" className="ulis-primary-btn" onClick={() => navigate('/')}>
              {translate('button:backHome')}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sellerGroups.map((group) => {
            const isLowRep = group.sellerReputation < 3;
            return (
              <section
                key={group.sellerId}
                style={{
                  background: '#ffffff',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                {/* Seller Group Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: 'var(--ulis-wheat)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <MaterialIcon name="storefront" size={20} />
                    <h3 style={{ margin: 0, fontSize: 16 }}>
                      {translate('v2:cart.sellerGroupHeader', { name: group.sellerName })}
                    </h3>
                    <span style={{ fontSize: 12.5, color: 'var(--ulis-midnight-muted)' }}>
                      ({group.sellerEmail} · {group.sellerFaculty})
                    </span>

                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 4,
                        background: isLowRep ? '#f9dadd' : '#dceee9',
                        color: isLowRep ? '#9e2a2b' : '#2e6f5e',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {isLowRep
                        ? translate('v2:reputation.lowWarningBadge', {
                            score: group.sellerReputation,
                          })
                        : translate('v2:reputation.scoreDisplay', {
                            score: group.sellerReputation,
                          })}
                    </span>
                  </div>

                  <Button
                    type="primary"
                    className="ulis-primary-btn"
                    onClick={() => handleCheckoutWithSeller(group)}
                  >
                    <MaterialIcon name="receipt_long" size={16} style={{ marginRight: 6 }} />
                    {translate('v2:cart.chatAndCheckoutBtn')}
                  </Button>
                </div>

                {/* Cảnh báo nếu điểm uy tín người bán dưới 3 (TASK-02) */}
                {isLowRep && (
                  <div
                    style={{
                      padding: '10px 20px',
                      background: '#fff1f0',
                      borderBottom: '1px solid #ffa39e',
                      color: '#9e2a2b',
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <MaterialIcon name="warning" size={18} />
                    <span>
                      {translate('v2:reputation.lowWarningDetail', {
                        score: group.sellerReputation,
                      })}
                    </span>
                  </div>
                )}

                {/* Items in this Seller Group */}
                <div style={{ padding: '12px 20px' }}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: '12px 0',
                        borderBottom: '1px solid #f7ece1',
                      }}
                    >
                      <div
                        onClick={() => navigate(`/books/${item.book.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        <img
                          src={item.book.coverUrl}
                          alt={item.book.title}
                          style={{
                            width: 56,
                            height: 74,
                            borderRadius: 4,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag color="blue">{item.book.code}</Tag>
                            <Tag>{item.book.courseCode}</Tag>
                            <span style={{ fontSize: 12, color: 'var(--ulis-midnight-muted)' }}>
                              {item.book.campusLocation}
                            </span>
                          </div>
                          <h4 style={{ margin: '4px 0 2px', fontSize: 15 }}>{item.book.title}</h4>
                          <div style={{ fontSize: 12.5, color: 'var(--ulis-midnight-muted)' }}>
                            {item.book.condition}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ulis-french-blue)' }}>
                            {item.book.isGiveaway
                              ? translate('home:freeTag')
                              : formatCurrencyVnd(item.book.price)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ulis-midnight-muted)' }}>
                            SL: {item.quantity} cuốn
                          </div>
                        </div>

                        <Tooltip title={translate('button:delete')}>
                          <button
                            type="button"
                            className="ulis-action-icon-btn danger"
                            onClick={() => handleRemove(item.book.id)}
                          >
                            <MaterialIcon name="delete_outline" size={18} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 12,
                      paddingTop: 12,
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {translate('v2:cart.totalGroupAmount')}
                    </span>
                    <strong style={{ fontSize: 18, color: 'var(--ulis-french-blue)' }}>
                      {formatCurrencyVnd(group.totalAmount)}
                    </strong>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
