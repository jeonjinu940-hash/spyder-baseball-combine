import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/logos/spyder-logo-white.png" alt="SPYDER" width="88" height="16" />
            <p>
              SPYDER BASEBALL COMBINE은 SPYDER Korea가 운영하는 고교 야구 선수 스프린트 퍼포먼스 측정 프로그램입니다.
            </p>
          </div>
          <div>
            <h3>EXPLORE</h3>
            <ul>
              <li><Link to={{ pathname: '/', hash: '#about' }}>컴바인 소개</Link></li>
              <li><Link to={{ pathname: '/', hash: '#gallery' }}>현장 갤러리</Link></li>
              <li><Link to="/schools">참가 학교</Link></li>
              <li><Link to="/records">선수 기록</Link></li>
              <li><Link to="/rankings">실시간 순위</Link></li>
            </ul>
          </div>
          <div>
            <h3>운영 및 개인정보 안내</h3>
            <ul>
              <li>공개 페이지에는 기록 확인에 필요한 최소 정보만 표시합니다.</li>
              <li>기록 정정·공개 중단 요청은 운영팀을 통해 접수됩니다.</li>
              <li>미성년 선수 사진은 공개 동의가 확인된 자료만 게시합니다.</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SPYDER Korea. All rights reserved.</span>
          <span>NEXT UP BASEBALL</span>
        </div>
      </div>
    </footer>
  );
}
