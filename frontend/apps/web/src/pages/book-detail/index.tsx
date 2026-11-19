import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Empty,
  Input,
  MaterialIcon,
  Spin,
  Tag,
  message,
} from '@ulis/components';
import { translate } from '@ulis/locale';
import { formatCurrencyVnd } from '@ulis/utils';
import { useBookDetail, useMarkBookSold } from '../../services/books';
import {
  useCommentsByPost,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '../../services/comments';
import { useReportModalStore } from '../../store/useReportModalStore';
import { useAuth } from '../../store/useAuth';
import { showBhttConfirm } from '../../components/bhtt-confirm';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id || 101);
  const navigate = useNavigate();
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const user = useAuth((s) => s.user);
  const openReportModal = useReportModalStore((s) => s.openReportModal);

  const { data: book, isLoading } = useBookDetail(postId);
  const { data: comments = [] } = useCommentsByPost(postId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const markBookSold = useMarkBookSold();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const lastCommentTimeRef = useRef<number>(0);

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
        <Empty description={translate('home:emptyResultTitle')} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" className="ulis-primary-btn" onClick={() => navigate('/')}>
            {translate('button:backHome')}
          </Button>
        </div>
      </div>
    );
  }

  const photos = book.images?.length ? book.images : [book.coverUrl];
  const isOwner = user?.email === book.seller.email || user?.id === book.seller.id;

  const handleSendComment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) {
      message.error(
        translate('common:validation.whitespace', {
          field: translate('bookDetail:commentsTitle', { count: comments.length }),
        }),
      );
      return;
    }
    // Rate-limit: tối đa 5 comment/phút
    const now = Date.now();
    if (now - lastCommentTimeRef.current < 3000) {
      message.warning(translate('bookDetail:rateLimitWarning'));
      return;
    }
    lastCommentTimeRef.current = now;

    createComment.mutate(
      {
        postId: book.id,
        content: trimmed,
        authorName: user?.fullName ?? 'Nguyễn Văn An',
        authorEmail: user?.email ?? 'an.nv@ulis.edu.vn',
        userId: user?.id ?? 1,
        isSeller: isOwner,
      },
      {
        onSuccess: () => {
          setCommentText('');
          message.success(translate('bookDetail:commentCreated'));
        },
      },
    );
  };

  const handleSaveEditComment = (commentId: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    updateComment.mutate(
      { id: commentId, postId: book.id, content: trimmed },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          message.success(translate('bookDetail:commentUpdated'));
        },
      },
    );
  };

  const handleDeleteComment = (commentId: number) => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        deleteComment.mutate(
          { id: commentId, postId: book.id },
          {
            onSuccess: () => {
              message.success(translate('bookDetail:commentDeleted'));
            },
          },
        );
      },
    });
  };

  const handleMarkSold = () => {
    showBhttConfirm({
      content: translate('common:deleteConfirmMessage'),
      onConfirm: () => {
        markBookSold.mutate(book.id, {
          onSuccess: () => {
            message.success(translate('myPosts:markedSoldSuccess'));
          },
        });
      },
    });
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 48px' }}>
      {/* Breadcrumb bắt buộc theo Global Rules §2 */}
      <div style={{ marginBottom: 16 }}>
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
              title: <span>{book.facultyName}</span>,
            },
            {
              title: <strong style={{ color: '#004ac6' }}>{book.title}</strong>,
            },
          ]}
        />
      </div>

      {/* Main 12-Col Detail Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '5fr 7fr',
          gap: 24,
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e7ff',
          padding: 24,
          boxShadow: '0 8px 28px rgba(19, 27, 46, 0.06)',
        }}
      >
        {/* Left: 1-3 Photos Gallery */}
        <div>
          <div
            style={{
              aspectRatio: '4 / 3',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#eef2ff',
              border: '1px solid #e2e7ff',
              marginBottom: 12,
            }}
          >
            <img
              src={photos[activePhotoIndex] ?? book.coverUrl}
              alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {photos.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                style={{
                  width: 78,
                  height: 60,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: activePhotoIndex === idx ? '2px solid #1677ff' : '1px solid #c3c6d7',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={imgUrl}
                  alt={`${book.title}-${idx}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Book Metadata & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color="blue">{book.courseCode}</Tag>
                <Tag color="geekblue">{book.bookTypeName}</Tag>
                <Tag color={book.status === 'SELLING' ? 'success' : 'default'}>
                  {book.status === 'SELLING'
                    ? translate('bookDetail:statusSelling')
                    : translate('bookDetail:statusSold')}
                </Tag>
              </div>
              <span style={{ fontSize: 12, color: '#596377' }}>
                {translate('bookDetail:viewCount', { count: book.viewCount })}
              </span>
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#131b2e' }}>
              {book.title}
            </h1>

            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: book.isGiveaway ? '#fff8eb' : '#f2f3ff',
                border: book.isGiveaway ? '1px solid #fcd34d' : '1px solid #d5dcff',
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: book.isGiveaway ? '#d97706' : '#004ac6',
                }}
              >
                {book.isGiveaway ? translate('home:freeTag') : formatCurrencyVnd(book.price)}
              </span>
              {book.originalPrice > 0 && (
                <span style={{ fontSize: 13, color: '#737686', textDecoration: 'line-through' }}>
                  {translate('bookDetail:originalPrice')}: {formatCurrencyVnd(book.originalPrice)}
                </span>
              )}
            </div>

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 18px',
                padding: '12px 14px',
                borderRadius: 10,
                background: '#faf8ff',
                border: '1px solid #e2e7ff',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div>
                <span style={{ color: '#596377' }}>{translate('bookDetail:condition')}: </span>
                <strong style={{ color: '#131b2e' }}>{book.condition}</strong>
              </div>
              <div>
                <span style={{ color: '#596377' }}>{translate('bookDetail:quantity')}: </span>
                <strong style={{ color: '#1677ff' }}>
                  {translate('bookDetail:quantityUnit', { count: book.quantity })}
                </strong>
              </div>
              <div>
                <span style={{ color: '#596377' }}>{translate('bookDetail:campusLocation')}: </span>
                <strong style={{ color: '#006c49' }}>{book.campusLocation}</strong>
              </div>
              <div>
                <span style={{ color: '#596377' }}>{translate('bookDetail:createdAt')}: </span>
                <strong>
                  {book.createdAt} → {book.expiredAt}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                {translate('bookDetail:descriptionTitle')}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#434655', lineHeight: 1.6 }}>
                {book.description}
              </p>
            </div>
          </div>

          {/* Seller Card + CTA Buttons */}
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#f8f9fd',
              border: '1px solid #e2e7ff',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: book.seller.avatarBg,
                  color: '#131b2e',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {book.seller.avatarInitials}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#131b2e' }}>
                  {book.seller.fullName} · MSV: {book.seller.msv}
                </div>
                <div style={{ fontSize: 11.5, color: '#006c49', fontWeight: 600 }}>
                  ✓ {translate('bookDetail:sellerVerified')} ({book.seller.email})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                className="ulis-primary-btn"
                onClick={() => navigate(isAuthenticated ? '/chat' : '/login')}
              >
                <MaterialIcon name="chat" size={16} style={{ marginRight: 6 }} />
                {translate('bookDetail:chatWithSeller')}
              </Button>

              {isOwner && book.status === 'SELLING' && (
                <Button onClick={handleMarkSold}>{translate('bookDetail:markAsSoldBtn')}</Button>
              )}

              <Button
                danger
                onClick={() =>
                  openReportModal({
                    sourceType: 'POST',
                    targetId: book.id,
                    targetTitle: book.title,
                    targetSubtitle: `${book.courseCode} · ${book.facultyName}`,
                  })
                }
              >
                <MaterialIcon name="flag" size={16} style={{ marginRight: 4 }} />
                {translate('button:report')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Level Q&A Comment Section (doc/04: 1 cấp, tối đa 500 ký tự, mới nhất lên đầu) */}
      <div
        style={{
          marginTop: 24,
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e7ff',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#131b2e' }}>
            {translate('bookDetail:commentsTitle', { count: comments.length })}
          </h2>
          <span style={{ fontSize: 12, color: '#596377' }}>
            {translate('bookDetail:commentsRuleNote')}
          </span>
        </div>

        {/* Comment Input Box */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Input.TextArea
            rows={2}
            maxLength={500}
            showCount
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={translate('bookDetail:commentPlaceholder')}
          />
          <Button
            type="primary"
            className="ulis-primary-btn"
            onClick={handleSendComment}
            loading={createComment.isPending}
            style={{ height: 54 }}
          >
            {translate('bookDetail:sendComment')}
          </Button>
        </div>

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => {
            const isCommentOwner =
              user?.id === c.userId || user?.email === c.authorEmail || c.userId === 1;
            return (
              <div
                key={c.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: c.isSeller ? '#f2f3ff' : '#f8f9fd',
                  border: '1px solid #e2e7ff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c.isSeller ? '#004ac6' : '#dbe1ff',
                        color: c.isSeller ? '#ffffff' : '#004ac6',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.authorInitials}
                    </span>
                    <strong style={{ fontSize: 13, color: '#131b2e' }}>{c.authorName}</strong>
                    {c.isSeller && (
                      <Tag color="blue">{translate('bookDetail:sellerAuthorBadge')}</Tag>
                    )}
                    <span style={{ fontSize: 11.5, color: '#737686' }}>{c.createdAt}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {isCommentOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditingText(c.content);
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#1677ff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {translate('bookDetail:editComment')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#ba1a1a',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {translate('bookDetail:deleteComment')}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openReportModal({
                          sourceType: 'COMMENT',
                          targetId: c.id,
                          targetTitle: `${c.authorName}: "${c.content.slice(0, 45)}..."`,
                          targetSubtitle: c.authorEmail,
                        })
                      }
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#737686',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {translate('button:report')}
                    </button>
                  </div>
                </div>

                {editingCommentId === c.id ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Input
                      maxLength={500}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <Button
                      type="primary"
                      className="ulis-primary-btn"
                      onClick={() => handleSaveEditComment(c.id)}
                    >
                      {translate('button:submit')}
                    </Button>
                    <Button onClick={() => setEditingCommentId(null)}>
                      {translate('button:exit')}
                    </Button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#131b2e' }}>{c.content}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
