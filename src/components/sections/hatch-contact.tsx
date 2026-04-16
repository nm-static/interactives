'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type HatchContactProps = {
  eyebrow?: string;
  title?: string;
  description?: string;

  phoneLabel?: string;
  phoneHref?: string;

  emailLabel?: string;
  emailHref?: string;

  /** Street / city lines; use \n for a second line */
  address?: string;
  /** If set, address is wrapped in a link (e.g. Google Maps). */
  addressHref?: string;
};

const AVATARS = [
  '/images/avatars/avatar-1.webp',
  '/images/avatars/avatar-2.webp',
  '/images/avatars/avatar-3.webp',
  '/images/avatars/avatar-4.webp',
];

const LOGOS = [
  { src: '/images/logos/Frame.webp', alt: 'Flickr' },
  { src: '/images/logos/Frame-1.webp', alt: 'Intel' },
  { src: '/images/logos/Frame-2.webp', alt: 'Gravatar' },
  { src: '/images/logos/Frame-3.webp', alt: 'Appcircle' },
  { src: '/images/logos/Frame-4.webp', alt: 'Brandfolder' },
  { src: '/images/logos/Vector.webp', alt: 'Other' },
];

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="text-foreground mb-2 flex items-center gap-2 text-xs font-medium">
      <span>{children}</span>
      {required ? <span className="text-destructive">*</span> : null}
    </div>
  );
}

export default function HatchContact({
  eyebrow = 'CONTACT US',
  title = "Let's work together",
  description = 'Ready to start your next project? Get in touch and let’s create something great.',

  phoneLabel = '+1 (555) 123-4567',
  phoneHref = 'tel:+15551234567',

  emailLabel = 'hello@example.com',
  emailHref = 'mailto:hello@example.com',

  address = '123 Design Street\nSan Francisco, CA 94102',
  addressHref,
}: HatchContactProps) {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    company: '',
    details: '',
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <section className="bg-background">
      <div className="section-padding container">
        <div className="mx-auto w-full">
          <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--hatch-cta)]">
            {eyebrow}
          </div>

          <h1 className="font-display mt-3 text-3xl leading-[1.1] sm:text-4xl">
            {title}
          </h1>

          <p className="text-muted-foreground mt-4 text-sm leading-[1.7] sm:text-base">
            {description}
          </p>

          <div className="mt-8 flex max-w-full">
            <div className="bg-muted text-muted-foreground flex max-w-full flex-wrap items-center gap-3 rounded-full px-3 py-2 text-sm sm:px-4">
              <div className="flex shrink-0 -space-x-2">
                {AVATARS.map((src, i) => (
                  <div
                    key={src}
                    className="bg-muted relative h-7 w-7 overflow-hidden rounded-full"
                  >
                    <img
                      src={src}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="28px"
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
              <span>The work that’s trusted by teams and founders</span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
            {LOGOS.map((l) => (
              <span
                key={l.src}
                className="group inline-flex cursor-default items-center justify-center px-1.5 py-1"
              >
                <img
                  src={l.src}
                  alt={l.alt}
                  width={110}
                  height={24}
                  className="h-5 w-auto object-contain brightness-[0.82] transition-[filter] duration-200 ease-out group-hover:brightness-[0.58] dark:brightness-[0.88] dark:group-hover:brightness-[0.68]"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 w-full lg:mt-20">
          <div className="grid gap-10 lg:grid-cols-3 lg:items-start lg:gap-12">
            <aside className="flex flex-col gap-6 lg:col-span-1">
              <a
                href={phoneHref}
                className="font-body text-muted-foreground hover:text-foreground flex items-start gap-3 py-0.5 text-sm transition-colors sm:text-base"
              >
                <Phone className="text-primary mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{phoneLabel}</span>
              </a>

              <a
                href={emailHref}
                className="font-body text-muted-foreground hover:text-foreground flex items-start gap-3 py-0.5 text-sm transition-colors sm:text-base"
              >
                <Mail className="text-primary mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-all">{emailLabel}</span>
              </a>

              {address ? (
                addressHref ? (
                  <a
                    href={addressHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-body text-muted-foreground hover:text-foreground flex items-start gap-3 py-0.5 text-sm transition-colors sm:text-base"
                  >
                    <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                    <span className="whitespace-pre-line">{address}</span>
                  </a>
                ) : (
                  <div className="font-body text-muted-foreground flex items-start gap-3 py-0.5 text-sm sm:text-base">
                    <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                    <span className="whitespace-pre-line">{address}</span>
                  </div>
                )
              ) : null}
            </aside>

            <div className="lg:col-span-2">
              <div className="bg-muted rounded-[22px] p-6 sm:p-7">
                <div className="mb-5">
                  <div className="text-foreground font-display text-2xl">
                    Send us a message
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <FieldLabel required>Full Name</FieldLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="John Doe"
                      className="dark:bg-card h-10 rounded-[12px] bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel required>Email</FieldLabel>
                    <Input
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="example@email.com"
                      type="email"
                      className="dark:bg-card h-10 rounded-[12px] bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel>Company (optional)</FieldLabel>
                    <Input
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      placeholder="Acme"
                      className="dark:bg-card h-10 rounded-[12px] bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel required>Project Details</FieldLabel>
                    <Textarea
                      value={form.details}
                      onChange={(e) => update('details', e.target.value)}
                      placeholder="Tell us about your project..."
                      className="dark:bg-card min-h-[120px] resize-none rounded-[12px] bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      className="h-9 rounded-full px-4 text-base"
                    >
                      Send message
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
