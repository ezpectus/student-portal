'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';

const CAROUSEL_CDN_BASE_URL = env.NEXT_PUBLIC_CAROUSEL_CDN_BASE_URL;

type CarouselImage = {
  src: string;
  description: string;
  credits: string;
  creditsUrl?: string;
};

const IMAGES: CarouselImage[] = [
  { src: 'img1.jpg', description: 'slide-1', credits: 'Student Portal' },
  { src: 'img2.jpg', description: 'slide-2', credits: 'Student Portal' },
  { src: 'img3.jpg', description: 'slide-3', credits: 'Student Portal' },
  { src: 'img4.jpg', description: 'slide-4', credits: 'Student Portal' },
  { src: 'img5.jpg', description: 'slide-5', credits: 'Student Portal' },
];

export const LoginCarousel = () => {
  const t = useTranslations('public.auth.carousel');
  return (
    <Carousel
      opts={{
        loop: true,
        align: 'center',
        duration: 50,
      }}
      plugins={[
        Autoplay({
          delay: 10000,
        }),
        Fade(),
      ]}
      className="relative flex h-full w-full"
    >
      <CarouselContent className="-ml-0 h-full w-full">
        {IMAGES.map((image) => (
          <CarouselItem key={image.src} className="relative flex h-full w-full">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl">
              <Image
                src={`${CAROUSEL_CDN_BASE_URL}/${image.src}`}
                alt={image.description}
                width={914}
                height={1280}
                quality={100}
                className="h-[calc(100dvh-40px)] w-full shrink-0 object-cover"
              />
              <div className="from-basic-black/80 to-basic-black/0 text-basic-white absolute bottom-0 left-0 w-full rounded-b-xl bg-linear-to-t from-10% px-14 pt-32 pb-14">
                <h6>{t(image.description)}</h6>
                <span>
                  {t('credits-by')}{' '}
                  {image.creditsUrl ? (
                    <Link className="text-basic-white" href={image.creditsUrl} target="_blank" rel="noopener noreferrer">
                      {image.credits}
                    </Link>
                  ) : (
                    image.credits
                  )}
                </span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute right-0 bottom-0 flex justify-between p-14">
        <CarouselPrevious className="static mr-4 translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
};
