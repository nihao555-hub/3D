export const handleTwitterShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  const text = '快来看看我用智造3D创建的作品！';
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export const handleFacebookShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export const handleWhatsAppShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  const text = '快来看看我用智造3D创建的作品！';
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};
