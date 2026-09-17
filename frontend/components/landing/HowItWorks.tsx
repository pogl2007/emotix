"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    index: "01",
    title: "Загрузи",
    text: "Фото или видео до 50 MB. jpg, png, mp4, mov, avi.",
  },
  {
    index: "02",
    title: "Анализируем",
    text: "MTCNN находит лица, ResNet-18 считает вероятности семи эмоций.",
  },
  {
    index: "03",
    title: "Результат",
    text: "Bbox на лицах, бары вероятностей, для видео — timeline и распределение.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 pb-6 sm:px-6">
      <div className="border border-line bg-surface/70 p-7 sm:p-10">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
          <h2 className="text-[32px] font-bold leading-none sm:text-[44px]">
            КАК ЭТО РАБОТАЕТ
          </h2>
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-dim">
            [ три шага ]
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.index}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative border border-line bg-bg p-7"
            >
              <span className="mono text-[12px] tracking-[0.2em] text-accent">
                [{step.index}]
              </span>
              <h3 className="mt-5 text-[22px] font-bold">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{step.text}</p>

              {index < STEPS.length - 1 && (
                <span className="mono absolute -right-3 top-1/2 hidden -translate-y-1/2 text-accent md:block">
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
