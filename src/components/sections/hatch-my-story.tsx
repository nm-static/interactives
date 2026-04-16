'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

import { HatchSectionHeader } from './hatch-section-header';

type StoryItem = {
  range: string;
  title: string;
  description: string;
};

type HatchMyStoryProps = {
  heading?: string;
  items?: StoryItem[];
};

const DEFAULT_ITEMS: StoryItem[] = [
  {
    range: '2015 - 2016',
    title: 'Started Freelancing',
    description:
      'Began taking on small web design projects while learning the fundamentals. Quickly realized I loved solving complex problems through design.',
  },
  {
    range: '2016 - 2017',
    title: 'Joined Design Team At\nEarly-Stage Startup',
    description:
      'Wore many hats—product design, brand identity, marketing site. Grew the company from 5 to 50 people and shipped features millions use today.',
  },
  {
    range: '2017 - 2019',
    title: 'Led Design At Series B\nSaaS Company',
    description:
      'Built the design systems that scaled to 500K+ users. Mentored junior designers and established processes that stuck.',
  },
  {
    range: '2019 - 2021',
    title: 'Shipped Products\nFor Growing Teams',
    description:
      'Partnered with founders to launch new features, improve onboarding, and build foundations for scale.',
  },
];

function StoryCard({ item }: { item: StoryItem }) {
  return (
    <article className="bg-muted/30 h-full rounded-[18px] p-6 sm:p-7">
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--hatch-cta)]">
        {item.range}
      </div>
      <h3 className="font-body mt-4 text-xl font-semibold tracking-tight whitespace-pre-line">
        {item.title}
      </h3>
      <p className="text-muted-foreground mt-3 text-sm leading-[1.7]">
        {item.description}
      </p>
    </article>
  );
}

export default function HatchMyStory({
  heading = 'My Story',
  items = DEFAULT_ITEMS,
}: HatchMyStoryProps) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="section-padding container">
        <HatchSectionHeader title={heading} />
        <div className="mt-10 sm:mt-12">
          <Carousel opts={{ align: 'start', loop: false }} className="min-w-0">
            <CarouselContent>
              {list.map((item, idx) => (
                <CarouselItem
                  key={`${item.range}-${idx}`}
                  className={cn(
                    'basis-[88%]',
                    'sm:basis-[70%]',
                    'md:basis-[54%]',
                    'lg:basis-[44%]',
                    'xl:basis-[38%]',
                    '2xl:basis-[34%]',
                  )}
                >
                  <StoryCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
