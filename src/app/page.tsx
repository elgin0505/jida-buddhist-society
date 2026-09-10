import Link from 'next/link';
import { Header } from '@/components/Header';
import { ParallaxGrid } from '@/components/ParallaxGrid';
import CylindricalGallery from '@/components/CylindricalGallery';
import { Sparkles, ArrowRight, BookOpen, Flame, Calendar, HeartHandshake } from 'lucide-react';

const CLASSES = [
  {
    title: '佛学班例常',
    desc: '适合零基础与进修同学，从佛教基本教义、因果业报与佛法智慧轻松入门，解行并重。',
    tag: '基础入门',
  },
  {
    title: '生活课题班例常',
    desc: '以佛法智慧探讨生活、学业与情绪管理等现实课题，在繁忙学业中安顿身心。',
    tag: '身心止息',
  },
  {
    title: '冬至',
    desc: '岁末传统佳节温馨相聚，共搓汤圆、感念恩德，传递温暖祝福与法喜圆满。',
    tag: '岁末温情',
  },
];

const FIVE_EVENTS = [
  {
    title: '迎新会',
    subtitle: 'Orientation & Welcoming Gathering',
    desc: '诚挚迎接新届佛友融入技大佛学会大家庭，破冰结缘、共勉同行，开启温暖而法喜充盈的大学新旅程。',
  },
  {
    title: '欢乐营',
    subtitle: 'Youth Joy Camp',
    desc: '寓教于乐的青年佛学营，透过创意团康破冰、团队协作与佛法体验，在欢声笑语中增进同修情谊与正向能量。',
  },
  {
    title: '静修营',
    subtitle: 'Zen Meditation Camp',
    desc: '专为大学生打造的止语静心修行营，以坐禅、行禅与正念观照抚平学业浮躁，探寻内心深处的祥和与智慧。',
  },
  {
    title: '卫塞营',
    subtitle: 'Vesak Celebration Camp',
    desc: '纪念佛陀诞生、成道与涅槃的三期同一盛典营，以灌沐如来、传灯发愿与佛法共修，长养慈悲菩提心。',
  },
  {
    title: '传承营',
    subtitle: 'Heritage & Succession Camp',
    desc: '凝聚新老执委与骨干同修的领导力培训营，薪火相传、研讨展望，将正信佛法的利他奉献精神代代延续。',
  },
];

