import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, QrCode, Code2 } from 'lucide-react';
import QRCode from 'qrcode';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
  embedUrl?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ title, description, url, embedUrl }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isQrOpen) {
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrCodeDataUrl)
        .catch(() => {});
    }
  }, [url, isQrOpen]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const embedCode = embedUrl
    ? `<iframe src="${embedUrl}" style="width:100%;height:80vh;border:none;" allowfullscreen></iframe>`
    : '';

  return (
    <div className="border-t border-border pt-6 mt-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Twitter/X */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')}
          className="gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* LinkedIn */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(linkedinUrl, '_blank', 'noopener,noreferrer')}
          className="gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Copy Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(url, 'link')}
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">{copied === 'link' ? 'Copied!' : 'Copy Link'}</span>
        </Button>

        {/* QR Code */}
        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Code</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {qrCodeDataUrl && (
                <Card className="p-4 bg-white">
                  <CardContent className="p-0">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                  </CardContent>
                </Card>
              )}
              <p className="text-sm text-muted-foreground">Scan to open this interactive</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Embed Code */}
        {embedUrl && (
          <Dialog open={isEmbedOpen} onOpenChange={setIsEmbedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Code2 className="w-4 h-4" />
                <span className="hidden sm:inline">Embed</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Embed Code
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-w-full">
                  <code className="break-all whitespace-pre-wrap">{embedCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode, 'embed')}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied === 'embed' ? 'Copied!' : 'Copy Embed Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SocialShare;
