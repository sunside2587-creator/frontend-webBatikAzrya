import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react';
import { BUSINESS_CONSTANTS } from '../constants';
import type { ScrollspyGroupConfig, ScrollspyGroupItem } from '../types';

interface UseScrollspyGroupsParams<T, K extends string> {
  items: readonly T[];
  groups: readonly ScrollspyGroupConfig<K>[];
  getItemGroup: (item: T) => K;
  threshold?: number;
  resetKey?: string | number;
  onResetContainers?: () => void;
}

interface ProgrammaticTarget {
  rowIndex: number;
  until: number;
}

export function useScrollspyGroups<T, K extends string>({
  items,
  groups,
  getItemGroup,
  threshold = BUSINESS_CONSTANTS.SCROLLSPY_THRESHOLD,
  resetKey,
  onResetContainers,
}: UseScrollspyGroupsParams<T, K>) {
  const programmaticSpyRef = useRef<ProgrammaticTarget | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isScrollspyActive = items.length > threshold;

  const scrollspyGroups = useMemo<ScrollspyGroupItem<K>[]>(() => {
    if (!isScrollspyActive) return [];

    return groups.map((group) => {
      let startIdx = -1;
      let count = 0;

      items.forEach((item, idx) => {
        if (getItemGroup(item) === group.key) {
          if (startIdx === -1) startIdx = idx;
          count += 1;
        }
      });

      return {
        ...group,
        startIdx,
        count,
      };
    });
  }, [getItemGroup, groups, isScrollspyActive, items]);

  const activeGroupKey = useMemo<K>(() => {
    const activeItem = items[activeRowIndex] || items[0];
    return activeItem ? getItemGroup(activeItem) : groups[0].key;
  }, [activeRowIndex, getItemGroup, groups, items]);

  useEffect(() => {
    programmaticSpyRef.current = null;
    setActiveRowIndex(0);
    setScrollProgress(0);
    onResetContainers?.();
  }, [resetKey, items.length, onResetContainers]);

  const clearProgrammaticSpy = useCallback(() => {
    programmaticSpyRef.current = null;
  }, []);

  const handleContainerScroll = useCallback(
    (
      event: UIEvent<HTMLElement>,
      rowElements: readonly (HTMLElement | null)[],
      stickyOffset = 24
    ) => {
      if (!isScrollspyActive) return;

      const container = event.currentTarget;
      const scrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const nextProgress =
        maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0;
      setScrollProgress(nextProgress);

      if (
        programmaticSpyRef.current &&
        Date.now() < programmaticSpyRef.current.until
      ) {
        setActiveRowIndex(programmaticSpyRef.current.rowIndex);
        return;
      }
      programmaticSpyRef.current = null;

      if (maxScroll > 0 && scrollTop >= maxScroll - 8) {
        setActiveRowIndex(items.length - 1);
        return;
      }

      const containerTop = container.getBoundingClientRect().top;
      let foundIdx = 0;

      for (let i = 0; i < items.length; i += 1) {
        const el = rowElements[i];
        if (!el) continue;
        const dist = el.getBoundingClientRect().top - containerTop;
        if (dist <= stickyOffset) {
          foundIdx = i;
        } else {
          break;
        }
      }
      setActiveRowIndex(foundIdx);
    },
    [isScrollspyActive, items.length]
  );

  const scrollToRow = useCallback(
    (
      rowIndex: number,
      container: HTMLElement | null,
      targetElement: HTMLElement | null | undefined,
      stickyOffset = 0
    ) => {
      if (rowIndex < 0) return;

      programmaticSpyRef.current = {
        rowIndex,
        until: Date.now() + BUSINESS_CONSTANTS.SCROLLSPY_LOCK_MS,
      };
      setActiveRowIndex(rowIndex);

      if (container && targetElement) {
        const containerTop = container.getBoundingClientRect().top;
        const elementTop = targetElement.getBoundingClientRect().top;
        const nextTop = container.scrollTop + (elementTop - containerTop) - stickyOffset;
        container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
      }
    },
    []
  );

  return {
    isScrollspyActive,
    activeRowIndex,
    scrollProgress,
    scrollspyGroups,
    activeGroupKey,
    clearProgrammaticSpy,
    handleContainerScroll,
    scrollToRow,
  };
}