const MORE_EVENTS = [
  '中秋供灯法会',
  '晨间禅坐',
  '佛法青年分享会',
  '禅意手工莲花灯坊',
  '自然步道经行',
  '校园慈心素食义卖',
  '临终关怀辅导座谈',
  '古寺佛像参访研学',
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-warm-white text-charcoal selection:bg-golden-rich/20 selection:text-charcoal">
      {/* 悬浮毛玻璃导航栏 */}
      <Header />

      {/* 核心视差照片墙 */}
      <ParallaxGrid />

      {/* ── 模块：佛学班 ── */}
      <section id="classes" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <SectionHeading eyebrow="常态课程 · 福慧双修" title="佛学班与禅修实践" />
        <div className="grid gap-6 sm:grid-cols-3">
          {CLASSES.map((c) => (
            <div
              key={c.title}
              className="group relative flex flex-col justify-between rounded-3xl border border-ocher/25 bg-warm-cream/40 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-golden-rich/40 hover:bg-warm-white hover:shadow-md hover:shadow-golden-rich/5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-golden-rich/10 px-3 py-1 text-xs font-semibold text-golden-rich">
                    {c.tag}
                  </span>
                  <BookOpen className="h-4 w-4 text-golden-rich/60 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-charcoal group-hover:text-golden-rich transition-colors">
                  {c.title}
                </h3>
                <p className="mt-3.5 text-sm leading-relaxed text-muted">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 模块：3D 轮胎式环形活动画廊 ── */}
      <CylindricalGallery />

      {/* ── 模块：五大活动 ── */}
      <section id="five-events" className="border-y border-ocher/15 bg-warm-cream/40 px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="年度亮点 · 盛大巡礼" title="技大佛学会五大活动" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_EVENTS.map((e, i) => (
              <div
                key={e.title}
                className="group flex flex-col rounded-3xl bg-warm-white p-6 sm:p-7 shadow-sm ring-1 ring-charcoal/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-golden-rich/10 hover:ring-golden-rich/30"
              >
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl font-black text-golden-rich/70 transition-colors group-hover:text-golden-rich">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal transition-colors group-hover:text-golden-rich">
                      {e.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-golden-rich/80 tracking-wide">
                      {e.subtitle}
                    </p>
                    <p className="mt-3.5 text-sm leading-relaxed text-muted">
                      {e.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 模块：更多活动 ── */}
      <section id="more-events" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <SectionHeading eyebrow="法喜充盈 · 持续更新" title="探索更多精彩活动" />
        <p className="max-w-2xl text-sm leading-relaxed text-muted mb-8">
          除了常态佛学课程与年度五大盛事，佛学会全年持续开展丰富多彩的青年交流项目，从晨曦禅坐到公益助人，陪伴大家度过充实有意义的大学时光。
        </p>

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {MORE_EVENTS.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 rounded-full border border-ocher/30 bg-warm-cream/50 px-4 py-2 text-xs sm:text-sm font-medium text-charcoal/90 transition-all hover:border-golden-rich hover:bg-golden-rich/10 hover:text-golden-rich"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-golden-rich" />
              {name}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-charcoal px-6 py-3.5 text-sm font-semibold text-warm-white shadow-sm transition-all hover:bg-charcoal/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 text-golden-rich" />
            <span>查看完整活动日历</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── 模块：进入 3D 会员系统引流 Banner (CTA) ── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-golden-rich/30 bg-gradient-to-br from-warm-cream via-warm-white to-ocher-light/30 p-8 sm:p-12 shadow-sm text-center">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-golden-rich/15 px-3 py-1 text-xs font-semibold text-golden-rich">
              <Flame className="h-3.5 w-3.5" />
              恒河圣境 · 会员积分出勤追踪
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-charcoal">
              共修菩提，心怀慈悲 · 开启专属修行之旅
            </h2>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted">
              技大佛学会会员可登录系统打卡点亮心灯、累计精进出勤积分，并在 3D 沉浸式禅境湖畔与同修交流互动。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-golden-rich px-8 py-3.5 text-sm font-bold text-warm-white shadow-md shadow-golden-rich/30 transition-all hover:bg-golden-deep hover:scale-105 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                <span>立即登入 / 注册</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 底部版权 ── */}
      <footer className="border-t border-ocher/20 bg-warm-white/90 px-4 py-12 text-center sm:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          {/* 社交媒体矩阵图标 (Instagram / Telegram / WhatsApp) */}
          <div className="flex items-center gap-2.5">
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ocher/30 bg-warm-white text-muted transition-all duration-300 hover:border-golden-rich hover:bg-golden-rich/10 hover:text-[#E1306C] hover:scale-110 shadow-sm"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>

            <a
              href="#"
              aria-label="Telegram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ocher/30 bg-warm-white text-muted transition-all duration-300 hover:border-golden-rich hover:bg-golden-rich/10 hover:text-[#229ED9] hover:scale-110 shadow-sm"
            >
              <TelegramIcon className="h-4 w-4" />
            </a>

            <a
              href="#"
              aria-label="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ocher/30 bg-warm-white text-muted transition-all duration-300 hover:border-golden-rich hover:bg-golden-rich/10 hover:text-[#25D366] hover:scale-110 shadow-sm"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>

          <a
            href="mailto:jidafxh2014@gmail.com"
            className="hover:text-golden-rich transition-colors"
          >
            jidafxh2014@gmail.com
          </a>

          <p>© {new Date().getFullYear()} 技大佛学会</p>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-golden-rich">
        {eyebrow}
      </span>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">{title}</h2>
    </div>
  );
}

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
