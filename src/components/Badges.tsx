import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { DocType, Solemnity, Verdict, HeardFrom } from '@/types/content';
import { CheckCircle2, XCircle, CircleDot, Scale } from 'lucide-react';

export function DocTypeBadge({ type }: { type: DocType }) {
  const { t } = useTranslation();
  return <Badge variant={type}>{t(`doc.type.${type}`)}</Badge>;
}

export function SolemnityBadge({ solemnity }: { solemnity: Solemnity }) {
  const { t } = useTranslation();
  return (
    <Badge variant="gold" title={t('doc.solemnityHint')}>
      {t(`doc.solemnity.${solemnity}`)}
    </Badge>
  );
}

const verdictStyle = {
  supported: { variant: 'ok', Icon: CheckCircle2 },
  'not-in-the-text': { variant: 'bad', Icon: XCircle },
  partly: { variant: 'warn', Icon: CircleDot },
  contested: { variant: 'slate', Icon: Scale },
} as const;

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useTranslation();
  const { variant, Icon } = verdictStyle[verdict];
  return (
    <Badge variant={variant}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {t(`claims.verdict.${verdict}`)}
    </Badge>
  );
}

export function HeardFromBadge({ heardFrom }: { heardFrom: HeardFrom }) {
  const { t } = useTranslation();
  return <Badge variant="outline">{t(`claims.heardFrom.${heardFrom}`)}</Badge>;
}
