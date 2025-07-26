// src/components/Header.js
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";
import { logout } from "../utils/logout";

function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, setUser } = useAuth();
	const isAuthPage = ["/", "/login", "/signup"].includes(location.pathname);

	// username 디버깅용 로그
	console.log("🛠️ Debug Username:", user?.name);

	return (
		<header className="rankus-header">
			<div className="rankus-header-inner">
				<span
					className="rankus-header-logo-text"
					onClick={() => navigate("/home")}
				>
					RANKUS
				</span>

				{user && !isAuthPage && (
					<div className="rankus-header-profile-group">
						<div
							className="rankus-header-profile"
							onClick={() => navigate("/profile")}
						>
							<span className="rankus-header-profile-name">{user.name}</span>
						</div>
						<button className="rankus-header-logout-btn" onClick={logout}>
							로그아웃
						</button>
					</div>
				)}
			</div>
		</header>
	);
}

export default Header;
