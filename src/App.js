import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Header from "./components/Header";
import Layout from "./components/Layout.js";
import CreateLab from "./pages/CreateLab.js";
import FilePage from "./pages/FilePage.js";
import Home from "./pages/Home.js";
import Intro from "./pages/Intro.js";
import LabDetail from "./pages/LabDetail.js";
import LabPromo from "./pages/LabPromo.js";
import Login from "./pages/Login.js";
import MyLab from "./pages/MyLab.js";
import NoLab from "./pages/NoLab.js";
import Profile from "./pages/Profile.js";
import Signup from "./pages/Signup.js";

import NoticeDetail from "./components/mylab//NoticeDetail.js";
import Attendance from "./components/mylab/Attendance.js";
import Interview from "./components/mylab/Interview";
import Schedule from "./components/mylab/schedule.js";
import { useAuth } from "./contexts/AuthContext";
import JoinLab from "./pages/JoinLab.js";
import JoinRequestsPage from "./pages/JoinRequestsPage.js";
import MemberDetail from "./pages/MemberDetail.js";
import MemberList from "./pages/MemberList.js";
import NoticeForm from "./pages/NoticeForm.js";
import NoticePage from "./pages/NoticePage.js";
import VotePage from "./pages/VotePage.js";

function App() {
	const { user } = useAuth();
	const path = window.location.pathname;
	const isAuthPage = path === "/" || path === "/login" || path === "/signup";
	const headerUser = isAuthPage ? null : user;

	return (
		<Router>
			<Header />
			<Routes>
				<Route path="/" element={<Intro />} />
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />

				{/* 로그인 이후 Layout 적용 */}
				<Route element={<Layout />}>
					<Route path="/home" element={<Home />} />
					<Route path="/promo" element={<LabPromo />} />
					<Route path="/lab/:id" element={<LabDetail />} />

					{/* ✅ 기존 레거시 경로 (interviewId 없음) — 유지하되, JoinLab 내부에서 ?interviewId=... 쿼리로도 처리 가능하도록 이미 패치한 버전 사용 */}
					<Route path="/lab/:id/join" element={<JoinLab />} />

					{/* ✅ 신규: interviewId 포함 라우트 */}
					<Route
						path="/lab/:labId/interviews/:interviewId/join"
						element={<JoinLab />}
					/>

					<Route path="/lab/:labId/schedule" element={<Schedule />} />

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
					<Route path="/notices/:labId/:noticeId" element={<NoticeDetail />} />
					{/* 인터뷰 리스트(슬롯 설정 화면 등) */}
					<Route path="/lab/:labId/interviews" element={<Interview />} />
					<Route path="/lab/:labId/attendance" element={<Attendance />} />
                	<Route path="/attend" element={<Attendance />} />

					<Route path="/join-requests" element={<JoinRequestsPage />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
