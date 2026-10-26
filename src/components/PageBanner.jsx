// 섹션/탭 상단 배너: 가운데 정렬 제목 + 한 줄 설명 (어두운 레드 그라데이션)
export default function PageBanner({ title, children, as: Heading = 'h1', id }) {
  return (
    <div className="container page-banner-wrap">
      <div className="page-banner">
        <Heading id={id}>{title}</Heading>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
