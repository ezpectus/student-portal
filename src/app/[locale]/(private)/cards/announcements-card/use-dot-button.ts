import { useCallback, useEffect, useState } from 'react';

import { CarouselApi } from '@/components/ui/carousel';

export const useDotButton = (api: CarouselApi) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!api) {
        return;
      }
      api.scrollTo(index);
    },
    [api],
  );

  const onInit = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return;
    setScrollSnaps(carouselApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return;
    setSelectedIndex(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    onInit(api);
    onSelect(api);
    api.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);

    return () => {
      api.off('reInit', onInit).off('reInit', onSelect).off('select', onSelect);
    };
  }, [api, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};
