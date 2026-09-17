"use client";

import CornerBrackets from "@/components/ui/CornerBrackets";

/**
 * Финальный блок: крупная типографика на фоне распадающегося в точки лица.
 * Справа техничные сноски — включая честную оговорку про domain shift.
 */
export default function Manifesto() {
  return (
    <section className="px-4 pb-6 sm:px-6">
      <div className="relative overflow-hidden border border-line bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/manifesto.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(95deg, #080808 18%, rgba(8,8,8,0.82) 48%, rgba(8,8,8,0.2) 78%)",
          }}
        />
        <CornerBrackets size={24} inset={14} />

        <div className="relative flex min-h-[560px] flex-col justify-between p-7 sm:p-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <p className="mono max-w-[34ch] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-muted">
              EMOTIX обучен на 28 709 изображениях FER-2013.
              Предобученный на ImageNet ResNet-18, дообученный целиком,
              вход 96 × 96, веса классов против перекоса выборки.
            </p>

            {/* Плашка с фоном: текст ложится поверх светлой части снимка */}
            <p className="mono max-w-[36ch] border border-line bg-bg/80 px-4 py-3 text-[11px] uppercase leading-relaxed tracking-[0.14em] text-muted backdrop-blur-sm sm:justify-self-end">
              [ примечание ] датасет — зернистые кадры 48 × 48.
              На студийном свете модель ошибается чаще, чем на тесте.
              Это domain shift, а не магия.
            </p>
          </div>

          <div className="mt-16">
            <h2 className="text-[38px] font-bold leading-[0.92] tracking-tight sm:text-[64px] xl:text-[78px]">
              ЧИТАЕМ ЛИЦА
              <span className="text-accent">.</span>
              <br />
              СЧИТАЕМ ВЕРОЯТНОСТИ
              <span className="text-accent">.</span>
              <br />
              <span className="text-accent">НЕ ГАДАЕМ.</span>
            </h2>
          </div>

          <footer className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {[
                { label: "test accuracy", value: "69.6%" },
                { label: "классов", value: "7" },
                { label: "инференс", value: "~65 ms" },
                { label: "детектор", value: "MTCNN" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                    {item.label}
                  </dt>
                  <dd className="mono mt-1 text-[20px] font-bold text-text">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="text-right">
              <Barcode />
              <p className="mono mt-2 text-[9px] uppercase tracking-[0.22em] text-dim">
                emotix · resnet-18 · fer-2013
              </p>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}

/** Декоративный штрихкод — деталь из технической эстетики. */
function Barcode() {
  // Ширины штрихов зафиксированы, чтобы рисунок не прыгал между рендерами
  const bars = [3, 1, 2, 1, 1, 4, 1, 2, 3, 1, 1, 2, 4, 1, 3, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2];

  return (
    <div className="flex h-9 items-end justify-end gap-[2px]" aria-hidden>
      {bars.map((width, index) => (
        <span
          key={index}
          className="block h-full bg-muted"
          style={{ width, opacity: index % 3 === 0 ? 0.9 : 0.5 }}
        />
      ))}
    </div>
  );
}
