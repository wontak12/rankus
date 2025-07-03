import FilePage from './pages/FilePage.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';
import Home from './pages/Home.js';
import LabPromo from './pages/LabPromo.js';
import LabDetail from './pages/LabDetail.js';
import CreateLab from './pages/CreateLab.js';
import Intro from './pages/Intro.js';
import Header from './components/Header';
import MyLab from './pages/MyLab.js';
import Layout from './components/Layout.js';
import Profile from './pages/Profile.js';
import NoLab from './pages/NoLab.js';

import { useAuth } from './contexts/AuthContext';
import JoinLab from './pages/JoinLab.js';
import Vote from './pages/Vote.js';
import VotePage from './pages/VotePage.js';
import NoticePage from './pages/NoticePage.js';
import NoticeForm from './pages/NoticeForm.js';
import NoticeDetail from './pages/NoticeDetail.js';
import MemberList from './pages/MemberList.js';
import JoinRequestsPage from './pages/JoinRequestsPage.js';
import MemberDetail from './pages/MemberDetail.js';

function App() {
  const { user } = useAuth();
  // 현재 경로 확인
  const path = window.location.pathname;
  const isAuthPage = path === '/' || path === '/login' || path === '/signup';
  const headerUser = isAuthPage ? null : user;
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* 로그인 이후 Layout 적용되는 내부 페이지 */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/promo" element={<LabPromo />} />
          <Route path="/lab/:id" element={<LabDetail />} />
          <Route path="/lab/:id/join" element={<JoinLab />} />
          <Route path="/create-lab" element={<CreateLab />} />
          <Route path="/my-lab" element={<MyLab />} />
          <Route path="/my-lab/no-lab" element={<NoLab />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/file" element={<FilePage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/create" element={<NoticeForm />} />
          <Route path="/notice/:id" element={<NoticeDetail />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/member/:id" element={<MemberDetail />} />
          <Route path="/join-requests" element={<JoinRequestsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;