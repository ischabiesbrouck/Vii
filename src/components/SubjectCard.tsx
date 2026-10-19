import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";
import { Photo, useImage } from "@/components/Photo";
import { ProgressBar } from "@/components/TextBlocks";
import { useLang } from "@/lib/hooks";
import { cn, pick } from "@/lib/utils";
import { useUi } from "@/store/ui";
import type { Subject } from "@/types/content";

export function useSubjectProgress(s: Subject) {
  const studied = useUi((st) => st.studied[s.id]) ?? [];
  const done = s.steps.filter((x) => studied.includes(x.paragraphId)).length;
  return { done, total: s.steps.length, fraction: done / s.steps.length };
}

export function SubjectCard({
  subject: s,
  featured = false,
  flat = false,
  wide = false,
}: {
  subject: Subject;
  featured?: boolean;
  flat?: boolean;
  /** Image beside the text from the sm breakpoint (a lone featured card). */
  wide?: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const { done, total, fraction } = useSubjectProgress(s);
  const image = useImage(s.imageId);
  return (
    <Link
      to={`/subjects/${s.id}`}
      className={cn(
        "group flex h-full flex-col transition-colors duration-200 hover:bg-paper",
        wide && "sm:flex-row",
        !flat && "border border-line bg-card hover:border-gold",
        featured && "border-t-[3px] border-t-accent",
      )}
    >
      {s.imageId ? (
        <div
          className={cn(
            "relative aspect-[16/9] overflow-hidden border-b border-line bg-surface",
            wide &&
              "sm:aspect-auto sm:min-h-[15rem] sm:w-[48%] sm:shrink-0 sm:border-b-0 sm:border-r",
          )}
        >
          {image && (
            <Photo
              image={image}
              focus={s.imageFocus}
              sizes={
                wide
                  ? "(min-width: 640px) 36rem, 100vw"
                  : "(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
              }
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          )}
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-1 flex-col p-5",
          wide && "sm:justify-center sm:p-8",
        )}
      >
        <p className="kicker flex items-center gap-2">
          <SubjectIcon name={s.icon} className="h-4 w-4 shrink-0" />
          {t(`subjects.level.${s.level}`)}
        </p>
        <h3
          className={cn(
            "mt-1 font-title font-medium leading-snug group-hover:text-accent",
            wide ? "text-[1.32rem] sm:text-[1.9rem]" : "text-[1.32rem]",
          )}
        >
          {pick(lang, s.titleNl, s.titleEn)}
        </h3>
        <p
          className={cn(
            "mt-2 text-[0.9rem] leading-relaxed text-muted",
            wide ? "sm:max-w-md sm:text-base" : "flex-1",
          )}
        >
          {pick(lang, s.taglineNl, s.taglineEn)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          <span className="tabular">
            {t("subjects.minutes", { count: s.minutes })} ·{" "}
            {t("subjects.steps", { count: total })}
          </span>
          {done === total ? (
            <span className="inline-flex items-center gap-1 font-semibold text-ok">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {t("subjects.done")}
            </span>
          ) : done > 0 ? (
            <span className="tabular">
              {t("subjects.progress", { done, total })}
            </span>
          ) : null}
        </div>
        {done > 0 && <ProgressBar value={fraction} className="mt-2" />}
      </div>
    </Link>
  );
}
