import {
  Bird,
  BookOpenText,
  Church,
  Compass,
  Footprints,
  Globe2,
  KeyRound,
  Music,
  Scale,
  ScrollText,
  Sparkles,
  Star,
  Users,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  compass: Compass,
  church: Church,
  keys: KeyRound,
  scroll: ScrollText,
  chalice: Wheat,
  music: Music,
  scale: Scale,
  dove: Bird,
  footprints: Footprints,
  people: Users,
  globe: Globe2,
  star: Star,
  shepherd: BookOpenText,
};

export function SubjectIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
