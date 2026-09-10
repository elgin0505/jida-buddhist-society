import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '技大佛学会 UTeM Buddhist Society';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0806',
          backgroundImage: 'radial-gradient(circle at center, #231c12 0%, #0a0806 100%)',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* 外层古典金色双线框 */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '2px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '16px',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '32px',
            border: '1px solid rgba(212, 175, 55, 0.18)',
            borderRadius: '12px',
            display: 'flex',
          }}
        />

        {/* 顶部微标 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              padding: '6px 22px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#d4af37',
              fontSize: '18px',
              letterSpacing: '0.22em',
              fontWeight: 600,
              display: 'flex',
            }}
          >
            马六甲技术大学佛学会 · UTEM BUDDHIST SOCIETY
          </div>
        </div>

        {/* 金色大字 */}
        <div
          style={{
            fontSize: '84px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: '#E8C547',
            marginBottom: '16px',
            textShadow: '0 4px 24px rgba(212,175,55,0.4)',
            display: 'flex',
          }}
        >
          技大佛学会
        </div>

        {/* 宗旨标语 */}
        <div
          style={{
            fontSize: '26px',
            color: '#E8DCC4',
            letterSpacing: '0.35em',
            marginBottom: '36px',
            display: 'flex',
          }}
        >
          菩提生辉 · 青年同行
        </div>

        {/* 五大年度活动徽章 */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          {['迎新会', '欢乐营', '静修营', '卫塞营', '传承营'].map((item) => (
            <div
              key={item}
              style={{
                padding: '8px 24px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                color: '#d4af37',
                fontSize: '17px',
                letterSpacing: '0.12em',
                display: 'flex',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
